<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Ticket;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class StaffAnalyticsController extends Controller
{
    public function productivity(Request $request): JsonResponse
    {
        $this->ensureStaffUser($request);

        $validated = $request->validate([
            'days' => ['nullable', 'integer', 'in:7,14,30'],
        ]);

        $days = $validated['days'] ?? 7;
        $user = $request->user();

        $start = now()->startOfDay()->subDays($days - 1);
        $end = now()->endOfDay();

        $ticketTrend = $this->countByDay(
            Ticket::query()
                ->where('assigned_to_id', $user->id)
                ->whereIn('status', ['resolved', 'closed'])
                ->whereNotNull('resolved_at'),
            'resolved_at',
            $start,
            $end
        );

        $appointmentTrend = $this->countByDay(
            Appointment::query()
                ->where('assigned_to_id', $user->id)
                ->where('status', 'completed'),
            'updated_at',
            $start,
            $end
        );

        $labels = [];
        $ticketsResolved = [];
        $appointmentsCompleted = [];

        foreach (range(0, $days - 1) as $index) {
            $date = $start->copy()->addDays($index);
            $key = $date->toDateString();

            $labels[] = $date->format('M j');
            $ticketsResolved[] = $ticketTrend[$key] ?? 0;
            $appointmentsCompleted[] = $appointmentTrend[$key] ?? 0;
        }

        return response()->json([
            'data' => [
                'days' => $days,
                'labels' => $labels,
                'tickets_resolved' => $ticketsResolved,
                'appointments_completed' => $appointmentsCompleted,
                'totals' => [
                    'tickets_resolved' => array_sum($ticketsResolved),
                    'appointments_completed' => array_sum($appointmentsCompleted),
                    'completed' => array_sum($ticketsResolved) + array_sum($appointmentsCompleted),
                ],
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
            ->mapWithKeys(fn ($total, $day) => [
                Carbon::parse($day)->toDateString() => (int) $total,
            ])
            ->all();
    }

    private function ensureStaffUser(Request $request): void
    {
        if (! in_array($request->user()->role, ['staff', 'super_admin'], true)) {
            abort(403, 'Only staff or super admin users can access staff analytics.');
        }
    }
}