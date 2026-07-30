<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\StaffShift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffShiftController extends Controller
{
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
            'data' => [
                'is_on_duty' => (bool) $activeShift,
                'can_start_shift' => ! $activeShift && ! $todayShift,
                'has_shift_today' => (bool) $todayShift,
                'shift' => $activeShift,
                'today_shift' => $todayShift,
            ],
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
                'data' => [
                    'is_on_duty' => true,
                    'can_start_shift' => false,
                    'has_shift_today' => true,
                    'shift' => $existingShift,
                    'today_shift' => $existingShift,
                ],
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
                'data' => [
                    'is_on_duty' => false,
                    'can_start_shift' => false,
                    'has_shift_today' => true,
                    'shift' => null,
                    'today_shift' => $todayShift,
                ],
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
            'data' => [
                'is_on_duty' => true,
                'can_start_shift' => false,
                'has_shift_today' => true,
                'shift' => $shift,
                'today_shift' => $shift,
            ],
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
                'data' => [
                    'is_on_duty' => false,
                    'can_start_shift' => ! $todayShift,
                    'has_shift_today' => (bool) $todayShift,
                    'shift' => null,
                    'today_shift' => $todayShift,
                ],
                'message' => 'No active shift found.',
            ]);
        }

        $endReason = $validated['end_reason'] ?? 'end_shift';

        $shift->update([
            'ended_at' => now(),
            'status' => 'ended',
            'end_reason' => $endReason,
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
            'data' => [
                'is_on_duty' => false,
                'can_start_shift' => false,
                'has_shift_today' => true,
                'shift' => null,
                'today_shift' => $freshShift,
            ],
            'message' => 'Shift ended successfully.',
        ]);
    }

    private function ensureStaffUser(Request $request): void
    {
        if (! in_array($request->user()->role, ['staff', 'super_admin'], true)) {
            abort(403, 'Only staff or super admin users can manage shifts.');
        }
    }
}