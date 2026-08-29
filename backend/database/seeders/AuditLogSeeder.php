<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\StaffShift;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        $superAdmin = User::where('email', 'admin@officeflow.dev')->first();
        $users = User::all()->keyBy('email');

        // ---------- 1. User registration events ----------
        // Every seeded account gets a "registered" audit log entry, timed to
        // their created_at. Actor is the user themselves (self-registration).
        foreach ($users as $user) {
            $method = $user->google_id ? 'google' : 'manual';

            AuditLog::create([
                'actor_id' => $user->id,
                'module' => 'auth',
                'action' => 'user.registered',
                'auditable_type' => User::class,
                'auditable_id' => $user->id,
                'description' => sprintf(
                    '%s registered via %s (%s).',
                    $user->name,
                    $method === 'google' ? 'Google sign-in' : 'email + password',
                    $user->role
                ),
                'metadata' => [
                    'method' => $method,
                    'role' => $user->role,
                    'requester_type' => $user->requester_type,
                ],
                'ip_address' => null,
                'user_agent' => null,
                'created_at' => $user->created_at,
                'updated_at' => $user->created_at,
            ]);
        }

        // ---------- 2. Staff shift start/end events ----------
        foreach (StaffShift::all() as $shift) {
            AuditLog::create([
                'actor_id' => $shift->user_id,
                'module' => 'staff_shift',
                'action' => 'shift.started',
                'auditable_type' => StaffShift::class,
                'auditable_id' => $shift->id,
                'description' => sprintf('%s started a shift.', $shift->user->name),
                'metadata' => ['shift_id' => $shift->id],
                'ip_address' => null,
                'user_agent' => null,
                'created_at' => $shift->started_at,
                'updated_at' => $shift->started_at,
            ]);

            if ($shift->ended_at) {
                AuditLog::create([
                    'actor_id' => $shift->user_id,
                    'module' => 'staff_shift',
                    'action' => 'shift.ended',
                    'auditable_type' => StaffShift::class,
                    'auditable_id' => $shift->id,
                    'description' => sprintf(
                        '%s ended a shift (%s).',
                        $shift->user->name,
                        $shift->end_reason === 'early_out' ? 'early out' : 'end shift'
                    ),
                    'metadata' => [
                        'shift_id' => $shift->id,
                        'end_reason' => $shift->end_reason,
                        'duration_minutes' => $shift->started_at->diffInMinutes($shift->ended_at),
                    ],
                    'ip_address' => null,
                    'user_agent' => null,
                    'created_at' => $shift->ended_at,
                    'updated_at' => $shift->ended_at,
                ]);
            }
        }

        // ---------- 3. Ticket lifecycle events ----------
        foreach (Ticket::with(['requester', 'assignedTo'])->get() as $ticket) {
            // Ticket created - actor is the requester
            AuditLog::create([
                'actor_id' => $ticket->requester_id,
                'module' => 'ticket',
                'action' => 'ticket.created',
                'auditable_type' => Ticket::class,
                'auditable_id' => $ticket->id,
                'description' => sprintf(
                    '%s submitted ticket %s: %s',
                    $ticket->requester->name,
                    $ticket->ticket_number,
                    $ticket->subject
                ),
                'metadata' => [
                    'ticket_number' => $ticket->ticket_number,
                    'department' => $ticket->department,
                    'category' => $ticket->category,
                    'priority' => $ticket->priority,
                ],
                'ip_address' => null,
                'user_agent' => null,
                'created_at' => $ticket->created_at,
                'updated_at' => $ticket->created_at,
            ]);

            // If assigned - claim event a short time after creation
            if ($ticket->assigned_to_id) {
                $claimedAt = $ticket->created_at->copy()->addMinutes(random_int(30, 180));

                AuditLog::create([
                    'actor_id' => $ticket->assigned_to_id,
                    'module' => 'ticket',
                    'action' => 'ticket.assigned',
                    'auditable_type' => Ticket::class,
                    'auditable_id' => $ticket->id,
                    'description' => sprintf(
                        '%s claimed ticket %s.',
                        $ticket->assignedTo->name,
                        $ticket->ticket_number
                    ),
                    'metadata' => [
                        'ticket_number' => $ticket->ticket_number,
                        'assigned_to_id' => $ticket->assigned_to_id,
                    ],
                    'ip_address' => null,
                    'user_agent' => null,
                    'created_at' => $claimedAt,
                    'updated_at' => $claimedAt,
                ]);
            }

            // Resolved - if resolved_at is set
            if ($ticket->resolved_at) {
                AuditLog::create([
                    'actor_id' => $ticket->assigned_to_id,
                    'module' => 'ticket',
                    'action' => 'ticket.resolved',
                    'auditable_type' => Ticket::class,
                    'auditable_id' => $ticket->id,
                    'description' => sprintf(
                        '%s marked ticket %s as %s.',
                        $ticket->assignedTo?->name ?? 'System',
                        $ticket->ticket_number,
                        $ticket->status
                    ),
                    'metadata' => [
                        'ticket_number' => $ticket->ticket_number,
                        'final_status' => $ticket->status,
                    ],
                    'ip_address' => null,
                    'user_agent' => null,
                    'created_at' => $ticket->resolved_at,
                    'updated_at' => $ticket->resolved_at,
                ]);
            }
        }

        // ---------- 4. Appointment lifecycle events ----------
        foreach (Appointment::with(['requester', 'assignedTo'])->get() as $appointment) {
            AuditLog::create([
                'actor_id' => $appointment->requester_id,
                'module' => 'appointment',
                'action' => 'appointment.created',
                'auditable_type' => Appointment::class,
                'auditable_id' => $appointment->id,
                'description' => sprintf(
                    '%s booked appointment %s: %s',
                    $appointment->requester->name,
                    $appointment->appointment_number,
                    $appointment->purpose
                ),
                'metadata' => [
                    'appointment_number' => $appointment->appointment_number,
                    'department' => $appointment->department,
                    'scheduled_at' => $appointment->scheduled_at->toIso8601String(),
                ],
                'ip_address' => null,
                'user_agent' => null,
                'created_at' => $appointment->created_at,
                'updated_at' => $appointment->created_at,
            ]);

            if ($appointment->assigned_to_id) {
                $claimedAt = $appointment->created_at->copy()->addMinutes(random_int(20, 120));

                AuditLog::create([
                    'actor_id' => $appointment->assigned_to_id,
                    'module' => 'appointment',
                    'action' => 'appointment.assigned',
                    'auditable_type' => Appointment::class,
                    'auditable_id' => $appointment->id,
                    'description' => sprintf(
                        '%s claimed appointment %s.',
                        $appointment->assignedTo->name,
                        $appointment->appointment_number
                    ),
                    'metadata' => [
                        'appointment_number' => $appointment->appointment_number,
                        'assigned_to_id' => $appointment->assigned_to_id,
                    ],
                    'ip_address' => null,
                    'user_agent' => null,
                    'created_at' => $claimedAt,
                    'updated_at' => $claimedAt,
                ]);
            }

            if ($appointment->status === 'completed') {
                AuditLog::create([
                    'actor_id' => $appointment->assigned_to_id,
                    'module' => 'appointment',
                    'action' => 'appointment.completed',
                    'auditable_type' => Appointment::class,
                    'auditable_id' => $appointment->id,
                    'description' => sprintf(
                        '%s marked appointment %s as completed.',
                        $appointment->assignedTo?->name ?? 'System',
                        $appointment->appointment_number
                    ),
                    'metadata' => [
                        'appointment_number' => $appointment->appointment_number,
                    ],
                    'ip_address' => null,
                    'user_agent' => null,
                    // Completed shortly after scheduled time
                    'created_at' => $appointment->scheduled_at->copy()->addHour(),
                    'updated_at' => $appointment->scheduled_at->copy()->addHour(),
                ]);
            }

            if ($appointment->status === 'cancelled' && $appointment->cancelled_at) {
                AuditLog::create([
                    'actor_id' => $appointment->requester_id,
                    'module' => 'appointment',
                    'action' => 'appointment.cancelled',
                    'auditable_type' => Appointment::class,
                    'auditable_id' => $appointment->id,
                    'description' => sprintf(
                        '%s cancelled appointment %s.',
                        $appointment->requester->name,
                        $appointment->appointment_number
                    ),
                    'metadata' => [
                        'appointment_number' => $appointment->appointment_number,
                    ],
                    'ip_address' => null,
                    'user_agent' => null,
                    'created_at' => $appointment->cancelled_at,
                    'updated_at' => $appointment->cancelled_at,
                ]);
            }
        }
    }
}