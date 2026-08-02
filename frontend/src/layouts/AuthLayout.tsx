import { Link, Outlet } from 'react-router-dom'
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  MessageSquareText,
} from 'lucide-react'

const previewTickets = [
  {
    id: 'TCK-1042',
    title: 'Printer offline - 3rd floor',
    status: 'In progress',
    time: '2m ago',
    icon: Clock3,
    statusClass: 'bg-amber-500/15 text-amber-700',
  },
  {
    id: 'TCK-1041',
    title: 'New hire desk setup',
    status: 'Resolved',
    time: '18m ago',
    icon: CheckCircle2,
    statusClass: 'bg-emerald-500/15 text-emerald-700',
  },
  {
    id: 'APT-0087',
    title: 'HR onboarding appointment',
    status: 'Scheduled',
    time: 'Today, 2:00 PM',
    icon: MessageSquareText,
    statusClass: 'bg-sky-500/15 text-sky-700',
  },
]

const summaryCards = [
  { label: 'Appointments', value: '12', icon: CalendarCheck },
  { label: 'Open tickets', value: '8', icon: FileText },
  { label: 'Avg response', value: '24m', icon: Clock3 },
]

export function AuthLayout() {
  return (
    <main className="h-screen overflow-hidden bg-slate-50 p-2 text-foreground sm:p-3">
      <div className="mx-auto grid h-full max-w-7xl overflow-hidden rounded-2xl border bg-background shadow-sm lg:grid-cols-[1.12fr_0.88fr]">
        <section className="hidden bg-muted/35 px-7 py-6 lg:flex lg:items-center lg:justify-center">
          <div className="w-full max-w-2xl space-y-5">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <p className="text-lg font-semibold">OfficeFlow</p>
                <p className="text-sm text-muted-foreground">Appointment & Ticketing</p>
              </div>
            </Link>

            <div>
              <p className="text-sm font-medium">Office service portal</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight">
                Keep office requests organized from first message to final resolution.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Submit requests, book appointments, and track updates while staff manage every queue in one workspace.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {summaryCards.map((item) => {
                const Icon = item.icon

                return (
                  <div key={item.label} className="rounded-xl border bg-background p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="text-xl font-semibold">{item.value}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{item.label}</p>
                  </div>
                )
              })}
            </div>

            <div className="rounded-2xl border bg-background p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Today&apos;s queue</p>
                  <p className="text-xs text-muted-foreground">Sample tickets and appointments</p>
                </div>

                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>

              <ul className="space-y-2">
                {previewTickets.map((ticket) => {
                  const Icon = ticket.icon

                  return (
                    <li key={ticket.id} className="flex items-center gap-3 rounded-xl bg-muted/45 p-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.id} - {ticket.time}
                        </p>
                      </div>

                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${ticket.statusClass}`}>
                        {ticket.status}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </section>

        <section className="flex h-full items-center justify-center px-5 py-5 sm:px-7">
          <div className="w-full max-w-md">
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <p className="font-semibold">OfficeFlow</p>
                <p className="text-sm text-muted-foreground">Appointment & Ticketing</p>
              </div>
            </div>

            <Outlet />
          </div>
        </section>
      </div>
    </main>
  )
}