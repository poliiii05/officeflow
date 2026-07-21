<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'max:50'],
            'department' => ['nullable', 'string', 'max:100'],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $user = $request->user();

        $appointments = Appointment::query()
            ->with(['requester:id,name,email,requester_type', 'assignedTo:id,name,email'])
            ->when($user->role === 'user', fn ($query) => $query->where('requester_id', $user->id))
            ->when($validated['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($validated['department'] ?? null, fn ($query, $department) => $query->where('department', $department))
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery
                        ->where('appointment_number', 'ilike', "%{$search}%")
                        ->orWhere('purpose', 'ilike', "%{$search}%");
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

        return response()->json([
            'data' => $appointment->load(['requester:id,name,email,requester_type']),
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

    private function generateAppointmentNumber(): string
    {
        do {
            $number = 'APT-'.now()->format('Ymd').'-'.random_int(1000, 9999);
        } while (Appointment::where('appointment_number', $number)->exists());

        return $number;
    }
}