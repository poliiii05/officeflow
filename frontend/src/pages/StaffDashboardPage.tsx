import {
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileText,
  LogOut,
  TicketCheck,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getAppointments,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentStatus,
} from '@/features/appointments/appointment-api'
import { AppointmentDetailsDialog } from '@/features/appointments/components/AppointmentDetailsDialog'
import { getApiErrorMessage, logoutUser } from '@/features/auth/auth-api'
import {
  getTickets,
  updateTicketStatus,
  type Ticket,
  type TicketStatus,
} from '@/features/tickets/ticket-api'
import { TicketDetailsDialog } from '@/features/tickets/components/TicketDetailsDialog'
import { getStoredUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

const ticketStatusOptions: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']
const appointmentStatusOptions: AppointmentStatus[] = ['pending', 'scheduled', 'completed', 'cancelled']

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

function formatStatus(status: string) {
  return status.replace('_', ' ')
}

export function StaffDashboardPage() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingKey, setUpdatingKey] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function loadStaffData() {
    setIsLoading(true)
    setError('')

    try {
      const [ticketResponse, appointmentResponse] = await Promise.all([
        getTickets({ per_page: 10 }),
        getAppointments({ per_page: 10 }),
      ])

      setTickets(ticketResponse.data)
      setAppointments(appointmentResponse.data)
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to load staff dashboard data.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadStaffData()
  }, [])

  const activeTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_progress').length,
    [tickets]
  )

  const pendingAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'pending').length,
    [appointments]
  )

  const completedRequests = useMemo(
    () =>
      tickets.filter((ticket) => ticket.status === 'resolved' || ticket.status === 'closed').length +
      appointments.filter((appointment) => appointment.status === 'completed').length,
    [appointments, tickets]
  )

  const staffStats = [
    {
      label: 'Active tickets',
      value: String(activeTickets),
      icon: TicketCheck,
      tone: 'text-sky-600',
    },
    {
      label: 'Pending appointments',
      value: String(pendingAppointments),
      icon: CalendarCheck,
      tone: 'text-amber-600',
    },
    {
      label: 'Completed requests',
      value: String(completedRequests),
      icon: CheckCircle2,
      tone: 'text-emerald-600',
    },
    {
      label: 'Avg response',
      value: '24m',
      icon: Clock3,
      tone: 'text-violet-600',
    },
  ]

  async function handleTicketStatusChange(ticketId: number, status: TicketStatus) {
    setUpdatingKey(`ticket-${ticketId}`)
    setError('')

    try {
      await updateTicketStatus(ticketId, status)
      await loadStaffData()
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to update ticket status.'))
    } finally {
      setUpdatingKey(null)
    }
  }

  async function handleAppointmentStatusChange(
    appointmentId: number,
    status: AppointmentStatus
  ) {
    setUpdatingKey(`appointment-${appointmentId}`)
    setError('')

    try {
      await updateAppointmentStatus(appointmentId, status)
      await loadStaffData()
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to update appointment status.'))
    } finally {
      setUpdatingKey(null)
    }
  }

  async function handleLogout() {
    await logoutUser()
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
              <p className="text-sm text-muted-foreground">Staff workspace</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-2 py-1.5">
              <Avatar className="size-8">
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none">{user?.name ?? 'Staff User'}</p>
                <p className="mt-1 text-xs text-muted-foreground">{user?.role ?? 'staff'}</p>
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
      </header>

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge variant="secondary" className="mb-3">
              Staff operations
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight">
              Manage tickets and appointments
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review incoming office requests, update statuses, and keep requesters informed.
            </p>
          </div>

          <Button variant="outline" className="w-fit cursor-pointer" onClick={loadStaffData}>
            Refresh queue
          </Button>
        </div>

        {error ? (
          <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {staffStats.map((stat) => {
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

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-lg border bg-background shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">Ticket queue</h2>
                <p className="text-sm text-muted-foreground">Requests submitted by users and visitors.</p>
              </div>
              <FileText className="size-5 text-muted-foreground" />
            </div>

            {isLoading ? (
              <div className="px-5 py-8 text-sm text-muted-foreground">Loading tickets...</div>
            ) : tickets.length ? (
              tickets.map((ticket) => (
                <div key={ticket.id} className="border-b px-5 py-4 last:border-b-0">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{ticket.subject}</p>
                        <Badge
                          variant="secondary"
                          className={cn('border-0 capitalize', statusStyles[ticket.status])}
                        >
                          {formatStatus(ticket.status)}
                        </Badge>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {ticket.ticket_number} - {ticket.department} - {ticket.category}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={ticket.status}
                        disabled={updatingKey === `ticket-${ticket.id}`}
                        onChange={(event) =>
                          void handleTicketStatusChange(ticket.id, event.target.value as TicketStatus)
                        }
                        className="h-9 cursor-pointer rounded-md border bg-background px-3 text-sm capitalize"
                      >
                        {ticketStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {formatStatus(status)}
                          </option>
                        ))}
                      </select>

                      <TicketDetailsDialog ticket={ticket} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-muted-foreground">No tickets found.</div>
            )}
          </section>

          <section className="rounded-lg border bg-background shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">Appointment queue</h2>
                <p className="text-sm text-muted-foreground">Appointment requests waiting for staff action.</p>
              </div>
              <Users className="size-5 text-muted-foreground" />
            </div>

            {isLoading ? (
              <div className="px-5 py-8 text-sm text-muted-foreground">Loading appointments...</div>
            ) : appointments.length ? (
              appointments.map((appointment) => (
                <div key={appointment.id} className="border-b px-5 py-4 last:border-b-0">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{appointment.purpose}</p>
                        <Badge
                          variant="secondary"
                          className={cn('border-0 capitalize', statusStyles[appointment.status])}
                        >
                          {formatStatus(appointment.status)}
                        </Badge>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {appointment.appointment_number} - {appointment.department} -{' '}
                        {new Date(appointment.scheduled_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={appointment.status}
                        disabled={updatingKey === `appointment-${appointment.id}`}
                        onChange={(event) =>
                          void handleAppointmentStatusChange(
                            appointment.id,
                            event.target.value as AppointmentStatus
                          )
                        }
                        className="h-9 cursor-pointer rounded-md border bg-background px-3 text-sm capitalize"
                      >
                        {appointmentStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {formatStatus(status)}
                          </option>
                        ))}
                      </select>

                      <AppointmentDetailsDialog appointment={appointment} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-muted-foreground">No appointments found.</div>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}