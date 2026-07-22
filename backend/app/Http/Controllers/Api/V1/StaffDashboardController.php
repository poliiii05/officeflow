<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Ticket;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffDashboardController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $this->ensureStaffUser($request);

        $validated = $request->validate([
            'view' => ['nullable', 'in:unassigned,mine,resolved_today,all'],
            'search' => ['nullable', 'string', 'max:100'],
            'ticket_page' => ['nullable', 'integer', 'min:1'],
            'appointment_page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $user = $request->user();
        $view = $validated['view'] ?? 'unassigned';
        $search = $validated['search'] ?? null;
        $perPage = $validated['per_page'] ?? 10;

        $tickets = $this->ticketQuery($view, $user->id, $search)
            ->latest()
            ->paginate($perPage, ['*'], 'ticket_page', $validated['ticket_page'] ?? 1);

        $appointments = $this->appointmentQuery($view, $user->id, $search)
            ->latest('scheduled_at')
            ->paginate($perPage, ['*'], 'appointment_page', $validated['appointment_page'] ?? 1);

        $myActiveTickets = Ticket::where('assigned_to_id', $user->id)
            ->whereIn('status', ['open', 'in_progress'])
            ->count();

        $myActiveAppointments = Appointment::where('assigned_to_id', $user->id)
            ->whereIn('status', ['pending', 'scheduled'])
            ->count();

        $unassignedTickets = Ticket::whereNull('assigned_to_id')
            ->where('status', 'open')
            ->count();

        $pendingAppointments = Appointment::whereNull('assigned_to_id')
            ->where('status', 'pending')
            ->count();

        $resolvedToday = Ticket::whereIn('status', ['resolved', 'closed'])
            ->whereDate('resolved_at', now()->toDateString())
            ->count()
            + Appointment::where('status', 'completed')
                ->whereDate('updated_at', now()->toDateString())
                ->count();

        return response()->json([
            'data' => [
                'tickets' => $this->paginationPayload($tickets),
                'appointments' => $this->paginationPayload($appointments),
                'totals' => [
                    'queueTotal' => $unassignedTickets + $pendingAppointments,
                    'myWorkTotal' => $myActiveTickets + $myActiveAppointments,
                    'resolvedToday' => $resolvedToday,
                    'allRecords' => Ticket::count() + Appointment::count(),
                    'myActiveTickets' => $myActiveTickets,
                    'myActiveAppointments' => $myActiveAppointments,
                    'unassignedTickets' => $unassignedTickets,
                    'pendingAppointments' => $pendingAppointments,
                ],
            ],
        ]);
    }

    private function ticketQuery(string $view, int $userId, ?string $search): Builder
    {
        return Ticket::query()
            ->with(['requester:id,name,email,requester_type', 'assignedTo:id,name,email'])
            ->when($view === 'unassigned', fn ($query) => $query
                ->whereNull('assigned_to_id')
                ->where('status', 'open'))
            ->when($view === 'mine', fn ($query) => $query
                ->where('assigned_to_id', $userId)
                ->whereIn('status', ['open', 'in_progress']))
            ->when($view === 'resolved_today', fn ($query) => $query
                ->whereIn('status', ['resolved', 'closed'])
                ->whereDate('resolved_at', now()->toDateString()))
            ->when($search, function ($query, $search) {
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
            });
    }

    private function appointmentQuery(string $view, int $userId, ?string $search): Builder
    {
        return Appointment::query()
            ->with(['requester:id,name,email,requester_type', 'assignedTo:id,name,email'])
            ->when($view === 'unassigned', fn ($query) => $query
                ->whereNull('assigned_to_id')
                ->where('status', 'pending'))
            ->when($view === 'mine', fn ($query) => $query
                ->where('assigned_to_id', $userId)
                ->whereIn('status', ['pending', 'scheduled']))
            ->when($view === 'resolved_today', fn ($query) => $query
                ->where('status', 'completed')
                ->whereDate('updated_at', now()->toDateString()))
            ->when($search, function ($query, $search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery
                        ->where('appointment_number', 'ilike', "%{$search}%")
                        ->orWhere('purpose', 'ilike', "%{$search}%")
                        ->orWhere('department', 'ilike', "%{$search}%")
                        ->orWhereHas('requester', function ($requesterQuery) use ($search) {
                            $requesterQuery
                                ->where('name', 'ilike', "%{$search}%")
                                ->orWhere('email', 'ilike', "%{$search}%");
                        });
                });
            });
    }

    private function paginationPayload($paginator): array
    {
        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    private function ensureStaffUser(Request $request): void
    {
        if (! in_array($request->user()->role, ['staff', 'super_admin'], true)) {
            abort(403, 'Only staff or super admin users can access this dashboard.');
        }
    }
}