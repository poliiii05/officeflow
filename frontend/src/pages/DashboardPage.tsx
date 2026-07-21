import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileText,
  LogOut,
  MessageSquareText,
  TicketCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BookAppointmentDialog } from '@/features/appointments/components/BookAppointmentDialog'
import { NewTicketDialog } from '@/features/tickets/components/NewTicketDialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo, useState } from 'react'
import { getAppointments, type Appointment } from '@/features/appointments/appointment-api'
import { getTickets, type Ticket } from '@/features/tickets/ticket-api'
import { AppointmentDetailsDialog } from '@/features/appointments/components/AppointmentDetailsDialog'
import { TicketDetailsDialog } from '@/features/tickets/components/TicketDetailsDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/api'
import { clearAuthSession, getStoredUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  open: 'bg-sky-500/10 text-sky-700',
  in_progress: 'bg-amber-500/10 text-amber-700',
  resolved: 'bg-emerald-500/10 text-emerald-700',
  closed: 'bg-slate-500/10 text-slate-700',
  pending: 'bg-amber-500/10 text-amber-700',
  scheduled: 'bg-emerald-500/10 text-emerald-700',
  completed: 'bg-violet-500/10 text-violet-700',
  cancelled: 'bg-slate-500/10 text-slate-700',
}

function getInitials(name?: string) {
  if (!name) return 'OF'

  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function DashboardPage() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const [tickets, setTickets] = useState<Ticket[]>([])
const [appointments, setAppointments] = useState<Appointment[]>([])
const [isLoading, setIsLoading] = useState(true)

async function loadDashboardData() {
  setIsLoading(true)

  try {
    const [ticketResponse, appointmentResponse] = await Promise.all([
      getTickets({ per_page: 5 }),
      getAppointments({ per_page: 5 }),
    ])

    setTickets(ticketResponse.data)
    setAppointments(appointmentResponse.data)
  } finally {
    setIsLoading(false)
  }
}

useEffect(() => {
  void loadDashboardData()
}, [])

const openTickets = useMemo(
  () => tickets.filter((ticket) => ticket.status !== 'resolved' && ticket.status !== 'closed').length,
  [tickets]
)

const scheduledAppointments = useMemo(
  () => appointments.filter((appointment) => appointment.status !== 'cancelled').length,
  [appointments]
)

const resolvedTickets = useMemo(
  () => tickets.filter((ticket) => ticket.status === 'resolved').length,
  [tickets]
)

const dashboardStats = [
  {
    label: 'Open tickets',
    value: String(openTickets),
    icon: TicketCheck,
    tone: 'text-sky-600',
  },
  {
    label: 'Appointments',
    value: String(scheduledAppointments),
    icon: CalendarCheck,
    tone: 'text-emerald-600',
  },
  {
    label: 'Resolved',
    value: String(resolvedTickets),
    icon: CheckCircle2,
    tone: 'text-violet-600',
  },
  {
    label: 'Avg response',
    value: '24m',
    icon: Clock3,
    tone: 'text-amber-600',
  },
]

  async function handleLogout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // Token may already be expired; still clear the local session.
    }

    clearAuthSession()
    navigate('/', { replace: true })
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <p className="font-semibold">OfficeFlow</p>
              <p className="text-sm text-muted-foreground">User workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" type="button" className="cursor-pointer">
              <Bell className="size-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-2 py-1.5">
                <Avatar className="size-8">
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium leading-none">{user?.name ?? 'OfficeFlow User'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <ChevronDown className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge variant="secondary" className="mb-3 capitalize">
              {user?.requester_type ?? 'visitor'} account
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back, {user?.name ?? 'OfficeFlow User'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your office tickets, appointment requests, and latest updates.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <NewTicketDialog onCreated={loadDashboardData} />
            <BookAppointmentDialog onCreated={loadDashboardData} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => {
            const Icon = stat.icon

            return (
              <div key={stat.label} className="rounded-lg border bg-background p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <Icon className={cn('size-5', stat.tone)} />
                </div>
                <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-lg border bg-background shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">Recent tickets</h2>
                <p className="text-sm text-muted-foreground">Latest service requests from your account.</p>
              </div>
              <FileText className="size-5 text-muted-foreground" />
            </div>

            {isLoading ? (
              <div className="px-5 py-8 text-sm text-muted-foreground">Loading tickets...</div>
            ) : tickets.length ? (
              tickets.map((ticket) => (
                <div key={ticket.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{ticket.subject}</p>
                      <Badge variant="secondary" className={cn('border-0', statusStyles[ticket.status] ?? '')}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                     {ticket.ticket_number} - {ticket.department} - {ticket.category}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {ticket.priority}
                    </Badge>
                    <TicketDetailsDialog ticket={ticket} />
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-muted-foreground">
                No tickets yet. Create your first request.
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-lg border bg-background shadow-sm">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">Upcoming appointments</h2>
                <p className="text-sm text-muted-foreground">Your scheduled office visits.</p>
              </div>

             {isLoading ? (
              <div className="px-5 py-8 text-sm text-muted-foreground">Loading appointments...</div>
            ) : appointments.length ? (
              appointments.map((appointment) => (
                <div key={appointment.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{appointment.purpose}</p>
                    <Badge variant="secondary" className={cn('border-0', statusStyles[appointment.status] ?? '')}>
                      {appointment.status}
                    </Badge>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {appointment.appointment_number} - {new Date(appointment.scheduled_at).toLocaleString()}
                  </p>

                  <div className="mt-3">
                    <AppointmentDetailsDialog appointment={appointment} />
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-muted-foreground">
                No appointments yet. Book your first schedule.
              </div>
            )}
            </section>

            <section className="rounded-lg border bg-background p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessageSquareText className="size-4" />
                </div>
                <div>
                  <h2 className="font-semibold">Latest update</h2>
                  <p className="text-sm text-muted-foreground">
                    Staff replied to your printer ticket 2 minutes ago.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  )
}