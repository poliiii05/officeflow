<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\AppointmentActivityCreated;
use App\Events\UserNotificationChanged;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentActivity;
use App\Notifications\AppointmentReplyNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentActivityController extends Controller
{
    public function index(Request $request, Appointment $appointment): JsonResponse
    {
        $this->ensureAppointmentAccess($request, $appointment);

        $activities = $appointment->activities()
            ->with(['user:id,name,email,role'])
            ->when($request->user()->role === 'user', fn ($query) => $query->where('is_internal', false))
            ->oldest()
            ->get();

        return response()->json([
            'data' => $activities,
        ]);
    }

    public function store(Request $request, Appointment $appointment): JsonResponse
    {
        $this->ensureAppointmentAccess($request, $appointment);

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:3000'],
            'is_internal' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();
        $isStaff = in_array($user->role, ['staff', 'super_admin'], true);

        $activity = AppointmentActivity::create([
            'appointment_id' => $appointment->id,
            'user_id' => $user->id,
            'type' => $isStaff ? 'staff_reply' : 'requester_reply',
            'message' => $validated['message'],
            'is_internal' => $isStaff ? ($validated['is_internal'] ?? false) : false,
        ]);

        $activity->load(['user:id,name,email,role']);

        broadcast(new AppointmentActivityCreated($activity))->toOthers();

        if ($isStaff && ! $activity->is_internal && $appointment->requester_id !== $user->id) {
            $appointment->loadMissing('requester');

            $appointment->requester?->notify(new AppointmentReplyNotification($activity));

            broadcast(new UserNotificationChanged($appointment->requester_id))->toOthers();
        }

        return response()->json([
            'data' => $activity,
            'message' => 'Appointment activity added successfully.',
        ], 201);
    }

    private function ensureAppointmentAccess(Request $request, Appointment $appointment): void
    {
        $user = $request->user();

        if ($user->role === 'user' && $appointment->requester_id !== $user->id) {
            abort(403);
        }

        if (! in_array($user->role, ['user', 'staff', 'super_admin'], true)) {
            abort(403);
        }
    }
}