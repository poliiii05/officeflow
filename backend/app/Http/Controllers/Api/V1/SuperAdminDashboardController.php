<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\StaffShift;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperAdminDashboardController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $today = now()->toDateString();

        $staff = User::query()
            ->whereIn('role', ['staff', 'super_admin'])
            ->with(['notifications' => fn ($query) => $query->latest()->limit(1)])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'created_at']);

        $activeShifts = StaffShift::query()
            ->whereNull('ended_at')
            ->whereIn('user_id', $staff->pluck('id'))
            ->get()
            ->keyBy('user_id');

        $staffWorkload = $staff->map(function (User $staffUser) use ($activeShifts) {
            $activeTickets = Ticket::query()
                ->where('assigned_to_id', $staffUser->id)
                ->whereIn('status', ['open', 'in_progress'])
                ->count();

            $activeAppointments = Appointment::query()
                ->where('assigned_to_id', $staffUser->id)
                ->whereIn('status', ['pending', 'scheduled'])
                ->count();

            $shift = $activeShifts->get($staffUser->id);

            return [
                'id' => $staffUser->id,
                'name' => $staffUser->name,
                'email' => $staffUser->email,
                'role' => $staffUser->role,
                'is_on_duty' => (bool) $shift,
                'shift_started_at' => $shift?->started_at,
                'active_tickets' => $activeTickets,
                'active_appointments' => $activeAppointments,
                'active_total' => $activeTickets + $activeAppointments,
            ];
        })->values();

        $unassignedTickets = Ticket::query()
            ->whereNull('assigned_to_id')
            ->where('status', 'open')
            ->count();

        $pendingAppointments = Appointment::query()
            ->whereNull('assigned_to_id')
            ->where('status', 'pending')
            ->count();

        $resolvedTicketsToday = Ticket::query()
            ->whereIn('status', ['resolved', 'closed'])
            ->whereDate('resolved_at', $today)
            ->count();

        $completedAppointmentsToday = Appointment::query()
            ->where('status', 'completed')
            ->whereDate('updated_at', $today)
            ->count();

        return response()->json([
            'data' => [
                'totals' => [
                    'users' => User::where('role', 'user')->count(),
                    'staff' => $staff->count(),
                    'on_duty_staff' => $activeShifts->count(),
                    'queue_total' => $unassignedTickets + $pendingAppointments,
                    'unassigned_tickets' => $unassignedTickets,
                    'pending_appointments' => $pendingAppointments,
                    'resolved_today' => $resolvedTicketsToday + $completedAppointmentsToday,
                    'all_tickets' => Ticket::count(),
                    'all_appointments' => Appointment::count(),
                ],
                'staff_workload' => $staffWorkload,
            ],
        ]);
    }

    private function ensureSuperAdmin(Request $request): void
    {
        if ($request->user()->role !== 'super_admin') {
            abort(403, 'Only super admins can access this dashboard.');
        }
    }
}