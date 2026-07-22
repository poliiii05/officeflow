<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
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

        return response()->json([
            'data' => [
                'is_on_duty' => false,
                'shift' => $shift->fresh(),
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