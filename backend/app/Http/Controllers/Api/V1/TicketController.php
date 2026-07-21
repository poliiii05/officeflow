<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'max:50'],
            'priority' => ['nullable', 'in:low,medium,high,urgent'],
            'department' => ['nullable', 'string', 'max:100'],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $user = $request->user();

        $tickets = Ticket::query()
            ->with(['requester:id,name,email,requester_type', 'assignedTo:id,name,email'])
            ->when($user->role === 'user', fn ($query) => $query->where('requester_id', $user->id))
            ->when($validated['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($validated['priority'] ?? null, fn ($query, $priority) => $query->where('priority', $priority))
            ->when($validated['department'] ?? null, fn ($query, $department) => $query->where('department', $department))
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery
                        ->where('ticket_number', 'ilike', "%{$search}%")
                        ->orWhere('subject', 'ilike', "%{$search}%");
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

        return response()->json([
            'data' => $ticket->load(['requester:id,name,email,requester_type']),
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

    private function generateTicketNumber(): string
    {
        do {
            $number = 'TCK-'.now()->format('Ymd').'-'.random_int(1000, 9999);
        } while (Ticket::where('ticket_number', $number)->exists());

        return $number;
    }
}