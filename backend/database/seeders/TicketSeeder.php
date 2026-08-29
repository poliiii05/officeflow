<?php

namespace Database\Seeders;

use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class TicketSeeder extends Seeder
{
    public function run(): void
    {
        // Look up the seeded users by email so we don't hardcode IDs.
        // IDs shift if the seeder order changes, but emails are stable.
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

        // Timeline shape:
        //   Jan: 1  (Liam - first ticket ever, brand new system)
        //   Feb: 2  (Sofia, first-time; Liam again)
        //   Mar: 2  (Ethan, Sofia again after ~2wks)
        //   Apr: 3  (Olivia, Noah, Liam)
        //   May: 4  (Noah, Ethan, Sofia, Emma)
        //   Jun: 5  (Noah, Olivia, Rohan, Emma, Liam - 2mo gap since Apr)
        //   Jul: 6  (spread across users; Noah = power user, Sofia 2wk repeat)
        //   Aug: 9  (recent activity - most are still open/in-progress)
        //
        // Repeat scenarios woven in:
        //   Sofia: Feb 11 -> Feb 25 (2-week gap on same issue)
        //   Sofia: May 4 -> Jul 22 (~2.5 months gap)
        //   Noah: 5 tickets spread across Apr-Aug ("power user")
        //   Liam: Jan -> Feb -> Apr -> Jun (recurring but spaced out)
        //   Olivia: Mar 30 -> Apr 13 (2-week gap)

        $tickets = [
            // ---------- JANUARY 2026 ----------
            [
                'requester' => 'liam.walker@gmail.com',
                'assigned' => $maria,
                'subject' => 'New employee laptop request',
                'description' => "Just started this week and I'll need a laptop assigned to my desk. Any spec is fine, mostly using it for email and browser work.",
                'department' => 'IT Support',
                'category' => 'Equipment Request',
                'priority' => 'medium',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 1, 30, 10, 15, 0),
                'resolved' => Carbon::create(2026, 2, 2, 14, 30, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "Hi Liam, welcome to the team! Standard laptop is being prepped, should be ready by Monday.", 'at' => Carbon::create(2026, 1, 30, 15, 20, 0)],
                    ['user' => 'requester', 'msg' => "Great, thanks Maria!", 'at' => Carbon::create(2026, 1, 30, 15, 45, 0)],
                    ['user' => 'maria', 'msg' => "Laptop is at IT desk, ready for pickup. Please bring your ID.", 'at' => Carbon::create(2026, 2, 2, 14, 25, 0)],
                ],
            ],

            // ---------- FEBRUARY 2026 ----------
            [
                'requester' => 'sofia.rossi@yahoo.com',
                'assigned' => $james,
                'subject' => 'Cannot access shared drive',
                'description' => "I'm trying to open the shared \"Marketing\" drive but I keep getting permission denied. Was working fine last week.",
                'department' => 'IT Support',
                'category' => 'Access Issue',
                'priority' => 'high',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 2, 11, 9, 30, 0),
                'resolved' => Carbon::create(2026, 2, 11, 15, 10, 0),
                'activities' => [
                    ['user' => 'james', 'msg' => "Checking your permissions now.", 'at' => Carbon::create(2026, 2, 11, 10, 5, 0)],
                    ['user' => 'james', 'msg' => "Fixed - your account got dropped from the Marketing group during last week's cleanup. Re-added. Please try again.", 'at' => Carbon::create(2026, 2, 11, 15, 0, 0)],
                    ['user' => 'requester', 'msg' => "Working now, thanks!", 'at' => Carbon::create(2026, 2, 11, 15, 8, 0)],
                ],
            ],
            [
                'requester' => 'liam.walker@gmail.com',
                'assigned' => $maria,
                'subject' => 'Second monitor for workstation',
                'description' => "Would like to request a second monitor - working on spreadsheets and it's hard on one screen.",
                'department' => 'IT Support',
                'category' => 'Equipment Request',
                'priority' => 'low',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 2, 18, 11, 0, 0),
                'resolved' => Carbon::create(2026, 2, 24, 16, 30, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "Approved. Will arrive within a week.", 'at' => Carbon::create(2026, 2, 19, 9, 15, 0)],
                    ['user' => 'maria', 'msg' => "Monitor is at your desk.", 'at' => Carbon::create(2026, 2, 24, 16, 25, 0)],
                ],
            ],

            // ---------- MARCH 2026 ----------
            [
                'requester' => 'ethan.kim@outlook.com',
                'assigned' => $priya,
                'subject' => 'HR benefits enrollment question',
                'description' => "I have a question about how to enroll in the dental plan - the portal keeps timing out.",
                'department' => 'Human Resources',
                'category' => 'Benefits',
                'priority' => 'medium',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 3, 12, 13, 20, 0),
                'resolved' => Carbon::create(2026, 3, 14, 10, 45, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "Hi Ethan, the enrollment portal was down for maintenance. Try again after 5pm today.", 'at' => Carbon::create(2026, 3, 12, 14, 0, 0)],
                    ['user' => 'requester', 'msg' => "Worked, got enrolled. Thanks!", 'at' => Carbon::create(2026, 3, 14, 10, 40, 0)],
                ],
            ],
            [
                'requester' => 'sofia.rossi@yahoo.com',
                'assigned' => $james,
                'subject' => 'Shared drive access dropped again',
                'description' => "Same issue as before - lost access to Marketing drive this morning. This is the second time.",
                'department' => 'IT Support',
                'category' => 'Access Issue',
                'priority' => 'high',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 3, 25, 8, 45, 0),
                'resolved' => Carbon::create(2026, 3, 25, 11, 20, 0),
                'activities' => [
                    ['user' => 'james', 'msg' => "Same root cause as last month - looking into why it keeps happening.", 'at' => Carbon::create(2026, 3, 25, 9, 30, 0)],
                    ['user' => 'james', 'msg' => "Re-added, and I've flagged this with the identity team so it doesn't recur.", 'at' => Carbon::create(2026, 3, 25, 11, 15, 0)],
                ],
            ],

            // ---------- APRIL 2026 ----------
            [
                'requester' => 'olivia.bennett@gmail.com',
                'assigned' => $maria,
                'subject' => 'Printer not responding on 3rd floor',
                'description' => "The main printer near the break room shows offline for everyone on our floor.",
                'department' => 'IT Support',
                'category' => 'Hardware Issue',
                'priority' => 'medium',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 4, 2, 10, 30, 0),
                'resolved' => Carbon::create(2026, 4, 2, 14, 0, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "On the way to check.", 'at' => Carbon::create(2026, 4, 2, 11, 0, 0)],
                    ['user' => 'maria', 'msg' => "Paper jam plus network cable was loose. Cleared and reconnected - should be printing now.", 'at' => Carbon::create(2026, 4, 2, 13, 55, 0)],
                ],
            ],
            [
                'requester' => 'noah.martinez@gmail.com',
                'assigned' => $priya,
                'subject' => 'Request for training on new HR portal',
                'description' => "The new HR portal launched last week - can someone walk me through leave requests? Manual is confusing.",
                'department' => 'Human Resources',
                'category' => 'Training',
                'priority' => 'low',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 4, 20, 15, 15, 0),
                'resolved' => Carbon::create(2026, 4, 23, 11, 0, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "I can walk you through it. Thursday 10am work?", 'at' => Carbon::create(2026, 4, 20, 16, 30, 0)],
                    ['user' => 'requester', 'msg' => "Works, thanks!", 'at' => Carbon::create(2026, 4, 21, 8, 10, 0)],
                    ['user' => 'priya', 'msg' => "Session done - Noah confirmed comfortable using it now.", 'at' => Carbon::create(2026, 4, 23, 10, 55, 0)],
                ],
            ],
            [
                'requester' => 'liam.walker@gmail.com',
                'assigned' => $james,
                'subject' => 'Password reset for VPN',
                'description' => "Locked out of the VPN, need my password reset.",
                'department' => 'IT Support',
                'category' => 'Access Issue',
                'priority' => 'medium',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 4, 28, 9, 0, 0),
                'resolved' => Carbon::create(2026, 4, 28, 10, 15, 0),
                'activities' => [
                    ['user' => 'james', 'msg' => "Reset. Temporary password sent to your email - please change it on first login.", 'at' => Carbon::create(2026, 4, 28, 10, 10, 0)],
                ],
            ],

            // ---------- MAY 2026 ----------
            [
                'requester' => 'noah.martinez@gmail.com',
                'assigned' => $maria,
                'subject' => 'Software installation - Adobe Creative Cloud',
                'description' => "Need Adobe Creative Cloud installed on my machine for a project. Do we have a license?",
                'department' => 'IT Support',
                'category' => 'Software Request',
                'priority' => 'medium',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 5, 4, 11, 30, 0),
                'resolved' => Carbon::create(2026, 5, 6, 14, 20, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "We have a license pool. I'll assign one and install remotely.", 'at' => Carbon::create(2026, 5, 4, 13, 45, 0)],
                    ['user' => 'maria', 'msg' => "Installed and signed in. You should see it in your applications folder.", 'at' => Carbon::create(2026, 5, 6, 14, 15, 0)],
                ],
            ],
            [
                'requester' => 'ethan.kim@outlook.com',
                'assigned' => $priya,
                'subject' => 'Update on parental leave policy',
                'description' => "Can I get an official document on the new parental leave policy? Planning for later this year.",
                'department' => 'Human Resources',
                'category' => 'Policy Inquiry',
                'priority' => 'low',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 5, 15, 10, 0, 0),
                'resolved' => Carbon::create(2026, 5, 16, 9, 30, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "Sent the updated policy PDF to your email. Let me know if you have questions.", 'at' => Carbon::create(2026, 5, 16, 9, 25, 0)],
                ],
            ],
            [
                'requester' => 'sofia.rossi@yahoo.com',
                'assigned' => $james,
                'subject' => 'Email signature template',
                'description' => "Marketing wants everyone to use the new email signature. Where can I find the template?",
                'department' => 'IT Support',
                'category' => 'General Request',
                'priority' => 'low',
                'status' => 'closed',
                'created' => Carbon::create(2026, 5, 22, 14, 30, 0),
                'resolved' => Carbon::create(2026, 5, 23, 10, 45, 0),
                'activities' => [
                    ['user' => 'james', 'msg' => "Template is on the intranet under IT > Templates. Sent you the direct link.", 'at' => Carbon::create(2026, 5, 23, 10, 40, 0)],
                ],
            ],
            [
                'requester' => 'emma.dubois@icloud.com',
                'assigned' => $maria,
                'subject' => 'First day - laptop and email setup',
                'description' => "I started today. Where do I collect my laptop and get my email set up?",
                'department' => 'IT Support',
                'category' => 'Onboarding',
                'priority' => 'medium',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 5, 6, 15, 45, 0),
                'resolved' => Carbon::create(2026, 5, 7, 11, 30, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "Welcome Emma! Come to the IT desk on 2nd floor tomorrow 9am - I'll have your laptop ready.", 'at' => Carbon::create(2026, 5, 6, 16, 30, 0)],
                    ['user' => 'maria', 'msg' => "Laptop handed over, email configured, VPN tested.", 'at' => Carbon::create(2026, 5, 7, 11, 25, 0)],
                ],
            ],

            // ---------- JUNE 2026 ----------
            [
                'requester' => 'noah.martinez@gmail.com',
                'assigned' => $james,
                'subject' => 'Docking station replacement',
                'description' => "My docking station stopped charging the laptop. Would need a replacement.",
                'department' => 'IT Support',
                'category' => 'Hardware Issue',
                'priority' => 'medium',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 6, 3, 9, 20, 0),
                'resolved' => Carbon::create(2026, 6, 5, 15, 0, 0),
                'activities' => [
                    ['user' => 'james', 'msg' => "Ordering a replacement. Will arrive in 2-3 days.", 'at' => Carbon::create(2026, 6, 3, 10, 30, 0)],
                    ['user' => 'james', 'msg' => "New dock is at your desk.", 'at' => Carbon::create(2026, 6, 5, 14, 55, 0)],
                ],
            ],
            [
                'requester' => 'olivia.bennett@gmail.com',
                'assigned' => $priya,
                'subject' => 'Update emergency contact info',
                'description' => "Need to update my emergency contact information in HR records.",
                'department' => 'Human Resources',
                'category' => 'Records Update',
                'priority' => 'low',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 6, 10, 13, 0, 0),
                'resolved' => Carbon::create(2026, 6, 11, 9, 15, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "Form sent to your email. Fill and return signed - I'll update the records.", 'at' => Carbon::create(2026, 6, 10, 14, 20, 0)],
                    ['user' => 'requester', 'msg' => "Sent back.", 'at' => Carbon::create(2026, 6, 11, 8, 30, 0)],
                    ['user' => 'priya', 'msg' => "Updated.", 'at' => Carbon::create(2026, 6, 11, 9, 10, 0)],
                ],
            ],
            [
                'requester' => 'rohan.patel@gmail.com',
                'assigned' => $maria,
                'subject' => 'Slack access request',
                'description' => "I don't seem to have access to the company Slack workspace. Can you invite me?",
                'department' => 'IT Support',
                'category' => 'Access Issue',
                'priority' => 'medium',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 6, 19, 10, 15, 0),
                'resolved' => Carbon::create(2026, 6, 19, 11, 0, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "Invite sent. Check your email.", 'at' => Carbon::create(2026, 6, 19, 10, 55, 0)],
                ],
            ],
            [
                'requester' => 'emma.dubois@icloud.com',
                'assigned' => $james,
                'subject' => 'Zoom license',
                'description' => "Need a paid Zoom license - free version is limiting my client calls to 40 mins.",
                'department' => 'IT Support',
                'category' => 'Software Request',
                'priority' => 'medium',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 6, 24, 15, 30, 0),
                'resolved' => Carbon::create(2026, 6, 25, 10, 20, 0),
                'activities' => [
                    ['user' => 'james', 'msg' => "Assigned a paid license from the pool. Log out and log back in to Zoom to activate.", 'at' => Carbon::create(2026, 6, 25, 10, 15, 0)],
                ],
            ],
            [
                'requester' => 'liam.walker@gmail.com',
                'assigned' => $maria,
                'subject' => 'Laptop running slow',
                'description' => "The laptop you gave me in Jan is running really slow lately. Takes 10min to boot.",
                'department' => 'IT Support',
                'category' => 'Hardware Issue',
                'priority' => 'medium',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 6, 30, 9, 0, 0),
                'resolved' => Carbon::create(2026, 7, 2, 16, 0, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "Drop it off at IT desk - I'll run diagnostics and clean it up.", 'at' => Carbon::create(2026, 6, 30, 10, 0, 0)],
                    ['user' => 'maria', 'msg' => "Cleaned up, added more RAM. Should be much faster now.", 'at' => Carbon::create(2026, 7, 2, 15, 55, 0)],
                ],
            ],

            // ---------- JULY 2026 ----------
            [
                'requester' => 'noah.martinez@gmail.com',
                'assigned' => $priya,
                'subject' => 'Certification reimbursement request',
                'description' => "I completed the PMP certification last month. How do I file for reimbursement per company policy?",
                'department' => 'Human Resources',
                'category' => 'Benefits',
                'priority' => 'medium',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 7, 5, 11, 0, 0),
                'resolved' => Carbon::create(2026, 7, 8, 14, 30, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "Form sent. Attach receipt and certificate. Turnaround is about 2 weeks after submission.", 'at' => Carbon::create(2026, 7, 5, 13, 15, 0)],
                    ['user' => 'requester', 'msg' => "Submitted.", 'at' => Carbon::create(2026, 7, 7, 9, 30, 0)],
                    ['user' => 'priya', 'msg' => "Forwarded to Finance. You should see it in your next payroll.", 'at' => Carbon::create(2026, 7, 8, 14, 25, 0)],
                ],
            ],
            [
                'requester' => 'isabelle.laurent@outlook.com',
                'assigned' => $james,
                'subject' => 'Welcome package - laptop pickup',
                'description' => "First day - where do I pick up my laptop?",
                'department' => 'IT Support',
                'category' => 'Onboarding',
                'priority' => 'medium',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 7, 9, 15, 0, 0),
                'resolved' => Carbon::create(2026, 7, 10, 10, 0, 0),
                'activities' => [
                    ['user' => 'james', 'msg' => "Welcome! IT desk 2nd floor at 9am tomorrow.", 'at' => Carbon::create(2026, 7, 9, 16, 0, 0)],
                    ['user' => 'james', 'msg' => "Handed over.", 'at' => Carbon::create(2026, 7, 10, 9, 55, 0)],
                ],
            ],
            [
                'requester' => 'sofia.rossi@yahoo.com',
                'assigned' => $james,
                'subject' => 'Shared drive access dropped AGAIN',
                'description' => "Third time now. Marketing drive access is gone.",
                'department' => 'IT Support',
                'category' => 'Access Issue',
                'priority' => 'urgent',
                'status' => 'in_progress',
                'created' => Carbon::create(2026, 7, 22, 8, 30, 0),
                'resolved' => null,
                'activities' => [
                    ['user' => 'james', 'msg' => "Escalating to identity team - this is the 3rd time and root cause hasn't been fixed.", 'at' => Carbon::create(2026, 7, 22, 9, 0, 0)],
                    ['user' => 'james', 'msg' => "Restored access for now. Still investigating why it keeps happening.", 'at' => Carbon::create(2026, 7, 22, 11, 45, 0)],
                ],
            ],
            [
                'requester' => 'olivia.bennett@gmail.com',
                'assigned' => $maria,
                'subject' => 'Ergonomic chair request',
                'description' => "Would like to request an ergonomic chair - having back issues.",
                'department' => 'Facilities',
                'category' => 'Equipment Request',
                'priority' => 'medium',
                'status' => 'in_progress',
                'created' => Carbon::create(2026, 7, 25, 14, 20, 0),
                'resolved' => null,
                'activities' => [
                    ['user' => 'maria', 'msg' => "Approved by Facilities. Chair ordered - ETA 5-7 business days.", 'at' => Carbon::create(2026, 7, 26, 10, 30, 0)],
                ],
            ],
            [
                'requester' => 'rohan.patel@gmail.com',
                'assigned' => $priya,
                'subject' => 'Update tax withholding',
                'description' => "Need to update my tax withholding for the second half of the year.",
                'department' => 'Human Resources',
                'category' => 'Records Update',
                'priority' => 'low',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 7, 28, 11, 0, 0),
                'resolved' => Carbon::create(2026, 7, 29, 14, 0, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "W-4 form sent. Fill it out and return - I'll process with Payroll.", 'at' => Carbon::create(2026, 7, 28, 13, 30, 0)],
                    ['user' => 'priya', 'msg' => "Updated. Change takes effect next pay cycle.", 'at' => Carbon::create(2026, 7, 29, 13, 55, 0)],
                ],
            ],
            [
                'requester' => 'noah.martinez@gmail.com',
                'assigned' => $maria,
                'subject' => 'External monitor - defective',
                'description' => "The monitor I received last quarter has dead pixels. Would like a replacement.",
                'department' => 'IT Support',
                'category' => 'Hardware Issue',
                'priority' => 'low',
                'status' => 'in_progress',
                'created' => Carbon::create(2026, 7, 31, 10, 0, 0),
                'resolved' => null,
                'activities' => [
                    ['user' => 'maria', 'msg' => "Checking warranty. Will get back to you.", 'at' => Carbon::create(2026, 7, 31, 11, 15, 0)],
                ],
            ],

            // ---------- AUGUST 2026 (current month - most are still active) ----------
            [
                'requester' => 'ethan.kim@outlook.com',
                'assigned' => $james,
                'subject' => 'Software license transfer',
                'description' => "Moving to a new laptop. Need Adobe and Office licenses transferred.",
                'department' => 'IT Support',
                'category' => 'Software Request',
                'priority' => 'medium',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 8, 3, 9, 30, 0),
                'resolved' => Carbon::create(2026, 8, 4, 14, 0, 0),
                'activities' => [
                    ['user' => 'james', 'msg' => "Transferring licenses now.", 'at' => Carbon::create(2026, 8, 3, 11, 0, 0)],
                    ['user' => 'james', 'msg' => "Done. Sign in on the new laptop and everything should activate.", 'at' => Carbon::create(2026, 8, 4, 13, 55, 0)],
                ],
            ],
            [
                'requester' => 'emma.dubois@icloud.com',
                'assigned' => $priya,
                'subject' => 'Sick leave documentation',
                'description' => "Need to submit medical certificate for last week's sick leave.",
                'department' => 'Human Resources',
                'category' => 'Records Update',
                'priority' => 'medium',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 8, 10, 10, 0, 0),
                'resolved' => Carbon::create(2026, 8, 11, 9, 0, 0),
                'activities' => [
                    ['user' => 'priya', 'msg' => "Received. Filed with your records.", 'at' => Carbon::create(2026, 8, 11, 8, 55, 0)],
                ],
            ],
            [
                'requester' => 'liam.walker@gmail.com',
                'assigned' => $maria,
                'subject' => 'Cable adapter for external display',
                'description' => "Need USB-C to HDMI adapter for presenting.",
                'department' => 'IT Support',
                'category' => 'Equipment Request',
                'priority' => 'low',
                'status' => 'resolved',
                'created' => Carbon::create(2026, 8, 14, 14, 20, 0),
                'resolved' => Carbon::create(2026, 8, 15, 11, 30, 0),
                'activities' => [
                    ['user' => 'maria', 'msg' => "Ready for pickup at IT desk.", 'at' => Carbon::create(2026, 8, 15, 11, 25, 0)],
                ],
            ],
            [
                'requester' => 'noah.martinez@gmail.com',
                'assigned' => $james,
                'subject' => 'VPN connection unstable',
                'description' => "VPN keeps disconnecting every 15-20 minutes. Really disrupting work-from-home.",
                'department' => 'IT Support',
                'category' => 'Access Issue',
                'priority' => 'high',
                'status' => 'in_progress',
                'created' => Carbon::create(2026, 8, 20, 9, 0, 0),
                'resolved' => null,
                'activities' => [
                    ['user' => 'james', 'msg' => "Might be your network or a config issue. Can you screenshot the disconnect error next time?", 'at' => Carbon::create(2026, 8, 20, 10, 15, 0)],
                    ['user' => 'requester', 'msg' => "Sent screenshot. Says \"session terminated by server\".", 'at' => Carbon::create(2026, 8, 20, 13, 30, 0)],
                    ['user' => 'james', 'msg' => "Looking into it - might be a server-side issue affecting multiple users.", 'at' => Carbon::create(2026, 8, 20, 14, 45, 0)],
                ],
            ],
            [
                'requester' => 'sofia.rossi@yahoo.com',
                'assigned' => null,
                'subject' => 'Access request for new team folder',
                'description' => "Marketing team just created a Q4 planning folder. Need access.",
                'department' => 'IT Support',
                'category' => 'Access Issue',
                'priority' => 'medium',
                'status' => 'open',
                'created' => Carbon::create(2026, 8, 25, 10, 30, 0),
                'resolved' => null,
                'activities' => [],
            ],
            [
                'requester' => 'olivia.bennett@gmail.com',
                'assigned' => null,
                'subject' => 'Password reset - locked out',
                'description' => "Locked out after too many login attempts. Need reset.",
                'department' => 'IT Support',
                'category' => 'Access Issue',
                'priority' => 'high',
                'status' => 'open',
                'created' => Carbon::create(2026, 8, 26, 15, 45, 0),
                'resolved' => null,
                'activities' => [],
            ],
            [
                'requester' => 'rohan.patel@gmail.com',
                'assigned' => null,
                'subject' => 'Printer toner replacement',
                'description' => "3rd floor printer showing low toner warning.",
                'department' => 'IT Support',
                'category' => 'Hardware Issue',
                'priority' => 'low',
                'status' => 'open',
                'created' => Carbon::create(2026, 8, 27, 11, 15, 0),
                'resolved' => null,
                'activities' => [],
            ],
            [
                'requester' => 'isabelle.laurent@outlook.com',
                'assigned' => null,
                'subject' => 'Second monitor request',
                'description' => "Would like a second monitor for my new workstation.",
                'department' => 'IT Support',
                'category' => 'Equipment Request',
                'priority' => 'medium',
                'status' => 'open',
                'created' => Carbon::create(2026, 8, 28, 9, 30, 0),
                'resolved' => null,
                'activities' => [],
            ],
            [
                'requester' => 'ethan.kim@outlook.com',
                'assigned' => null,
                'subject' => 'Meeting room booking system down',
                'description' => "The booking system for meeting rooms is showing errors. Cannot reserve for Monday.",
                'department' => 'IT Support',
                'category' => 'Software Issue',
                'priority' => 'urgent',
                'status' => 'open',
                'created' => Carbon::create(2026, 8, 28, 14, 45, 0),
                'resolved' => null,
                'activities' => [],
            ],
        ];

        // Generate ticket numbers matching the pattern seen in existing data:
        // TCK-YYYYMMDD-NNNN where NNNN is a 4-digit sequence per day.
        $ticketNumberCounter = [];

        foreach ($tickets as $t) {
            $requester = $users[$t['requester']];
            $created = $t['created'];

            $dateKey = $created->format('Ymd');
            $ticketNumberCounter[$dateKey] = ($ticketNumberCounter[$dateKey] ?? 0) + 1;
            $ticketNumber = 'TCK-'.$dateKey.'-'.str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT);

            $ticket = Ticket::create([
                'requester_id' => $requester->id,
                'assigned_to_id' => $t['assigned']?->id,
                'ticket_number' => $ticketNumber,
                'subject' => $t['subject'],
                'description' => $t['description'],
                'department' => $t['department'],
                'category' => $t['category'],
                'priority' => $t['priority'],
                'status' => $t['status'],
                'resolved_at' => $t['resolved'],
                'created_at' => $created,
                'updated_at' => $t['resolved'] ?? $created,
            ]);

            // Insert activity thread. Map 'user' key to actual user id:
            // 'maria'/'james'/'priya' = staff by nickname; 'requester' = ticket owner.
            $staffByNickname = [
                'maria' => $staff['maria.santos@gmail.com'],
                'james' => $staff['james.anderson@outlook.com'],
                'priya' => $staff['priya.sharma@gmail.com'],
            ];

            foreach ($t['activities'] as $a) {
                $activityUser = $a['user'] === 'requester'
                    ? $requester
                    : $staffByNickname[$a['user']];

                TicketActivity::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $activityUser->id,
                    'type' => 'message',
                    'message' => $a['msg'],
                    'is_internal' => false,
                    'created_at' => $a['at'],
                    'updated_at' => $a['at'],
                ]);
            }
        }
    }
}