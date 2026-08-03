import {
  Bell,
  CalendarCheck,
  ClipboardList,
  FileText,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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
  getNotifications,
  type OfficeFlowNotification,
} from '@/features/notifications/notification-api'
import {
  getTickets,
  type Ticket,
} from '@/features/tickets/ticket-api'
import { NewTicketDialog } from '@/features/tickets/components/NewTicketDialog'
import { TicketDetailsDialog } from '@/features/tickets/components/TicketDetailsDialog'
import { getStoredUser } from '@/lib/auth-storage'
import { echo } from '@/lib/echo'
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
  return status.replaceAll('_', ' ')
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function UserDashboardPanel() {
  const user = getStoredUser()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [notifications, setNotifications] = useState<OfficeFlowNotification[]>([])
  const [ticketTotal, setTicketTotal] = useState(0)
  const [appointmentTotal, setAppointmentTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboardData({ silent = false } = {}) {
    if (!silent) setIsLoading(true)

    try {
      const [ticketResponse, appointmentResponse, notificationResponse] =
        await Promise.all([
          getTickets({ per_page: 5 }),
          getAppointments({ per_page: 5 }),
          getNotifications(),
        ])

      setTickets(ticketResponse.data)
      setAppointments(appointmentResponse.data)
      setNotifications(notificationResponse.data.slice(0, 4))
      setTicketTotal(ticketResponse.meta.total)
      setAppointmentTotal(appointmentResponse.meta.total)
      setUnreadCount(notificationResponse.meta.unread_count)
      setError('')
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load your dashboard.'))
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboardData()
  }, [])

  useEffect(() => {
    if (!user?.id) return

    const userChannel = echo.channel(`officeflow.user.${user.id}`)
    const staffChannel = echo.channel('officeflow.staff')

    const refreshSilently = () => {
      void loadDashboardData({ silent: true })
    }

    userChannel.listen('.notification.changed', refreshSilently)
    staffChannel.listen('.ticket.changed', refreshSilently)
    staffChannel.listen('.appointment.changed', refreshSilently)

    return () => {
      userChannel.stopListening('.notification.changed', refreshSilently)
      staffChannel.stopListening('.ticket.changed', refreshSilently)
      staffChannel.stopListening('.appointment.changed', refreshSilently)
      echo.leaveChannel(`officeflow.user.${user.id}`)
      echo.leaveChannel('officeflow.staff')
    }
  }, [user?.id])

  const dashboardStats = [
    {
      label: 'Service requests',
      value: ticketTotal,
      detail: 'All requests from your account',
      icon: ClipboardList,
      card: 'border-sky-200 bg-sky-50',
      iconBox: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Appointments',
      value: appointmentTotal,
      detail: 'All submitted schedules',
      icon: CalendarCheck,
      card: 'border-emerald-200 bg-emerald-50',
      iconBox: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Unread updates',
      value: unreadCount,
      detail: 'New staff replies and status changes',
      icon: Bell,
      card: 'border-violet-200 bg-violet-50',
      iconBox: 'bg-violet-100 text-violet-700',
    },
  ]

  return (
    <section className="mx-auto max-w-7xl">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Badge
            variant="secondary"
            className="mb-3 border border-sky-200 bg-sky-50 text-sky-700"
          >
            Requester portal
          </Badge>

          <h2 className="text-2xl font-semibold">
            Welcome back, {user?.name ?? 'OfficeFlow User'}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Submit service requests, request office appointments, and follow staff updates.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <NewTicketDialog onCreated={() => loadDashboardData({ silent: true })} />
          <BookAppointmentDialog
            onCreated={() => loadDashboardData({ silent: true })}
          />
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon

          return (
            <div
              key={stat.label}
              className={cn('rounded-lg border p-4 shadow-sm', stat.card)}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
                </div>

                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg',
                    stat.iconBox
                  )}
                >
                  <Icon className="size-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <section className="overflow-hidden rounded-lg border border-sky-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b bg-sky-50/70 px-5 py-4">
            <div>
              <h3 className="font-semibold">Recent service requests</h3>
              <p className="text-sm text-muted-foreground">
                Your latest concerns, document requests, and service follow-ups.
              </p>
            </div>

            <Link to="/tickets">
              <Button type="button" variant="outline" className="cursor-pointer bg-white">
                View all
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="px-5 py-8 text-sm text-muted-foreground">
              Loading requests...
            </div>
          ) : tickets.length ? (
            tickets.map((ticket) => (
              <article
                key={ticket.id}
                className="grid gap-4 border-b px-5 py-4 transition-colors last:border-b-0 hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
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
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {ticket.ticket_number} - {ticket.department} - {ticket.category}
                    </p>
                  </div>
                </div>

                <TicketDetailsDialog ticket={ticket} mode="activity" />
              </article>
            ))
          ) : (
            <div className="px-5 py-10 text-sm text-muted-foreground">
              No service requests yet. Submit one when you need office assistance.
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b bg-emerald-50/70 px-5 py-4">
              <div>
                <h3 className="font-semibold">Recent appointments</h3>
                <p className="text-sm text-muted-foreground">
                  Requested office visits and their current status.
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
                          className={cn(
                            'border-0 capitalize',
                            statusStyles[appointment.status]
                          )}
                        >
                          {formatStatus(appointment.status)}
                        </Badge>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {appointment.appointment_number} -{' '}
                        {formatDateTime(appointment.scheduled_at)}
                      </p>

                      <div className="mt-3">
                        <AppointmentDetailsDialog
                          appointment={appointment}
                          mode="activity"
                        />
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="px-5 py-10 text-sm text-muted-foreground">
                No appointments yet. Request a schedule when an office visit is needed.
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-lg border border-violet-100 bg-white shadow-sm">
            <div className="border-b bg-violet-50/80 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <Bell className="size-4" />
                </div>
                <div>
                  <h3 className="font-semibold">Latest updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Staff replies and changes to your requests.
                  </p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="px-5 py-8 text-sm text-muted-foreground">
                Loading updates...
              </div>
            ) : notifications.length ? (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <article key={notification.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'mt-2 size-2 shrink-0 rounded-full',
                          notification.read_at ? 'bg-slate-300' : 'bg-violet-500'
                        )}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-sm font-medium">
                            {notification.data.title ?? 'Request update'}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(notification.created_at)}
                          </span>
                        </div>

                        <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">
                          {notification.data.message ?? 'Your request has a new update.'}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-sm text-muted-foreground">
                New staff replies and request updates will appear here.
              </div>
            )}

            <div className="border-t px-5 py-3">
              <Link
                to="/notifications"
                className="text-sm font-medium text-violet-700 hover:underline"
              >
                View all notifications
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
