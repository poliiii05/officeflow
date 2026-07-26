<?php

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\StaffShift;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AnalyticsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $days = min(max((int) $request->query('days', 7), 7), 30);
        $start = now()->startOfDay()->subDays($days - 1);
        $end = now()->endOfDay();
        $today = now()->toDateString();

        $ticketTrend = $this->countByDay(Ticket::query(), 'created_at', $start, $end);
        $appointmentTrend = $this->countByDay(Appointment::query(), 'created_at', $start, $end);

        $completedTicketTrend = $this->countByDay(
            Ticket::query()->whereIn('status', ['resolved', 'closed'])->whereNotNull('resolved_at'),
            'resolved_at',
            $start,
            $end
        );

        $completedAppointmentTrend = $this->countByDay(
            Appointment::query()->where('status', 'completed'),
            'updated_at',
            $start,
            $end
        );

        $trends = collect(range(0, $days - 1))->map(function (int $index) use (
            $start,
            $ticketTrend,
            $appointmentTrend,
            $completedTicketTrend,
            $completedAppointmentTrend
        ) {
            $date = $start->copy()->addDays($index);
            $key = $date->toDateString();

            return [
                'date' => $key,
                'label' => $date->format('M j'),
                'tickets' => $ticketTrend[$key] ?? 0,
                'appointments' => $appointmentTrend[$key] ?? 0,
                'completed' => ($completedTicketTrend[$key] ?? 0) + ($completedAppointmentTrend[$key] ?? 0),
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

        $activeTickets = Ticket::query()
            ->whereNotNull('assigned_to_id')
            ->whereIn('status', ['open', 'in_progress'])
            ->count();

        $activeAppointments = Appointment::query()
            ->whereNotNull('assigned_to_id')
            ->whereIn('status', ['pending', 'scheduled'])
            ->count();

        $completedToday = Ticket::query()
            ->whereIn('status', ['resolved', 'closed'])
            ->whereDate('resolved_at', $today)
            ->count()
            + Appointment::query()
                ->where('status', 'completed')
                ->whereDate('updated_at', $today)
                ->count();

        $staff = User::query()
            ->whereIn('role', ['staff', 'super_admin'])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        $activeShifts = StaffShift::query()
            ->whereNull('ended_at')
            ->whereIn('user_id', $staff->pluck('id'))
            ->get()
            ->keyBy('user_id');

        $staffLoad = $staff->map(function (User $staffUser) use ($activeShifts) {
            $tickets = Ticket::query()
                ->where('assigned_to_id', $staffUser->id)
                ->whereIn('status', ['open', 'in_progress'])
                ->count();

            $appointments = Appointment::query()
                ->where('assigned_to_id', $staffUser->id)
                ->whereIn('status', ['pending', 'scheduled'])
                ->count();

            return [
                'id' => $staffUser->id,
                'name' => $staffUser->name,
                'role' => $staffUser->role,
                'is_on_duty' => $activeShifts->has($staffUser->id),
                'tickets' => $tickets,
                'appointments' => $appointments,
                'total' => $tickets + $appointments,
            ];
        })->values();

        return response()->json([
            'data' => [
                'totals' => [
                    'tickets' => Ticket::count(),
                    'appointments' => Appointment::count(),
                    'queue_waiting' => $unassignedTickets + $pendingAppointments,
                    'active_assigned' => $activeTickets + $activeAppointments,
                    'completed_today' => $completedToday,
                    'staff_accounts' => $staff->count(),
                    'on_duty_staff' => $activeShifts->count(),
                ],
                'trends' => $trends,
                'ticket_statuses' => $this->statusBreakdown(Ticket::query(), ['open', 'in_progress', 'resolved', 'closed']),
                'appointment_statuses' => $this->statusBreakdown(Appointment::query(), ['pending', 'scheduled', 'completed', 'cancelled']),
                'staff_load' => $staffLoad,
            ],
        ]);
    }

    private function countByDay(Builder $query, string $column, Carbon $start, Carbon $end): array
    {
        return $query
            ->whereBetween($column, [$start, $end])
            ->selectRaw("DATE({$column}) as day, COUNT(*) as total")
            ->groupByRaw("DATE({$column})")
            ->pluck('total', 'day')
            ->mapWithKeys(fn ($total, $day) => [Carbon::parse($day)->toDateString() => (int) $total])
            ->all();
    }

    private function statusBreakdown(Builder $query, array $statuses): array
    {
        $counts = $query
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return collect($statuses)->map(fn (string $status) => [
            'status' => $status,
            'label' => str($status)->replace('_', ' ')->title()->toString(),
            'count' => (int) ($counts[$status] ?? 0),
        ])->values()->all();
    }

    private function ensureSuperAdmin(Request $request): void
    {
        if ($request->user()->role !== 'super_admin') {
            abort(403, 'Only super admins can access analytics.');
        }
    }
}