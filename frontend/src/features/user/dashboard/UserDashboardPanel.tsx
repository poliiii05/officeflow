import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  Plus,
  TicketCheck,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getAppointments,
  type Appointment,
} from '@/features/appointments/appointment-api'
import { AppointmentDetailsDialog } from '@/features/appointments/components/AppointmentDetailsDialog'
import { BookAppointmentDialog } from '@/features/appointments/components/BookAppointmentDialog'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import {
  getTicketActivities,
  getTickets,
  type Ticket,
  type TicketActivity,
} from '@/features/tickets/ticket-api'
import { NewTicketDialog } from '@/features/tickets/components/NewTicketDialog'
import { TicketDetailsDialog } from '@/features/tickets/components/TicketDetailsDialog'
import { echo } from '@/lib/echo'
import { getStoredUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  open: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-200 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-sky-100 text-sky-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-200 text-slate-700',
}

function formatStatus(status: string) {
  return status.replace('_', ' ')
}

export function UserDashboardPanel() {
  const user = getStoredUser()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [recentActivities, setRecentActivities] = useState<TicketActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboardData() {
    setIsLoading(true)

    try {
      const [ticketResponse, appointmentResponse] = await Promise.all([
        getTickets({ per_page: 5 }),
        getAppointments({ per_page: 5 }),
      ])

      setTickets(ticketResponse.data)
      setAppointments(appointmentResponse.data)

      const activityResponses = await Promise.all(
        ticketResponse.data.slice(0, 3).map((ticket) => getTicketActivities(ticket.id))
      )

      const latestActivities = activityResponses
        .flatMap((response) => response.data)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 4)

      setRecentActivities(latestActivities)
      setError('')
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load your dashboard.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboardData()
  }, [])

  useEffect(() => {
    if (!user?.id) return

    const userChannel = echo.channel(`officeflow.user.${user.id}`)
    const staffChannel = echo.channel('officeflow.staff')

    userChannel.listen('.notification.changed', () => {
      void loadDashboardData()
    })

    staffChannel.listen('.ticket.changed', () => {
      void loadDashboardData()
    })

    staffChannel.listen('.appointment.changed', () => {
      void loadDashboardData()
    })

    return () => {
      userChannel.stopListening('.notification.changed')
      staffChannel.stopListening('.ticket.changed')
      staffChannel.stopListening('.appointment.changed')
      echo.leaveChannel(`officeflow.user.${user.id}`)
      echo.leaveChannel('officeflow.staff')
    }
  }, [user?.id])

  const activeTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) => ticket.status === 'open' || ticket.status === 'in_progress'
      ).length,
    [tickets]
  )

  const upcomingAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.status === 'pending' || appointment.status === 'scheduled'
      ).length,
    [appointments]
  )

  const resolvedTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) => ticket.status === 'resolved' || ticket.status === 'closed'
      ).length,
    [tickets]
  )

  const dashboardStats = [
    {
      label: 'Active tickets',
      value: String(activeTickets),
      icon: TicketCheck,
      card: 'border-sky-200 bg-sky-50',
      iconBox: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Appointments',
      value: String(upcomingAppointments),
      icon: CalendarCheck,
      card: 'border-emerald-200 bg-emerald-50',
      iconBox: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Resolved',
      value: String(resolvedTickets),
      icon: CheckCircle2,
      card: 'border-violet-200 bg-violet-50',
      iconBox: 'bg-violet-100 text-violet-700',
    },
    {
      label: 'Avg response',
      value: '24m',
      icon: Clock3,
      card: 'border-amber-200 bg-amber-50',
      iconBox: 'bg-amber-100 text-amber-700',
    },
  ]

  return (
    <section className="mx-auto max-w-7xl">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Badge
            variant="secondary"
            className="mb-3 border border-sky-200 bg-sky-50 text-sky-700 capitalize"
          >
            {user?.requester_type ?? 'visitor'} account
          </Badge>

          <h2 className="text-2xl font-semibold">
            Welcome back, {user?.name ?? 'OfficeFlow User'}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Submit service requests, book appointments, and follow staff updates.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <NewTicketDialog onCreated={loadDashboardData} />
          <BookAppointmentDialog onCreated={loadDashboardData} />
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon

          return (
            <div key={stat.label} className={cn('rounded-lg border p-4 shadow-sm', stat.card)}>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <div className={cn('flex size-10 items-center justify-center rounded-lg', stat.iconBox)}>
                  <Icon className="size-5" />
                </div>
              </div>

              <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <section className="overflow-hidden rounded-lg border border-sky-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b bg-sky-50/70 px-5 py-4">
            <div>
              <h3 className="font-semibold">Recent tickets</h3>
              <p className="text-sm text-muted-foreground">
                Latest service requests from your account.
              </p>
            </div>

            <Link to="/tickets">
              <Button type="button" variant="outline" className="cursor-pointer bg-white">
                View all
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="px-5 py-8 text-sm text-muted-foreground">Loading tickets...</div>
          ) : tickets.length ? (
            tickets.map((ticket) => (
              <article
                key={ticket.id}
                className="grid gap-4 border-b px-5 py-4 transition-colors last:border-b-0 hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_auto] md:items-start"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                    <FileText className="size-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{ticket.subject}</p>
                      <Badge
                        variant="secondary"
                        className={cn('border-0 capitalize', statusStyles[ticket.status])}
                      >
                        {formatStatus(ticket.status)}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {ticket.priority}
                      </Badge>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {ticket.ticket_number} - {ticket.department} - {ticket.category}
                    </p>
                  </div>
                </div>

                <div className="flex justify-start md:justify-end">
                  <TicketDetailsDialog ticket={ticket} mode="activity" />
                </div>
              </article>
            ))
          ) : (
            <div className="px-5 py-8 text-sm text-muted-foreground">
              No tickets yet. Create your first request.
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b bg-emerald-50/70 px-5 py-4">
              <div>
                <h3 className="font-semibold">Upcoming appointments</h3>
                <p className="text-sm text-muted-foreground">
                  Your office visits and pending schedules.
                </p>
              </div>

              <Link to="/appointments">
                <Button type="button" variant="outline" className="cursor-pointer bg-white">
                  View all
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="px-5 py-8 text-sm text-muted-foreground">
                Loading appointments...
              </div>
            ) : appointments.length ? (
              appointments.map((appointment) => (
                <article key={appointment.id} className="border-b px-5 py-4 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <CalendarCheck className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">
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
                        {appointment.appointment_number} -{' '}
                        {new Date(appointment.scheduled_at).toLocaleString()}
                      </p>

                      <div className="mt-3">
                        <AppointmentDetailsDialog appointment={appointment} mode="activity" />
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-muted-foreground">
                No appointments yet. Book your first schedule.
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-lg border border-violet-100 bg-white shadow-sm">
            <div className="border-b bg-violet-50/80 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <MessageSquareText className="size-4" />
                </div>
                <div>
                  <h3 className="font-semibold">Request activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Latest staff replies and request updates.
                  </p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="px-5 py-8 text-sm text-muted-foreground">Loading activity...</div>
            ) : recentActivities.length ? (
              <div className="divide-y">
                {recentActivities.map((activity) => (
                  <article key={activity.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                        <MessageSquareText className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {activity.user?.name ?? 'OfficeFlow'}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleString()}
                          </span>
                        </div>

                        <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {activity.message}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-sm text-muted-foreground">
                Staff replies and ticket updates will appear here.
              </div>
            )}
          </section>

          <section className="rounded-lg border border-amber-100 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Plus className="size-4" />
              </div>
              <div>
                <h3 className="font-semibold">Need help?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a ticket for service concerns or book an appointment for scheduled office visits.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}