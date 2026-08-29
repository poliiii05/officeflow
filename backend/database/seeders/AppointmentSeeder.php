<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\AppointmentActivity;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AppointmentSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::whereIn('email', [
            'liam.walker@gmail.com',
            'sofia.rossi@yahoo.com',
            'ethan.kim@outlook.com',
            'olivia.bennett@gmail.com',
            'noah.martinez@gmail.com',
            'emma.dubois@icloud.com',
            'rohan.patel@gmail.com',
            'isabelle.laurent@outlook.com',
        ])->get()->keyBy('email');

        $staff = User::where('role', 'staff')->get()->keyBy('email');
        $maria = $staff['maria.santos@gmail.com'];
        $james = $staff['james.anderson@outlook.com'];
        $priya = $staff['priya.sharma@gmail.com'];

        // Distribution:
        //   Feb: 1
        //   Mar: 2
        //   Apr: 2
        //   May: 3 (Sofia's cancelled first appointment lives here)
        //   Jun: 3
        //   Jul: 4 (Sofia rebooks after her May cancellation - ~2mo gap)
        //   Aug: 6 (4 upcoming pending/scheduled, so Today/This week filters have real content)

        $appointments = [
            // ---------- FEBRUARY ----------
            [
                'requester' => 'sofia.rossi@yahoo.com',
                'assigned' => $priya,
                'purpose' => 'HR benefits orientation',
                'notes' => 'New hire wants to walk through health insurance options.',
                'department' => 'Human Resources',
                'scheduled' => Carbon::create(2026, 2, 15, 10, 0, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 2, 12, 14, 30, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "Confirmed for Feb 15 at 10am. Meeting room 3B.", 'at' => Carbon::create(2026, 2, 12, 15, 0, 0)],
                ],
            ],

            // ---------- MARCH ----------
            [
                'requester' => 'ethan.kim@outlook.com',
                'assigned' => $priya,
                'purpose' => 'Annual performance review',
                'notes' => 'Standard yearly review with department head.',
                'department' => 'Human Resources',
                'scheduled' => Carbon::create(2026, 3, 18, 14, 0, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 3, 10, 11, 0, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "Confirmed. See you at 2pm on Mar 18.", 'at' => Carbon::create(2026, 3, 10, 13, 20, 0)],
                ],
            ],
            [
                'requester' => 'liam.walker@gmail.com',
                'assigned' => $maria,
                'purpose' => 'IT security training session',
                'notes' => 'New employee needs the mandatory security awareness walkthrough.',
                'department' => 'IT Support',
                'scheduled' => Carbon::create(2026, 3, 25, 11, 0, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 3, 22, 9, 30, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "Room 2A, bring your laptop. Session is about 90 minutes.", 'at' => Carbon::create(2026, 3, 22, 10, 15, 0)],
                ],
            ],

            // ---------- APRIL ----------
            [
                'requester' => 'olivia.bennett@gmail.com',
                'assigned' => $priya,
                'purpose' => 'Discuss transfer to another department',
                'notes' => 'Considering moving from Marketing to Product. Wants to talk through the process.',
                'department' => 'Human Resources',
                'scheduled' => Carbon::create(2026, 4, 8, 15, 30, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 4, 1, 14, 0, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "Booked. I'll have some transfer paperwork ready if you want to see it.", 'at' => Carbon::create(2026, 4, 2, 9, 0, 0)],
                ],
            ],
            [
                'requester' => 'noah.martinez@gmail.com',
                'assigned' => $maria,
                'purpose' => 'Hardware setup for new laptop',
                'notes' => 'Just got a replacement laptop - needs full setup and data migration.',
                'department' => 'IT Support',
                'scheduled' => Carbon::create(2026, 4, 25, 10, 30, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 4, 22, 16, 0, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "Bring both old and new laptops. Migration takes about an hour.", 'at' => Carbon::create(2026, 4, 23, 8, 30, 0)],
                ],
            ],

            // ---------- MAY ----------
            [
                'requester' => 'sofia.rossi@yahoo.com',
                'assigned' => $priya,
                'purpose' => 'Discuss vacation leave planning',
                'notes' => 'Need to plan out remaining PTO for the year.',
                'department' => 'Human Resources',
                'scheduled' => Carbon::create(2026, 5, 12, 13, 30, 0),
                'status' => 'cancelled',
                'cancelled' => Carbon::create(2026, 5, 11, 17, 45, 0),
                'created' => Carbon::create(2026, 5, 5, 10, 30, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "Booked for the 12th.", 'at' => Carbon::create(2026, 5, 5, 11, 0, 0)],
                    ['user' => 'requester', 'msg' => "Sorry, need to reschedule - work conflict. Will rebook later.", 'at' => Carbon::create(2026, 5, 11, 17, 40, 0)],
                ],
            ],
            [
                'requester' => 'emma.dubois@icloud.com',
                'assigned' => $maria,
                'purpose' => 'New employee IT orientation',
                'notes' => 'Walkthrough of systems, tools, and internal apps.',
                'department' => 'IT Support',
                'scheduled' => Carbon::create(2026, 5, 20, 10, 0, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 5, 8, 16, 0, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "Welcome again Emma. Meeting room 1B at 10am.", 'at' => Carbon::create(2026, 5, 9, 9, 0, 0)],
                ],
            ],
            [
                'requester' => 'ethan.kim@outlook.com',
                'assigned' => $priya,
                'purpose' => '401k enrollment guidance',
                'notes' => 'Wants help picking investment options.',
                'department' => 'Human Resources',
                'scheduled' => Carbon::create(2026, 5, 28, 15, 0, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 5, 25, 11, 30, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "Confirmed. I'll bring the provider materials.", 'at' => Carbon::create(2026, 5, 25, 13, 0, 0)],
                ],
            ],

            // ---------- JUNE ----------
            [
                'requester' => 'noah.martinez@gmail.com',
                'assigned' => $priya,
                'purpose' => 'Discuss training certification budget',
                'notes' => 'Wants to enroll in additional professional development courses.',
                'department' => 'Human Resources',
                'scheduled' => Carbon::create(2026, 6, 8, 14, 0, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 6, 3, 9, 15, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "Booked. I'll pull up the training budget for the year.", 'at' => Carbon::create(2026, 6, 3, 10, 0, 0)],
                ],
            ],
            [
                'requester' => 'rohan.patel@gmail.com',
                'assigned' => $maria,
                'purpose' => 'IT onboarding for new employee',
                'notes' => 'Just joined - needs full IT setup and access provisioning.',
                'department' => 'IT Support',
                'scheduled' => Carbon::create(2026, 6, 22, 10, 0, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 6, 19, 15, 0, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "Welcome Rohan. IT desk 2nd floor at 10am.", 'at' => Carbon::create(2026, 6, 19, 16, 30, 0)],
                ],
            ],
            [
                'requester' => 'olivia.bennett@gmail.com',
                'assigned' => $priya,
                'purpose' => 'Follow-up on department transfer',
                'notes' => 'Update on the Marketing to Product move discussion from April.',
                'department' => 'Human Resources',
                'scheduled' => Carbon::create(2026, 6, 30, 14, 30, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 6, 24, 11, 0, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "Booked. I have updates from the Product team lead.", 'at' => Carbon::create(2026, 6, 24, 13, 0, 0)],
                ],
            ],

            // ---------- JULY ----------
            [
                'requester' => 'sofia.rossi@yahoo.com',
                'assigned' => $priya,
                'purpose' => 'Vacation leave planning - rescheduled',
                'notes' => 'Rebooking after May cancellation.',
                'department' => 'Human Resources',
                'scheduled' => Carbon::create(2026, 7, 10, 13, 30, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 7, 5, 10, 0, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "Rebooked! See you Jul 10.", 'at' => Carbon::create(2026, 7, 5, 10, 30, 0)],
                ],
            ],
            [
                'requester' => 'liam.walker@gmail.com',
                'assigned' => $maria,
                'purpose' => 'Laptop upgrade consultation',
                'notes' => 'Discuss specs for a laptop refresh.',
                'department' => 'IT Support',
                'scheduled' => Carbon::create(2026, 7, 15, 11, 0, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 7, 10, 14, 0, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "Booked. I'll bring the current lineup and pricing.", 'at' => Carbon::create(2026, 7, 10, 15, 30, 0)],
                ],
            ],
            [
                'requester' => 'isabelle.laurent@outlook.com',
                'assigned' => $priya,
                'purpose' => 'HR onboarding session',
                'notes' => 'New hire - HR paperwork and benefits walkthrough.',
                'department' => 'Human Resources',
                'scheduled' => Carbon::create(2026, 7, 14, 10, 0, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 7, 10, 9, 0, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "Welcome Isabelle! Meeting room 3B, 10am.", 'at' => Carbon::create(2026, 7, 10, 10, 30, 0)],
                ],
            ],
            [
                'requester' => 'ethan.kim@outlook.com',
                'assigned' => $maria,
                'purpose' => 'New software installation walkthrough',
                'notes' => 'Wants help setting up specialized statistics software.',
                'department' => 'IT Support',
                'scheduled' => Carbon::create(2026, 7, 28, 15, 30, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 7, 24, 13, 0, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "Booked. I'll pre-download the installers.", 'at' => Carbon::create(2026, 7, 24, 14, 30, 0)],
                ],
            ],

            // ---------- AUGUST ----------
            [
                'requester' => 'noah.martinez@gmail.com',
                'assigned' => $maria,
                'purpose' => 'Docking station replacement pickup',
                'notes' => 'Followup from July hardware ticket.',
                'department' => 'IT Support',
                'scheduled' => Carbon::create(2026, 8, 5, 10, 30, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 8, 3, 9, 0, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "Ready for pickup. IT desk 2nd floor.", 'at' => Carbon::create(2026, 8, 3, 10, 0, 0)],
                ],
            ],
            [
                'requester' => 'emma.dubois@icloud.com',
                'assigned' => $priya,
                'purpose' => 'Return-to-work meeting after sick leave',
                'notes' => 'Standard check-in after extended sick leave.',
                'department' => 'Human Resources',
                'scheduled' => Carbon::create(2026, 8, 12, 14, 0, 0),
                'status' => 'completed',
                'cancelled' => null,
                'created' => Carbon::create(2026, 8, 10, 11, 0, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "Confirmed. Meeting room 2C.", 'at' => Carbon::create(2026, 8, 10, 13, 30, 0)],
                ],
            ],
            // The 4 upcoming appointments - these keep Today/This-week filters non-empty
            [
                'requester' => 'olivia.bennett@gmail.com',
                'assigned' => $maria,
                'purpose' => 'IT support for ergonomic chair setup',
                'notes' => 'New chair arrived - needs help adjusting workspace and monitor arm.',
                'department' => 'IT Support',
                'scheduled' => Carbon::create(2026, 8, 30, 11, 0, 0),
                'status' => 'scheduled',
                'cancelled' => null,
                'created' => Carbon::create(2026, 8, 26, 13, 30, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "Booked. I'll come by your workstation Saturday morning.", 'at' => Carbon::create(2026, 8, 26, 14, 15, 0)],
                ],
            ],
            [
                'requester' => 'rohan.patel@gmail.com',
                'assigned' => null,
                'purpose' => 'Slack workspace admin training',
                'notes' => 'Been assigned as team admin - needs walkthrough on managing channels and permissions.',
                'department' => 'IT Support',
                'scheduled' => Carbon::create(2026, 9, 2, 10, 0, 0),
                'status' => 'pending',
                'cancelled' => null,
                'created' => Carbon::create(2026, 8, 27, 15, 0, 0),
                'activities' => [],
            ],
            [
                'requester' => 'isabelle.laurent@outlook.com',
                'assigned' => null,
                'purpose' => 'Follow-up onboarding check-in',
                'notes' => '30-day check-in after joining.',
                'department' => 'Human Resources',
                'scheduled' => Carbon::create(2026, 9, 8, 14, 0, 0),
                'status' => 'pending',
                'cancelled' => null,
                'created' => Carbon::create(2026, 8, 28, 10, 30, 0),
                'activities' => [],
            ],
            [
                'requester' => 'sofia.rossi@yahoo.com',
                'assigned' => null,
                'purpose' => 'Discuss access recurring issue',
                'notes' => 'Marketing drive access has dropped 3 times now - wants to escalate to a formal meeting.',
                'department' => 'IT Support',
                'scheduled' => Carbon::create(2026, 9, 4, 15, 30, 0),
                'status' => 'pending',
                'cancelled' => null,
                'created' => Carbon::create(2026, 8, 28, 16, 15, 0),
                'activities' => [],
            ],
        ];

        foreach ($appointments as $a) {
            $requester = $users[$a['requester']];
            $created = $a['created'];

            $appointmentNumber = 'APT-'.$created->format('Ymd').'-'.str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT);

            $appointment = Appointment::create([
                'requester_id' => $requester->id,
                'assigned_to_id' => $a['assigned']?->id,
                'appointment_number' => $appointmentNumber,
                'purpose' => $a['purpose'],
                'notes' => $a['notes'],
                'department' => $a['department'],
                'scheduled_at' => $a['scheduled'],
                'status' => $a['status'],
                'cancelled_at' => $a['cancelled'],
                'created_at' => $created,
                'updated_at' => $a['cancelled'] ?? $created,
            ]);

            $staffByNickname = [
                'maria' => $staff['maria.santos@gmail.com'],
                'james' => $staff['james.anderson@outlook.com'],
                'priya' => $staff['priya.sharma@gmail.com'],
            ];

            foreach ($a['activities'] as $act) {
                $activityUser = $act['user'] === 'requester'
                    ? $requester
                    : $staffByNickname[$act['user']];

                AppointmentActivity::create([
                    'appointment_id' => $appointment->id,
                    'user_id' => $activityUser->id,
                    'type' => 'message',
                    'message' => $act['msg'],
                    'is_internal' => false,
                    'created_at' => $act['at'],
                    'updated_at' => $act['at'],
                ]);
            }
        }
    }
}