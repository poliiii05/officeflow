<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StaffQueueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureStaffUser($request);

        $validated = $request->validate([
            // Added 'overdue' so the scope=overdue query no longer 422s. The
            // controller falls back to 'all' below if the request omits the
            // param entirely.
            'scope' => ['nullable', 'in:all,today,overdue'],
            'search' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:10'],
        ]);

        $scope = $validated['scope'] ?? 'all';
        $search = $validated['search'] ?? null;
        $perPage = $validated['per_page'] ?? 10;
        $page = $validated['page'] ?? 1;

        $ticketQueue = DB::table('tickets')
            ->leftJoin('users as requesters', 'requesters.id', '=', 'tickets.requester_id')
            ->selectRaw("'ticket' as kind, tickets.id, tickets.created_at")
            ->whereNull('tickets.assigned_to_id')
            ->where('tickets.status', 'open')
            ->when($scope === 'today', fn ($query) => $query->whereDate('tickets.created_at', now()->toDateString()))
            // A ticket is "overdue" once it has waited more than 24 hours in
            // the unclaimed/open queue. Adjust to subHours(N) if the office
            // wants a shorter SLA window.
            ->when($scope === 'overdue', fn ($query) => $query->where('tickets.created_at', '<', now()->subDay()))
            ->when($search, function ($query, $search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery
                        ->where('tickets.ticket_number', 'ilike', "%{$search}%")
                        ->orWhere('tickets.subject', 'ilike', "%{$search}%")
                        ->orWhere('tickets.department', 'ilike', "%{$search}%")
                        ->orWhere('tickets.category', 'ilike', "%{$search}%")
                        ->orWhere('requesters.name', 'ilike', "%{$search}%")
                        ->orWhere('requesters.email', 'ilike', "%{$search}%");
                });
            });

        $appointmentQueue = DB::table('appointments')
            ->leftJoin('users as requesters', 'requesters.id', '=', 'appointments.requester_id')
            ->selectRaw("'appointment' as kind, appointments.id, appointments.created_at")
            ->whereNull('appointments.assigned_to_id')
            ->where('appointments.status', 'pending')
            ->when($scope === 'today', fn ($query) => $query->whereDate('appointments.created_at', now()->toDateString()))
            // Appointments are "overdue" once their scheduled time has passed
            // while they're still pending and unclaimed.
            ->when($scope === 'overdue', fn ($query) => $query->where('appointments.scheduled_at', '<', now()))
            ->when($search, function ($query, $search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery
                        ->where('appointments.appointment_number', 'ilike', "%{$search}%")
                        ->orWhere('appointments.purpose', 'ilike', "%{$search}%")
                        ->orWhere('appointments.department', 'ilike', "%{$search}%")
                        ->orWhere('requesters.name', 'ilike', "%{$search}%")
                        ->orWhere('requesters.email', 'ilike', "%{$search}%");
                });
            });

        $queue = $ticketQueue->unionAll($appointmentQueue);

        $paginator = DB::query()
            ->fromSub($queue, 'queue_items')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage, ['*'], 'page', $page);

        $queueRows = collect($paginator->items());

        $ticketIds = $queueRows
            ->where('kind', 'ticket')
            ->pluck('id')
            ->all();

        $appointmentIds = $queueRows
            ->where('kind', 'appointment')
            ->pluck('id')
            ->all();

        $tickets = Ticket::query()
            ->with(['requester:id,name,email,requester_type', 'assignedTo:id,name,email'])
            ->whereIn('id', $ticketIds)
            ->get()
            ->keyBy('id');

        $appointments = Appointment::query()
            ->with(['requester:id,name,email,requester_type', 'assignedTo:id,name,email'])
            ->whereIn('id', $appointmentIds)
            ->get()
            ->keyBy('id');

        $items = $queueRows
            ->map(function ($queueItem) use ($tickets, $appointments) {
                $record = $queueItem->kind === 'ticket'
                    ? $tickets->get($queueItem->id)
                    : $appointments->get($queueItem->id);

                if (! $record) {
                    return null;
                }

                return [
                    'kind' => $queueItem->kind,
                    'data' => $record,
                ];
            })
            ->filter()
            ->values();

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    private function ensureStaffUser(Request $request): void
    {
        if (! in_array($request->user()->role, ['staff', 'super_admin'], true)) {
            abort(403, 'Only staff users can access the service queue.');
        }
    }
}