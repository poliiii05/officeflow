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

        $shift = StaffShift::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('ended_at')
            ->latest('started_at')
            ->first();

        return response()->json([
            'data' => [
                'is_on_duty' => (bool) $shift,
                'shift' => $shift,
            ],
        ]);
    }

    public function start(Request $request): JsonResponse
    {
        $this->ensureStaffUser($request);

        $existingShift = StaffShift::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('ended_at')
            ->first();

        if ($existingShift) {
            return response()->json([
                'data' => [
                    'is_on_duty' => true,
                    'shift' => $existingShift,
                ],
                'message' => 'You are already on duty.',
            ]);
        }

        $shift = StaffShift::create([
            'user_id' => $request->user()->id,
            'started_at' => now(),
            'status' => 'active',
        ]);

        AuditLog::record(
            $request->user(),
            'staff_shifts',
            'shift_started',
            "{$request->user()->name} started a staff shift.",
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
                'shift' => $shift,
            ],
            'message' => 'Shift started successfully.',
        ], 201);
    }

    public function end(Request $request): JsonResponse
    {
        $this->ensureStaffUser($request);

        $shift = StaffShift::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('ended_at')
            ->latest('started_at')
            ->first();

        if (! $shift) {
            return response()->json([
                'data' => [
                    'is_on_duty' => false,
                    'shift' => null,
                ],
                'message' => 'No active shift found.',
            ]);
        }

        $shift->update([
            'ended_at' => now(),
            'status' => 'ended',
        ]);

        $freshShift = $shift->fresh();

        AuditLog::record(
            $request->user(),
            'staff_shifts',
            'shift_ended',
            "{$request->user()->name} ended a staff shift.",
            $freshShift,
            [
                'shift_id' => $freshShift->id,
                'started_at' => $freshShift->started_at,
                'ended_at' => $freshShift->ended_at,
            ],
            $request
        );

        return response()->json([
            'data' => [
                'is_on_duty' => false,
                'shift' => $freshShift,
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