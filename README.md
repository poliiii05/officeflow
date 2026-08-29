# OfficeFlow

A three-role office ticketing and appointment system: requesters submit tickets and book appointments, staff claim and resolve them during tracked shifts, and a super admin oversees the entire operation.

Built with Laravel 13, React 19 (Vite + TypeScript), and PostgreSQL. Real-time updates are pushed through Laravel Reverb over WebSockets, so a ticket claimed by one staff member disappears from every other open queue without a refresh.

## Live demo

Deployment writeup coming soon. To try it locally, follow the setup guide below and log in with the seeded credentials listed in [`SEED_CREDENTIALS.md`](./SEED_CREDENTIALS.md).

Fastest path in:

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@officeflow.dev` | `Admin@2026Dev` |
| Staff | `james.anderson@outlook.com` | `Staff@Office2026` |
| Requester | `sofia.rossi@yahoo.com` | `User@Office2026` |

## The three workspaces

The same Laravel API serves three completely different frontends, gated by role:

**Requester** — Submit tickets, book appointments, follow the reply thread, get notified when staff respond. See only your own requests.

**Staff** — A live queue of unclaimed tickets and appointments. Claim them, update statuses, message the requester, all while a shift is running. Shift timer must be started before any queue action is allowed; ending the shift pauses the ability to reply. Shift history is filterable by preset date ranges (Last 7 / 30 / 60 days), matching the pattern used by timesheet tools like When I Work.

**Super Admin** — Everything above, plus user role management, cross-team analytics, audit logs, system settings (maintenance mode, requester access policy, session timeout), and a monitoring queue that shows work across all staff.

## Why this was harder than it looks

**Roles are not just a column — they are a routing concern.**
Every route in the SPA lives inside one of three nested guards: `ProtectedRoute` → `StaffRoute` → `SuperAdminRoute`. A super admin visiting `/staff/dashboard` should see the staff view, not get bounced. A requester visiting `/super-admin/anything` should be sent home. The backend mirrors this: staff-scoped controllers call `ensureStaffUser($request)` and abort 403 if the role does not match. The frontend guard alone is not the security boundary.

**One active shift per staff, enforced at the database level.**
Application-level "only one shift open at a time" checks break under concurrent requests: two clicks within 100ms of each other can both pass the check and both insert a row. The migration solves this with a partial unique index:

```sql
CREATE UNIQUE INDEX staff_shifts_one_active_per_user
  ON staff_shifts (user_id) WHERE ended_at IS NULL
```

The database refuses the second insert. The API catches the constraint violation and returns a clean error. There is no scenario where a staff member ends up with two open shifts.

**Real-time is not a nice-to-have when queues are shared.**
If Maria and James both see "Ticket #4712 - Unassigned" and Maria clicks Claim first, James's UI needs to update before he clicks the same button. Laravel Reverb broadcasts `TicketChanged` / `AppointmentChanged` events on a shared `officeflow.staff` channel, and every staff panel (queue, my work, dashboard) listens and refetches silently. The refetch is silent on purpose — no loading spinner flash — so it feels like the row just quietly disappears.

**Two auth flows, one user table.**
Manual sign-up requires an email verification link (with a signed URL that expires) before the account is usable. Google OAuth via Socialite skips verification because Google already vouched for the email. Both paths land in the same `users` table with the same role / requester_type columns, but `google_id` distinguishes them and a random password hash occupies the `password` field for Google accounts (never used, but the column is NOT NULL). The frontend `EmailSection` reads `email_verified_at || google_id` to decide whether to show the "Verified" badge.

**Overdue in a queue is not the same as overdue in a report.**
The Records page (history) uses calendar presets — This week, This month — because you are asking "what did we do in July." The Queue page uses time-elapsed presets — Today, Overdue — because you are asking "what is waiting right now that should not be." Different questions, different filter shapes. The `SubmittedDateFilter` component supports both preset families through the same interface, but each panel picks a subset that matches its purpose.

## Features

### Requester
- Submit tickets with department, category, priority, and description
- Book appointments with a scheduled date/time and purpose
- Follow a live message thread with the assigned staff
- Notifications when staff reply or update status
- Update profile, verify email, change password

### Staff
- Shared queue of unclaimed tickets and appointments, with All / Today / Overdue filters
- Claim workflow: only allowed while on a running shift
- My Work view: only assigned requests, with inline status updates and reply thread
- Records view: full history of tickets / appointments, searchable and filterable
- Shift tracking: start / end shifts with end reasons (Early out, End shift)
- Shift history: Last 7 / 30 / 60 days or custom range, with duration and completed-work counts
- Productivity chart: resolved tickets and completed appointments over the last 7 / 14 / 30 days

### Super Admin
- Everything staff can see, unfiltered
- User management with role editing
- Staff management: assign staff, see current shift status
- Queue monitor across all staff, with date-range and status filters
- Ticket + appointment management pages with cross-staff assignment
- Audit logs: every meaningful action (registration, shift start/end, ticket claim/resolve, appointment claim/complete/cancel), with actor, module, IP, user agent
- Analytics: request volume trends, resolution rates, staff productivity comparisons
- System settings: maintenance mode, office branding, requester access policy, session timeout, audit retention

### Cross-cutting
- Email verification for manual sign-ups
- Google OAuth sign-in
- Terms + onboarding gates for new users
- Maintenance mode: gates the entire app behind a public maintenance page except super admins
- Rate limiting per route (180/min reads, 60/min writes, 30/min password changes)

## Stack

| Layer | Choice |
|---|---|
| Backend | Laravel 13.8, PHP 8.3 |
| API auth | Laravel Sanctum (bearer tokens), Socialite (Google OAuth) |
| Real-time | Laravel Reverb (WebSocket server) + Laravel Echo + Pusher.js client |
| Database | PostgreSQL 17 (SQLite fallback for zero-config local runs) |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4, shadcn/ui, lucide-react icons |
| Data fetching | Axios (custom interceptor for 401 auto-redirect) |
| Charts | Chart.js + react-chartjs-2 |
| Routing | react-router-dom v7 |

Everything is server-owned. There is no client-side state library — auth is in localStorage, everything else is a fetch away and Reverb pushes changes. The tradeoff: heavier network traffic, but no stale-state bugs.

## Repository layout

```
officeflow/
├── backend/                      Laravel API
│   ├── app/
│   │   ├── Events/               Broadcast events (TicketChanged, AppointmentChanged, etc.)
│   │   ├── Http/Controllers/Api/V1/
│   │   │   ├── Auth, Account, Ticket, Appointment, Notification controllers
│   │   │   ├── Staff*             Staff-scoped: Dashboard, Queue, Records, Shift, Analytics
│   │   │   └── SuperAdmin*        Super admin-scoped: Dashboard, Users, Audit, Analytics, Settings
│   │   ├── Models/                User, Ticket, TicketActivity, Appointment,
│   │   │                          AppointmentActivity, StaffShift, AuditLog, SystemSetting
│   │   └── Notifications/         Email notifications for ticket / appointment replies
│   ├── database/
│   │   ├── migrations/            17 migrations covering all tables and constraints
│   │   ├── factories/UserFactory.php
│   │   └── seeders/               DatabaseSeeder + 6 domain seeders (see SEED_CREDENTIALS.md)
│   └── routes/api.php             All API routes under /api/v1
│
├── frontend/                      Vite + React SPA
│   └── src/
│       ├── app/                   AppRouter + route guards (Protected, Staff, SuperAdmin)
│       ├── layouts/               DashboardLayout, AuthLayout, SuperAdminLayout
│       ├── pages/                 Thin route-level components, one per URL
│       ├── features/              Feature-first modules (own API client + components)
│       │   ├── account/           Profile, email, password (shared across roles)
│       │   ├── auth/              Login, register API
│       │   ├── tickets/           Ticket dialogs + API
│       │   ├── appointments/      Appointment dialogs + API
│       │   ├── notifications/     Notification API
│       │   ├── onboarding/        Post-signup guided dialogs
│       │   ├── legal/             Terms and privacy dialogs
│       │   ├── user/              Requester dashboards and panels
│       │   ├── staff/             Staff dashboards, queue, work, records, shifts, settings
│       │   └── super-admin/       Super admin panels (users, staff, tickets, appointments,
│       │                          queue monitor, audit logs, analytics, settings)
│       ├── components/ui/         shadcn/ui primitives
│       └── lib/                   api.ts (axios), auth-storage.ts, echo.ts, utils.ts
│
├── docs/
│   └── setup.md                   Detailed local setup guide (Postgres, Laragon, ports)
│
├── SEED_CREDENTIALS.md            All demo login accounts after running the seeder
└── SEED_SETUP_GUIDE.md            How to reset the database and re-seed
```

## Running it locally

Requirements: PHP 8.3, Composer, Node 22+, PostgreSQL 17 (or use SQLite fallback), Git.

```bash
git clone https://github.com/poliiii05/officeflow.git
cd officeflow
```

**Backend:**
```bash
cd backend
composer install
cp .env.example .env       # on Windows: copy .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
cp .env.example .env       # on Windows: copy .env.example .env
npm run dev
```

**Reverb (optional, third terminal — required only if you want real-time updates in local dev):**
```bash
cd backend
php artisan reverb:start
```

Then open http://localhost:5173 and log in with any credential from [`SEED_CREDENTIALS.md`](./SEED_CREDENTIALS.md).

Full setup with PostgreSQL configuration, environment variables, and Google OAuth setup is in [`docs/setup.md`](./docs/setup.md). Seeder details and troubleshooting are in [`SEED_SETUP_GUIDE.md`](./SEED_SETUP_GUIDE.md).

## Deployment

Deployment writeup and hosted demo link are coming next. The stack requires a hybrid setup because the Laravel API and Reverb WebSocket server cannot run on Vercel:

- **Frontend** → Vercel (static Vite build)
- **Backend + Postgres + Reverb** → Railway / Render / Fly.io (persistent server needed for WebSockets)

Full guide will land in `docs/deployment.md`.

## License

MIT