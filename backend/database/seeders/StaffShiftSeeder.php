<?php

namespace Database\Seeders;

use App\Models\StaffShift;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class StaffShiftSeeder extends Seeder
{
    public function run(): void
    {
        $staff = User::where('role', 'staff')->get()->keyBy('email');
        $maria = $staff['maria.santos@gmail.com'];
        $james = $staff['james.anderson@outlook.com'];
        $priya = $staff['priya.sharma@gmail.com'];

        // 15 closed shifts (5 each staff member) spread Feb-Aug 2026.
        // Realistic ~8-hour shifts, mixed end reasons.
        //
        // IMPORTANT: the migration adds a partial unique index
        //   staff_shifts_one_active_per_user ON staff_shifts (user_id) WHERE ended_at IS NULL
        // so only ONE staff member can have an active shift at a time - the
        // active shift below goes to Maria.

        $closedShifts = [
            // Maria - 5 shifts
            ['user' => $maria, 'start' => Carbon::create(2026, 2, 15, 9, 0, 0),  'end' => Carbon::create(2026, 2, 15, 17, 30, 0), 'reason' => 'end_shift'],
            ['user' => $maria, 'start' => Carbon::create(2026, 4, 10, 8, 45, 0), 'end' => Carbon::create(2026, 4, 10, 17, 15, 0), 'reason' => 'end_shift'],
            ['user' => $maria, 'start' => Carbon::create(2026, 5, 22, 9, 15, 0), 'end' => Carbon::create(2026, 5, 22, 16, 30, 0), 'reason' => 'early_out'],
            ['user' => $maria, 'start' => Carbon::create(2026, 7, 3, 9, 0, 0),   'end' => Carbon::create(2026, 7, 3, 18, 0, 0),   'reason' => 'end_shift'],
            ['user' => $maria, 'start' => Carbon::create(2026, 8, 21, 9, 0, 0),  'end' => Carbon::create(2026, 8, 21, 17, 45, 0), 'reason' => 'end_shift'],

            // James - 5 shifts
            ['user' => $james, 'start' => Carbon::create(2026, 3, 5, 8, 30, 0),  'end' => Carbon::create(2026, 3, 5, 17, 0, 0),   'reason' => 'end_shift'],
            ['user' => $james, 'start' => Carbon::create(2026, 4, 28, 9, 0, 0),  'end' => Carbon::create(2026, 4, 28, 17, 30, 0), 'reason' => 'end_shift'],
            ['user' => $james, 'start' => Carbon::create(2026, 6, 12, 9, 0, 0),  'end' => Carbon::create(2026, 6, 12, 15, 0, 0),  'reason' => 'early_out'],
            ['user' => $james, 'start' => Carbon::create(2026, 7, 22, 8, 45, 0), 'end' => Carbon::create(2026, 7, 22, 17, 30, 0), 'reason' => 'end_shift'],
            ['user' => $james, 'start' => Carbon::create(2026, 8, 25, 9, 0, 0),  'end' => Carbon::create(2026, 8, 25, 17, 0, 0),  'reason' => 'end_shift'],

            // Priya - 5 shifts
            ['user' => $priya, 'start' => Carbon::create(2026, 3, 18, 9, 30, 0), 'end' => Carbon::create(2026, 3, 18, 17, 45, 0), 'reason' => 'end_shift'],
            ['user' => $priya, 'start' => Carbon::create(2026, 5, 6, 8, 45, 0),  'end' => Carbon::create(2026, 5, 6, 17, 15, 0),  'reason' => 'end_shift'],
            ['user' => $priya, 'start' => Carbon::create(2026, 6, 19, 9, 0, 0),  'end' => Carbon::create(2026, 6, 19, 17, 30, 0), 'reason' => 'end_shift'],
            ['user' => $priya, 'start' => Carbon::create(2026, 7, 28, 9, 15, 0), 'end' => Carbon::create(2026, 7, 28, 16, 0, 0),  'reason' => 'early_out'],
            ['user' => $priya, 'start' => Carbon::create(2026, 8, 26, 9, 0, 0),  'end' => Carbon::create(2026, 8, 26, 17, 30, 0), 'reason' => 'end_shift'],
        ];

        foreach ($closedShifts as $shift) {
            StaffShift::create([
                'user_id' => $shift['user']->id,
                'started_at' => $shift['start'],
                'ended_at' => $shift['end'],
                'status' => 'ended',
                'end_reason' => $shift['reason'],
                'created_at' => $shift['start'],
                'updated_at' => $shift['end'],
            ]);
        }

        // Active shift - Maria is currently on duty.
        // Set started_at to a few hours ago so the dashboard shows realistic
        // "3h 20m on duty" duration when the portfolio is first opened.
        StaffShift::create([
            'user_id' => $maria->id,
            'started_at' => now()->subHours(3)->subMinutes(20),
            'ended_at' => null,
            'status' => 'active',
            'end_reason' => null,
            'created_at' => now()->subHours(3)->subMinutes(20),
            'updated_at' => now()->subHours(3)->subMinutes(20),
        ]);
    }
}