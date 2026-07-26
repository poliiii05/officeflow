<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\TicketChanged;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'queue' => ['nullable', 'in:unassigned,mine,resolved_today,all'],
            'status' => ['nullable', 'in:open,in_progress,resolved,closed'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'department' => ['nullable', 'string', 'max:100'],
            'search' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $user = $request->user();

        $tickets = Ticket::query()
            ->with(['requester:id,name,email,requester_type', 'assignedTo:id,name,email'])
            ->when($user->role === 'user', fn ($query) => $query->where('requester_id', $user->id))
            ->when($user->role !== 'user', function ($query) use ($validated, $user) {
                match ($validated['queue'] ?? 'all') {
                    'unassigned' => $query
                        ->whereNull('assigned_to_id')
                        ->where('status', 'open'),

                    'mine' => $query
                        ->where('assigned_to_id', $user->id)
                        ->whereIn('status', ['open', 'in_progress']),

                    'resolved_today' => $query
                        ->whereIn('status', ['resolved', 'closed'])
                        ->whereDate('resolved_at', now()->toDateString()),

                    default => $query,
                };
            })
            ->when($validated['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($validated['priority'] ?? null, fn ($query, $priority) => $query->where('priority', $priority))
            ->when($validated['department'] ?? null, fn ($query, $department) => $query->where('department', $department))
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery
                        ->where('ticket_number', 'ilike', "%{$search}%")
                        ->orWhere('subject', 'ilike', "%{$search}%")
                        ->orWhere('department', 'ilike', "%{$search}%")
                        ->orWhere('category', 'ilike', "%{$search}%")
                        ->orWhereHas('requester', function ($requesterQuery) use ($search) {
                            $requesterQuery
                                ->where('name', 'ilike', "%{$search}%")
                                ->orWhere('email', 'ilike', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'data' => $tickets->items(),
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'department' => ['required', 'string', 'max:100'],
            'category' => ['required', 'string', 'max:100'],
            'priority' => ['required', 'in:low,medium,high,urgent'],
        ]);

        $ticket = Ticket::create([
            ...$validated,
            'requester_id' => Auth::id(),
            'ticket_number' => $this->generateTicketNumber(),
            'status' => 'open',
        ]);

        AuditLog::record(
            $request->user(),
            'tickets',
            'created',
            "{$request->user()->name} created ticket {$ticket->ticket_number}.",
            $ticket,
            [
                'ticket_number' => $ticket->ticket_number,
                'subject' => $ticket->subject,
                'department' => $ticket->department,
                'category' => $ticket->category,
                'priority' => $ticket->priority,
            ],
            $request
        );

        broadcast(new TicketChanged($ticket, 'created'))->toOthers();

        return response()->json([
            'data' => $ticket->load(['requester:id,name,email,requester_type', 'assignedTo:id,name,email']),
            'message' => 'Ticket created successfully.',
        ], 201);
    }

    public function show(Request $request, Ticket $ticket): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'user' && $ticket->requester_id !== $user->id) {
            abort(403);
        }

        return response()->json([
            'data' => $ticket->load(['requester:id,name,email,requester_type', 'assignedTo:id,name,email']),
        ]);
    }

    public function updateStatus(Request $request, Ticket $ticket): JsonResponse
    {
        $this->ensureStaffUser($request);

        $validated = $request->validate([
            'status' => ['required', 'in:open,in_progress,resolved,closed'],
        ]);

        $oldStatus = $ticket->status;
        $oldAssignedToId = $ticket->assigned_to_id;

        $updates = [
            'status' => $validated['status'],
            'resolved_at' => in_array($validated['status'], ['resolved', 'closed'], true) ? now() : null,
        ];

        if (
            in_array($validated['status'], ['in_progress', 'resolved', 'closed'], true) &&
            $ticket->assigned_to_id === null
        ) {
            $updates['assigned_to_id'] = $request->user()->id;
        }

        $ticket->update($updates);

        $freshTicket = $ticket->fresh();

        AuditLog::record(
            $request->user(),
            'tickets',
            'status_updated',
            "{$request->user()->name} changed ticket {$freshTicket->ticket_number} from {$oldStatus} to {$freshTicket->status}.",
            $freshTicket,
            [
                'ticket_number' => $freshTicket->ticket_number,
                'old_status' => $oldStatus,
                'new_status' => $freshTicket->status,
                'old_assigned_to_id' => $oldAssignedToId,
                'new_assigned_to_id' => $freshTicket->assigned_to_id,
            ],
            $request
        );

        broadcast(new TicketChanged($freshTicket, 'status_updated'))->toOthers();

        return response()->json([
            'data' => $freshTicket->load(['requester:id,name,email,requester_type', 'assignedTo:id,name,email']),
            'message' => 'Ticket status updated successfully.',
        ]);
    }

    public function assign(Request $request, Ticket $ticket): JsonResponse
    {
        $this->ensureStaffUser($request);

        $validated = $request->validate([
            'assigned_to_id' => ['nullable', 'exists:users,id'],
        ]);

        $oldAssignedToId = $ticket->assigned_to_id;
        $newAssignedToId = $validated['assigned_to_id'] ?? null;

        $ticket->update([
            'assigned_to_id' => $newAssignedToId,
        ]);

        $freshTicket = $ticket->fresh();

        AuditLog::record(
            $request->user(),
            'tickets',
            'assignment_updated',
            "{$request->user()->name} updated ticket {$freshTicket->ticket_number} assignment.",
            $freshTicket,
            [
                'ticket_number' => $freshTicket->ticket_number,
                'old_assigned_to_id' => $oldAssignedToId,
                'new_assigned_to_id' => $freshTicket->assigned_to_id,
            ],
            $request
        );

        broadcast(new TicketChanged($freshTicket, 'assigned'))->toOthers();

        return response()->json([
            'data' => $freshTicket->load(['requester:id,name,email,requester_type', 'assignedTo:id,name,email']),
            'message' => 'Ticket assignment updated successfully.',
        ]);
    }

    private function generateTicketNumber(): string
    {
        do {
            $number = 'TCK-'.now()->format('Ymd').'-'.random_int(1000, 9999);
        } while (Ticket::where('ticket_number', $number)->exists());

        return $number;
    }

    private function ensureStaffUser(Request $request): void
    {
        if (! in_array($request->user()->role, ['staff', 'super_admin'], true)) {
            abort(403, 'Only staff or super admin users can perform this action.');
        }
    }
}