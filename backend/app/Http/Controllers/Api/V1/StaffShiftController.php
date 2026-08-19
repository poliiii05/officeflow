<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\StaffShift;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffShiftController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureStaffUser($request);

        $validated = $request->validate([
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:10'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);

        $user = $request->user();
        $perPage = (int) ($validated['per_page'] ?? 10);

        $shifts = StaffShift::query()
            ->where('user_id', $user->id)
            ->when(
                $validated['date_from'] ?? null,
                fn ($query, $date) => $query->whereDate('started_at', '>=', $date)
            )
            ->when(
                $validated['date_to'] ?? null,
                fn ($query, $date) => $query->whereDate('started_at', '<=', $date)
            )
            ->latest('started_at')
            ->paginate($perPage);

        $items = $shifts->getCollection()->map(function (StaffShift $shift) use ($user) {
            $summary = $this->completionSummary($shift, $user->id);

            return [
                'id' => $shift->id,
                'user_id' => $shift->user_id,
                'started_at' => $shift->started_at,
                'ended_at' => $shift->ended_at,
                'status' => $shift->status,
                'end_reason' => $shift->end_reason,
                'duration_minutes' => $summary['duration_minutes'],
                'completed_tickets' => $summary['completed_tickets'],
                'completed_appointments' => $summary['completed_appointments'],
                'completed_total' => $summary['completed_total'],
                'created_at' => $shift->created_at,
                'updated_at' => $shift->updated_at,
            ];
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $shifts->currentPage(),
                'last_page' => $shifts->lastPage(),
                'per_page' => $shifts->perPage(),
                'total' => $shifts->total(),
            ],
        ]);
    }

    public function current(Request $request): JsonResponse
    {
        $this->ensureStaffUser($request);

        $user = $request->user();

        $activeShift = StaffShift::query()
            ->where('user_id', $user->id)
            ->whereNull('ended_at')
            ->latest('started_at')
            ->first();

        $todayShift = StaffShift::query()
            ->where('user_id', $user->id)
            ->whereDate('started_at', now()->toDateString())
            ->latest('started_at')
            ->first();

        return response()->json([
            'data' => $this->shiftStatePayload($activeShift, $todayShift, $user->id),
        ]);
    }

    public function start(Request $request): JsonResponse
    {
        $this->ensureStaffUser($request);

        $user = $request->user();

        $existingShift = StaffShift::query()
            ->where('user_id', $user->id)
            ->whereNull('ended_at')
            ->first();

        if ($existingShift) {
            return response()->json([
                'data' => $this->shiftStatePayload($existingShift, $existingShift, $user->id),
                'message' => 'You are already on duty.',
            ]);
        }

        $todayShift = StaffShift::query()
            ->where('user_id', $user->id)
            ->whereDate('started_at', now()->toDateString())
            ->latest('started_at')
            ->first();

        if ($todayShift) {
            return response()->json([
                'data' => $this->shiftStatePayload(null, $todayShift, $user->id),
                'message' => 'Your shift for today is already recorded.',
            ], 422);
        }

        $shift = StaffShift::create([
            'user_id' => $user->id,
            'started_at' => now(),
            'status' => 'active',
        ]);

        AuditLog::record(
            $user,
            'staff_shifts',
            'shift_started',
            "{$user->name} started a staff shift.",
            $shift,
            [
                'shift_id' => $shift->id,
                'started_at' => $shift->started_at,
            ],
            $request
        );

        return response()->json([
            'data' => $this->shiftStatePayload($shift, $shift, $user->id),
            'message' => 'Shift started successfully.',
        ], 201);
    }

    public function end(Request $request): JsonResponse
    {
        $this->ensureStaffUser($request);

        $validated = $request->validate([
            'end_reason' => ['nullable', 'in:early_out,end_shift'],
        ]);

        $user = $request->user();

        $shift = StaffShift::query()
            ->where('user_id', $user->id)
            ->whereNull('ended_at')
            ->latest('started_at')
            ->first();

        if (! $shift) {
            $todayShift = StaffShift::query()
                ->where('user_id', $user->id)
                ->whereDate('started_at', now()->toDateString())
                ->latest('started_at')
                ->first();

            return response()->json([
                'data' => $this->shiftStatePayload(null, $todayShift, $user->id),
                'message' => 'No active shift found.',
            ]);
        }

        $shift->update([
            'ended_at' => now(),
            'status' => 'ended',
            'end_reason' => $validated['end_reason'] ?? 'end_shift',
        ]);

        $freshShift = $shift->fresh();

        AuditLog::record(
            $user,
            'staff_shifts',
            'shift_ended',
            "{$user->name} ended a staff shift.",
            $freshShift,
            [
                'shift_id' => $freshShift->id,
                'started_at' => $freshShift->started_at,
                'ended_at' => $freshShift->ended_at,
                'end_reason' => $freshShift->end_reason,
            ],
            $request
        );

        return response()->json([
            'data' => $this->shiftStatePayload(null, $freshShift, $user->id),
            'message' => 'Shift ended successfully.',
        ]);
    }

    private function shiftStatePayload(
        ?StaffShift $activeShift,
        ?StaffShift $todayShift,
        int $userId
    ): array {
        return [
            'is_on_duty' => (bool) $activeShift,
            'can_start_shift' => ! $activeShift && ! $todayShift,
            'has_shift_today' => (bool) $todayShift,
            'shift' => $activeShift,
            'today_shift' => $todayShift,
            'today_summary' => $this->completionSummary($todayShift, $userId),
        ];
    }

    private function completionSummary(?StaffShift $shift, int $userId): ?array
    {
        if (! $shift || ! $shift->started_at) {
            return null;
        }

        $startedAt = $shift->started_at;
        $endedAt = $shift->ended_at ?? now();

        $completedTickets = Ticket::query()
            ->where('assigned_to_id', $userId)
            ->whereIn('status', ['resolved', 'closed'])
            ->whereBetween('updated_at', [$startedAt, $endedAt])
            ->count();

        $completedAppointments = Appointment::query()
            ->where('assigned_to_id', $userId)
            ->where('status', 'completed')
            ->whereBetween('updated_at', [$startedAt, $endedAt])
            ->count();

        return [
            'duration_minutes' => (int) $startedAt->diffInMinutes($endedAt),
            'completed_tickets' => $completedTickets,
            'completed_appointments' => $completedAppointments,
            'completed_total' => $completedTickets + $completedAppointments,
        ];
    }

    private function ensureStaffUser(Request $request): void
    {
        if (! in_array($request->user()->role, ['staff', 'super_admin'], true)) {
            abort(403, 'Only staff or super admin users can manage shifts.');
        }
    }
}