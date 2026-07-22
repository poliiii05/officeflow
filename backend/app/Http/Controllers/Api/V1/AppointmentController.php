<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Events\AppointmentChanged;
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

        $validated = $request->validate([
            'status' => ['required', 'in:pending,scheduled,completed,cancelled'],
        ]);

        $updates = [
            'status' => $validated['status'],
            'cancelled_at' => $validated['status'] === 'cancelled' ? now() : null,
        ];

        if (
            in_array($validated['status'], ['scheduled', 'completed'], true) &&
            $appointment->assigned_to_id === null
        ) {
            $updates['assigned_to_id'] = $request->user()->id;
        }

        $appointment->update($updates);

        broadcast(new AppointmentChanged($appointment->fresh(), 'status_updated'))->toOthers();

        return response()->json([
            'data' => $appointment->load(['requester:id,name,email,requester_type', 'assignedTo:id,name,email']),
            'message' => 'Appointment status updated successfully.',
        ]);
    }

    private function generateAppointmentNumber(): string
    {
        do {
            $number = 'APT-'.now()->format('Ymd').'-'.random_int(1000, 9999);
        } while (Appointment::where('appointment_number', $number)->exists());

        return $number;
    }

    private function ensureStaffUser(Request $request): void
    {
        if (! in_array($request->user()->role, ['staff', 'super_admin'], true)) {
            abort(403, 'Only staff or super admin users can perform this action.');
        }
    }

    public function assign(Request $request, Appointment $appointment): JsonResponse
{
    $this->ensureStaffUser($request);

    if (
        $appointment->assigned_to_id !== null &&
        $appointment->assigned_to_id !== $request->user()->id
    ) {
        abort(409, 'This appointment has already been claimed by another staff member.');
    }

    if (! in_array($appointment->status, ['pending', 'scheduled'], true)) {
        abort(422, 'Only pending or scheduled appointments can be claimed.');
    }

    $appointment->update([
        'assigned_to_id' => $request->user()->id,
        'status' => 'scheduled',
    ]);

    broadcast(new AppointmentChanged($appointment->fresh(), 'assigned'))->toOthers();

    return response()->json([
        'data' => $appointment->load(['requester:id,name,email,requester_type', 'assignedTo:id,name,email']),
        'message' => 'Appointment claimed successfully.',
    ]);
}
}