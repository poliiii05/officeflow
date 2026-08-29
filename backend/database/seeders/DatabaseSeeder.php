<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Order matters:
     *   1. System settings first (independent, just configuration).
     *   2. Users next (everything else references user IDs via foreign keys).
     *   3. Tickets + Appointments + Shifts (all depend on users existing).
     *   4. Audit logs LAST - reads from all the above tables to build a
     *      realistic activity trail. Running it earlier would leave gaps.
     */
    public function run(): void
    {
        $this->call([
            SystemSettingSeeder::class,
            UserSeeder::class,
            TicketSeeder::class,
            AppointmentSeeder::class,
            StaffShiftSeeder::class,
            AuditLogSeeder::class,
        ]);
    }
}