<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Timeline: users are staggered across Jan-Aug 2026 so the audit log
        // has a natural "growing team" history. Super admin lands first
        // (system founder), staff onboarded early, requesters spread out.

        // ---------- SUPER ADMIN ----------
        User::create([
            'name' => 'Alex Reyes',
            'nickname' => 'Alex',
            'email' => 'admin@officeflow.dev',
            'email_verified_at' => Carbon::create(2026, 1, 5, 9, 0, 0),
            'google_id' => null,
            'avatar_url' => null,
            'password' => Hash::make('Admin@2026Dev'),
            'role' => 'super_admin',
            'requester_type' => null,
            'terms_accepted_at' => Carbon::create(2026, 1, 5, 9, 0, 0),
            'onboarding_completed_at' => Carbon::create(2026, 1, 5, 9, 15, 0),
            'created_at' => Carbon::create(2026, 1, 5, 9, 0, 0),
            'updated_at' => Carbon::create(2026, 1, 5, 9, 15, 0),
        ]);

        // ---------- STAFF (3) ----------
        // 1 manual, 2 Google - mixed so the Users management page shows variety.

        User::create([
            'name' => 'Maria Santos',
            'nickname' => 'Maria',
            'email' => 'maria.santos@gmail.com',
            'email_verified_at' => Carbon::create(2026, 1, 12, 10, 30, 0),
            'google_id' => (string) random_int(100000000000000000, 999999999999999999),
            'avatar_url' => null,
            'password' => Hash::make(Str::random(32)), // random - never used for Google accounts
            'role' => 'staff',
            'requester_type' => null,
            'terms_accepted_at' => Carbon::create(2026, 1, 12, 10, 30, 0),
            'onboarding_completed_at' => Carbon::create(2026, 1, 12, 10, 45, 0),
            'created_at' => Carbon::create(2026, 1, 12, 10, 30, 0),
            'updated_at' => Carbon::create(2026, 1, 12, 10, 45, 0),
        ]);

        User::create([
            'name' => 'James Anderson',
            'nickname' => 'James',
            'email' => 'james.anderson@outlook.com',
            'email_verified_at' => Carbon::create(2026, 1, 20, 14, 15, 0),
            'google_id' => null,
            'avatar_url' => null,
            'password' => Hash::make('Staff@Office2026'),
            'role' => 'staff',
            'requester_type' => null,
            'terms_accepted_at' => Carbon::create(2026, 1, 20, 14, 15, 0),
            'onboarding_completed_at' => Carbon::create(2026, 1, 20, 14, 30, 0),
            'created_at' => Carbon::create(2026, 1, 20, 14, 15, 0),
            'updated_at' => Carbon::create(2026, 1, 20, 14, 30, 0),
        ]);

        User::create([
            'name' => 'Priya Sharma',
            'nickname' => 'Priya',
            'email' => 'priya.sharma@gmail.com',
            'email_verified_at' => Carbon::create(2026, 2, 3, 8, 45, 0),
            'google_id' => (string) random_int(100000000000000000, 999999999999999999),
            'avatar_url' => null,
            'password' => Hash::make(Str::random(32)),
            'role' => 'staff',
            'requester_type' => null,
            'terms_accepted_at' => Carbon::create(2026, 2, 3, 8, 45, 0),
            'onboarding_completed_at' => Carbon::create(2026, 2, 3, 9, 0, 0),
            'created_at' => Carbon::create(2026, 2, 3, 8, 45, 0),
            'updated_at' => Carbon::create(2026, 2, 3, 9, 0, 0),
        ]);

        // ---------- REQUESTERS / USERS (8) ----------
        // 4 manual, 4 Google. Half employee, half visitor.
        // Registration dates spread from Jan through Jul 2026 so different
        // users are "on the system" for different lengths of time.

        User::create([
            'name' => 'Liam Walker',
            'nickname' => null,
            'email' => 'liam.walker@gmail.com',
            'email_verified_at' => Carbon::create(2026, 1, 28, 11, 20, 0),
            'google_id' => (string) random_int(100000000000000000, 999999999999999999),
            'avatar_url' => null,
            'password' => Hash::make(Str::random(32)),
            'role' => 'user',
            'requester_type' => 'employee',
            'terms_accepted_at' => Carbon::create(2026, 1, 28, 11, 20, 0),
            'onboarding_completed_at' => Carbon::create(2026, 1, 28, 11, 25, 0),
            'created_at' => Carbon::create(2026, 1, 28, 11, 20, 0),
            'updated_at' => Carbon::create(2026, 1, 28, 11, 25, 0),
        ]);

        User::create([
            'name' => 'Sofia Rossi',
            'nickname' => 'Sof',
            'email' => 'sofia.rossi@yahoo.com',
            'email_verified_at' => Carbon::create(2026, 2, 10, 16, 5, 0),
            'google_id' => null,
            'avatar_url' => null,
            'password' => Hash::make('User@Office2026'),
            'role' => 'user',
            'requester_type' => 'visitor',
            'terms_accepted_at' => Carbon::create(2026, 2, 10, 16, 5, 0),
            'onboarding_completed_at' => Carbon::create(2026, 2, 10, 16, 12, 0),
            'created_at' => Carbon::create(2026, 2, 10, 16, 5, 0),
            'updated_at' => Carbon::create(2026, 2, 10, 16, 12, 0),
        ]);

        User::create([
            'name' => 'Ethan Kim',
            'nickname' => null,
            'email' => 'ethan.kim@outlook.com',
            'email_verified_at' => Carbon::create(2026, 3, 8, 9, 30, 0),
            'google_id' => null,
            'avatar_url' => null,
            'password' => Hash::make('User@Office2026'),
            'role' => 'user',
            'requester_type' => 'employee',
            'terms_accepted_at' => Carbon::create(2026, 3, 8, 9, 30, 0),
            'onboarding_completed_at' => Carbon::create(2026, 3, 8, 9, 40, 0),
            'created_at' => Carbon::create(2026, 3, 8, 9, 30, 0),
            'updated_at' => Carbon::create(2026, 3, 8, 9, 40, 0),
        ]);

        User::create([
            'name' => 'Olivia Bennett',
            'nickname' => 'Liv',
            'email' => 'olivia.bennett@gmail.com',
            'email_verified_at' => Carbon::create(2026, 3, 22, 13, 45, 0),
            'google_id' => (string) random_int(100000000000000000, 999999999999999999),
            'avatar_url' => null,
            'password' => Hash::make(Str::random(32)),
            'role' => 'user',
            'requester_type' => 'visitor',
            'terms_accepted_at' => Carbon::create(2026, 3, 22, 13, 45, 0),
            'onboarding_completed_at' => Carbon::create(2026, 3, 22, 13, 50, 0),
            'created_at' => Carbon::create(2026, 3, 22, 13, 45, 0),
            'updated_at' => Carbon::create(2026, 3, 22, 13, 50, 0),
        ]);

        User::create([
            'name' => 'Noah Martinez',
            'nickname' => null,
            'email' => 'noah.martinez@gmail.com',
            'email_verified_at' => Carbon::create(2026, 4, 15, 10, 0, 0),
            'google_id' => (string) random_int(100000000000000000, 999999999999999999),
            'avatar_url' => null,
            'password' => Hash::make(Str::random(32)),
            'role' => 'user',
            'requester_type' => 'employee',
            'terms_accepted_at' => Carbon::create(2026, 4, 15, 10, 0, 0),
            'onboarding_completed_at' => Carbon::create(2026, 4, 15, 10, 8, 0),
            'created_at' => Carbon::create(2026, 4, 15, 10, 0, 0),
            'updated_at' => Carbon::create(2026, 4, 15, 10, 8, 0),
        ]);

        User::create([
            'name' => 'Emma Dubois',
            'nickname' => null,
            'email' => 'emma.dubois@icloud.com',
            'email_verified_at' => Carbon::create(2026, 5, 6, 15, 30, 0),
            'google_id' => null,
            'avatar_url' => null,
            'password' => Hash::make('User@Office2026'),
            'role' => 'user',
            'requester_type' => 'visitor',
            'terms_accepted_at' => Carbon::create(2026, 5, 6, 15, 30, 0),
            'onboarding_completed_at' => Carbon::create(2026, 5, 6, 15, 35, 0),
            'created_at' => Carbon::create(2026, 5, 6, 15, 30, 0),
            'updated_at' => Carbon::create(2026, 5, 6, 15, 35, 0),
        ]);

        User::create([
            'name' => 'Rohan Patel',
            'nickname' => null,
            'email' => 'rohan.patel@gmail.com',
            'email_verified_at' => Carbon::create(2026, 6, 18, 12, 15, 0),
            'google_id' => (string) random_int(100000000000000000, 999999999999999999),
            'avatar_url' => null,
            'password' => Hash::make(Str::random(32)),
            'role' => 'user',
            'requester_type' => 'employee',
            'terms_accepted_at' => Carbon::create(2026, 6, 18, 12, 15, 0),
            'onboarding_completed_at' => Carbon::create(2026, 6, 18, 12, 20, 0),
            'created_at' => Carbon::create(2026, 6, 18, 12, 15, 0),
            'updated_at' => Carbon::create(2026, 6, 18, 12, 20, 0),
        ]);

        User::create([
            'name' => 'Isabelle Laurent',
            'nickname' => 'Belle',
            'email' => 'isabelle.laurent@outlook.com',
            'email_verified_at' => Carbon::create(2026, 7, 9, 14, 40, 0),
            'google_id' => null,
            'avatar_url' => null,
            'password' => Hash::make('User@Office2026'),
            'role' => 'user',
            'requester_type' => 'visitor',
            'terms_accepted_at' => Carbon::create(2026, 7, 9, 14, 40, 0),
            'onboarding_completed_at' => Carbon::create(2026, 7, 9, 14, 48, 0),
            'created_at' => Carbon::create(2026, 7, 9, 14, 40, 0),
            'updated_at' => Carbon::create(2026, 7, 9, 14, 48, 0),
        ]);
    }
}