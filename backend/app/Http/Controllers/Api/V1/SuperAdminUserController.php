<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\StaffShift;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SuperAdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', 'in:user,staff,super_admin'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $users = User::query()
            ->select([
                'id',
                'name',
                'email',
                'role',
                'requester_type',
                'email_verified_at',
                'terms_accepted_at',
                'created_at',
                'updated_at',
            ])
            ->when($validated['role'] ?? null, fn ($query, $role) => $query->where('role', $role))
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery
                        ->where('name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%")
                        ->orWhere('role', 'ilike', "%{$search}%")
                        ->orWhere('requester_type', 'ilike', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 10, ['*'], 'page', $validated['page'] ?? 1);

        return response()->json([
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function assignableStaff(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $activeStaffIds = StaffShift::query()
            ->whereNull('ended_at')
            ->pluck('user_id');

        $staff = User::query()
            ->where('role', 'staff')
            ->whereIn('id', $activeStaffIds)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        $ticketCounts = Ticket::query()
            ->whereIn('assigned_to_id', $staff->pluck('id'))
            ->whereIn('status', ['open', 'in_progress'])
            ->selectRaw('assigned_to_id, count(*) as total')
            ->groupBy('assigned_to_id')
            ->pluck('total', 'assigned_to_id');

        $appointmentCounts = Appointment::query()
            ->whereIn('assigned_to_id', $staff->pluck('id'))
            ->whereIn('status', ['pending', 'scheduled'])
            ->selectRaw('assigned_to_id, count(*) as total')
            ->groupBy('assigned_to_id')
            ->pluck('total', 'assigned_to_id');

        return response()->json([
            'data' => $staff->map(function (User $staffUser) use ($ticketCounts, $appointmentCounts) {
                $activeTickets = (int) $ticketCounts->get($staffUser->id, 0);
                $activeAppointments = (int) $appointmentCounts->get($staffUser->id, 0);

                return [
                    'id' => $staffUser->id,
                    'name' => $staffUser->name,
                    'email' => $staffUser->email,
                    'active_tickets' => $activeTickets,
                    'active_appointments' => $activeAppointments,
                    'active_total' => $activeTickets + $activeAppointments,
                ];
            })->values(),
        ]);
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $validated = $request->validate([
            'role' => ['required', Rule::in(['user', 'staff', 'super_admin'])],
        ]);

        if ($request->user()->id === $user->id && $validated['role'] !== 'super_admin') {
            return response()->json([
                'message' => 'You cannot remove your own super admin access.',
            ], 422);
        }

        $oldRole = $user->role;
        $oldRequesterType = $user->requester_type;

        $user->update([
            'role' => $validated['role'],
            'requester_type' => $validated['role'] === 'user'
                ? ($user->requester_type ?? 'visitor')
                : null,
        ]);

        $user->refresh();

        AuditLog::record(
            $request->user(),
            'users',
            'role_updated',
            "{$request->user()->name} changed {$user->name}'s role from {$oldRole} to {$user->role}.",
            $user,
            [
                'target_user_id' => $user->id,
                'target_user_email' => $user->email,
                'old_role' => $oldRole,
                'new_role' => $user->role,
                'old_requester_type' => $oldRequesterType,
                'new_requester_type' => $user->requester_type,
            ],
            $request
        );

        return response()->json([
            'data' => $user->only([
                'id',
                'name',
                'email',
                'role',
                'requester_type',
                'email_verified_at',
                'terms_accepted_at',
                'created_at',
                'updated_at',
            ]),
            'message' => 'User role updated successfully.',
        ]);
    }

    private function ensureSuperAdmin(Request $request): void
    {
        if ($request->user()->role !== 'super_admin') {
            abort(403, 'Only super admins can manage users.');
        }
    }
}