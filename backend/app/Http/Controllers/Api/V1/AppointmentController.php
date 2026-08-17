<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\AppointmentActivityCreated;
use App\Events\AppointmentChanged;
use App\Events\UserNotificationChanged;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentActivity;
use App\Models\AuditLog;
use App\Notifications\AppointmentReplyNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\StaffShift;

class AppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'queue' => ['nullable', 'in:pending,scheduled,completed_today,all'],
            'status' => ['nullable', 'in:pending,scheduled,completed,cancelled'],
            'department' => ['nullable', 'string', 'max:100'],
            'search' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);

        $user = $request->user();

        $appointments = Appointment::query()
            ->with(['requester:id,name,email,requester_type', 'assignedTo:id,name,email'])
            ->when($user->role === 'user', fn ($query) => $query->where('requester_id', $user->id))
            ->when($user->role !== 'user', function ($query) use ($validated) {
                match ($validated['queue'] ?? 'all') {
                    'pending' => $query->where('status', 'pending'),
                    'scheduled' => $query->where('status', 'scheduled'),
                    'completed_today' => $query
                        ->where('status', 'completed')
                        ->whereDate('updated_at', now()->toDateString()),
                    default => $query,
                };
            })
            ->when($validated['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($validated['department'] ?? null, fn ($query, $department) => $query->where('department', $department))
            ->when($validated['date_from'] ?? null,fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when( $validated['date_to'] ?? null,fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->when($validated['search'] ?? null, function ($query, $search) {
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
            })
            ->latest('scheduled_at')
            ->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'data' => $appointments->items(),
            'meta' => [
                'current_page' => $appointments->currentPage(),
                'last_page' => $appointments->lastPage(),
                'per_page' => $appointments->perPage(),
                'total' => $appointments->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'purpose' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'department' => ['required', 'string', 'max:100'],
            'scheduled_at' => ['required', 'date', 'after:now'],
        ]);

        $appointment = Appointment::create([
            ...$validated,
            'requester_id' => Auth::id(),
            'appointment_number' => $this->generateAppointmentNumber(),
            'status' => 'pending',
        ]);

        AuditLog::record(
            $request->user(),
            'appointments',
            'created',
            "{$request->user()->name} booked appointment {$appointment->appointment_number}.",
            $appointment,
            [
                'appointment_number' => $appointment->appointment_number,
                'purpose' => $appointment->purpose,
                'department' => $appointment->department,
                'scheduled_at' => $appointment->scheduled_at,
            ],
            $request
        );

        broadcast(new AppointmentChanged($appointment, 'created'))->toOthers();

        return response()->json([
            'data' => $appointment->load(['requester:id,name,email,requester_type', 'assignedTo:id,name,email']),
            'message' => 'Appointment booked successfully.',
        ], 201);
    }

    public function show(Request $request, Appointment $appointment): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'user' && $appointment->requester_id !== $user->id) {
            abort(403);
        }

        return response()->json([
            'data' => $appointment->load(['requester:id,name,email,requester_type', 'assignedTo:id,name,email']),
        ]);
    }

    public function updateStatus(Request $request, Appointment $appointment): JsonResponse
{
    $this->ensureStaffUser($request);

    $user = $request->user();

    if ($user->role === 'staff' && $appointment->assigned_to_id !== $user->id) {
        abort(403, 'You can only update appointments assigned to you.');
    }

    $validated = $request->validate([
        'status' => ['required', 'in:pending,scheduled,completed,cancelled'],
    ]);

    $oldStatus = $appointment->status;
    $oldAssignedToId = $appointment->assigned_to_id;

    $updates = [
        'status' => $validated['status'],
        'cancelled_at' => $validated['status'] === 'cancelled' ? now() : null,
    ];

    // A staff member who schedules or completes an unassigned appointment
    // becomes its assigned staff member. Super admins assign through assign().
    if (
        $user->role === 'staff' &&
        in_array($validated['status'], ['scheduled', 'completed'], true) &&
        $appointment->assigned_to_id === null
    ) {
        $updates['assigned_to_id'] = $user->id;
    }

    $appointment->update($updates);

    $freshAppointment = $appointment->fresh();

    $this->recordVisibleActivity(
        $request,
        $freshAppointment,
        'status_update',
        'Appointment status changed to '.$freshAppointment->status.'.'
    );

    AuditLog::record(
        $user,
        'appointments',
        'status_updated',
        "{$user->name} changed appointment {$freshAppointment->appointment_number} from {$oldStatus} to {$freshAppointment->status}.",
        $freshAppointment,
        [
            'appointment_number' => $freshAppointment->appointment_number,
            'old_status' => $oldStatus,
            'new_status' => $freshAppointment->status,
            'old_assigned_to_id' => $oldAssignedToId,
            'new_assigned_to_id' => $freshAppointment->assigned_to_id,
        ],
        $request
    );

    broadcast(new AppointmentChanged($freshAppointment, 'status_updated'))->toOthers();

    return response()->json([
        'data' => $freshAppointment->load([
            'requester:id,name,email,requester_type',
            'assignedTo:id,name,email',
        ]),
        'message' => 'Appointment status updated successfully.',
    ]);
}

public function assign(Request $request, Appointment $appointment): JsonResponse
{
    $this->ensureStaffUser($request);

    $user = $request->user();
    $isSuperAdmin = $user->role === 'super_admin';

    $validated = $request->validate([
        'assigned_to_id' => ['nullable', 'integer', 'exists:users,id'],
    ]);

    $hasAssignedToId = $request->has('assigned_to_id');

    if ($isSuperAdmin && ! $hasAssignedToId) {
        abort(422, 'Choose a staff member before updating the appointment assignment.');
    }

    if (
        ! $isSuperAdmin &&
        $hasAssignedToId &&
        ($validated['assigned_to_id'] ?? null) !== $user->id
    ) {
        abort(403, 'Staff members can only claim appointments for themselves.');
    }

    if (! in_array($appointment->status, ['pending', 'scheduled'], true)) {
        abort(422, 'Only pending or scheduled appointments can be assigned.');
    }

    $oldStatus = $appointment->status;
    $oldAssignedToId = $appointment->assigned_to_id;

    $assignedToId = $isSuperAdmin
        ? ($validated['assigned_to_id'] ?? null)
        : $user->id;

    $assignedTo = $assignedToId
    ? User::find($assignedToId)
    : null;

    if ($assignedTo !== null) {
        $this->ensureAssignableStaff($assignedTo);
    }

    $updates = [
        'assigned_to_id' => $assignedToId,
    ];

    if ($assignedToId === null) {
        $updates['status'] = 'pending';
        $updates['cancelled_at'] = null;
    } elseif ($appointment->status === 'pending') {
        $updates['status'] = 'scheduled';
    }

    $appointment->update($updates);

    $freshAppointment = $appointment->fresh();

    $activityMessage = $assignedTo
        ? 'Appointment was assigned to '.$assignedTo->name.'.'
        : 'Appointment was returned to the unassigned queue.';

    $this->recordVisibleActivity(
        $request,
        $freshAppointment,
        $assignedTo ? 'assigned' : 'unassigned',
        $activityMessage
    );

    AuditLog::record(
        $user,
        'appointments',
        'assignment_updated',
        "{$user->name} updated the assignment for appointment {$freshAppointment->appointment_number}.",
        $freshAppointment,
        [
            'appointment_number' => $freshAppointment->appointment_number,
            'old_status' => $oldStatus,
            'new_status' => $freshAppointment->status,
            'old_assigned_to_id' => $oldAssignedToId,
            'new_assigned_to_id' => $freshAppointment->assigned_to_id,
            'assigned_to_name' => $assignedTo?->name,
        ],
        $request
    );

    broadcast(new AppointmentChanged($freshAppointment, 'assignment_updated'))->toOthers();

    return response()->json([
        'data' => $freshAppointment->load([
            'requester:id,name,email,requester_type',
            'assignedTo:id,name,email',
        ]),
        'message' => $assignedTo
            ? 'Appointment assignment updated successfully.'
            : 'Appointment returned to the queue successfully.',
    ]);
}

    private function recordVisibleActivity(
        Request $request,
        Appointment $appointment,
        string $type,
        string $message
    ): void {
        $activity = AppointmentActivity::create([
            'appointment_id' => $appointment->id,
            'user_id' => $request->user()->id,
            'type' => $type,
            'message' => $message,
            'is_internal' => false,
        ]);

        $activity->load(['user:id,name,email,role']);

        broadcast(new AppointmentActivityCreated($activity))->toOthers();

        if ($appointment->requester_id !== $request->user()->id) {
            $appointment->loadMissing('requester');

            $appointment->requester?->notify(new AppointmentReplyNotification($activity));

            broadcast(new UserNotificationChanged($appointment->requester_id))->toOthers();
        }
    }

    private function generateAppointmentNumber(): string
    {
        do {
            $number = 'APT-'.now()->format('Ymd').'-'.random_int(1000, 9999);
        } while (Appointment::where('appointment_number', $number)->exists());

        return $number;
    }

   private function ensureAssignableStaff(User $staff): void
{
    if ($staff->role !== 'staff') {
        abort(422, 'Appointments can only be assigned to staff accounts.');
    }

    $isOnDuty = StaffShift::query()
        ->where('user_id', $staff->id)
        ->whereNull('ended_at')
        ->exists();

    if (! $isOnDuty) {
        abort(422, 'Appointments can only be assigned to staff who are currently on duty.');
    }
}

    private function ensureStaffUser(Request $request): void
    {
        $user = $request->user();

        if (! in_array($user->role, ['staff', 'super_admin'], true)) {
            abort(403, 'Only staff or super admin users can perform this action.');
        }

        if ($user->role === 'staff') {
            $isOnDuty = StaffShift::query()
                ->where('user_id', $user->id)
                ->whereNull('ended_at')
                ->exists();

            if (! $isOnDuty) {
                abort(403, 'Start your shift before claiming appointments or updating their status.');
            }
        }
    }
}