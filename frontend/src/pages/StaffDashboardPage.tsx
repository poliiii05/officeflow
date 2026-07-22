import {
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  LogOut,
  RefreshCw,
  Search,
  TicketCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  assignAppointment,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentStatus,
} from '@/features/appointments/appointment-api'
import { AppointmentDetailsDialog } from '@/features/appointments/components/AppointmentDetailsDialog'
import { getApiErrorMessage, logoutUser } from '@/features/auth/auth-api'
import {
  assignTicket,
  updateTicketStatus,
  type Ticket,
  type TicketStatus,
} from '@/features/tickets/ticket-api'
import { TicketDetailsDialog } from '@/features/tickets/components/TicketDetailsDialog'
import { echo } from '@/lib/echo'
import { getStoredUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'
import {
  getStaffOverview,
  type StaffDashboardTotals,
  type StaffQueueView,
} from '@/features/staff/staff-dashboard-api'

type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

type TicketQueue = 'unassigned' | 'mine' | 'resolved_today' | 'all'
type AppointmentQueue = 'pending' | 'scheduled' | 'completed_today' | 'all'


const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
}

const emptyTotals: StaffDashboardTotals = {
  myActiveTickets: 0,
  unassignedTickets: 0,
  pendingAppointments: 0,
  resolvedToday: 0,
}

const queueViews: Array<{
  value: StaffQueueView
  label: string
  description: string
  ticketQueue: TicketQueue
  appointmentQueue: AppointmentQueue
  ticketTitle: string
  appointmentTitle: string
  ticketEmpty: string
  appointmentEmpty: string
  accent: string
}> = [
  {
    value: 'unassigned',
    label: 'Queue',
    description: 'New requests waiting for staff action.',
    ticketQueue: 'unassigned',
    appointmentQueue: 'pending',
    ticketTitle: 'Unassigned tickets',
    appointmentTitle: 'Pending appointments',
    ticketEmpty: 'No unassigned tickets right now.',
    appointmentEmpty: 'No pending appointments right now.',
    accent: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  {
    value: 'mine',
    label: 'My work',
    description: 'Requests currently assigned to you.',
    ticketQueue: 'mine',
    appointmentQueue: 'scheduled',
    ticketTitle: 'My active tickets',
    appointmentTitle: 'Scheduled appointments',
    ticketEmpty: 'No active tickets assigned to you.',
    appointmentEmpty: 'No scheduled appointments right now.',
    accent: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  {
    value: 'resolved_today',
    label: 'Resolved today',
    description: 'Completed work for today.',
    ticketQueue: 'resolved_today',
    appointmentQueue: 'completed_today',
    ticketTitle: 'Resolved tickets today',
    appointmentTitle: 'Completed appointments today',
    ticketEmpty: 'No resolved tickets today.',
    appointmentEmpty: 'No completed appointments today.',
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  {
    value: 'all',
    label: 'All records',
    description: 'Full request history for searching and review.',
    ticketQueue: 'all',
    appointmentQueue: 'all',
    ticketTitle: 'All tickets',
    appointmentTitle: 'All appointments',
    ticketEmpty: 'No tickets found.',
    appointmentEmpty: 'No appointments found.',
    accent: 'border-slate-200 bg-slate-50 text-slate-700',
  },
]

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

  const [activeView, setActiveView] = useState<StaffQueueView>('unassigned')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [ticketMeta, setTicketMeta] = useState<PaginationMeta>(emptyMeta)
  const [appointmentMeta, setAppointmentMeta] = useState<PaginationMeta>(emptyMeta)
  const [dashboardTotals, setDashboardTotals] = useState<StaffDashboardTotals>(emptyTotals)
  const [ticketPage, setTicketPage] = useState(1)
  const [appointmentPage, setAppointmentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatingKey, setUpdatingKey] = useState<string | null>(null)
  const [error, setError] = useState('')

  const activeQueue = useMemo(
    () => queueViews.find((view) => view.value === activeView) ?? queueViews[0],
    [activeView]
  )

  const loadStaffData = useCallback(
  async ({ silent = false }: { silent?: boolean } = {}) => {
    if (silent) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const response = await getStaffOverview({
        view: activeView,
        ticket_page: ticketPage,
        appointment_page: appointmentPage,
        per_page: 10,
        search: debouncedSearch || undefined,
      })

      setTickets(response.data.tickets.data)
      setTicketMeta(response.data.tickets.meta)
      setAppointments(response.data.appointments.data)
      setAppointmentMeta(response.data.appointments.meta)
      setDashboardTotals(response.data.totals)
      setError('')
      setHasLoadedOnce(true)
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to load staff dashboard data.'))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  },
  [activeView, appointmentPage, debouncedSearch, ticketPage]
)
  const loadStaffDataRef = useRef(loadStaffData)

useEffect(() => {
  loadStaffDataRef.current = loadStaffData
}, [loadStaffData])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTicketPage(1)
      setAppointmentPage(1)
      setDebouncedSearch(search.trim())
    }, 350)

    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    void loadStaffData()
  }, [loadStaffData])

  useEffect(() => {
  const channel = echo.channel('officeflow.staff')

  channel.listen('.ticket.changed', () => {
    void loadStaffDataRef.current({ silent: true })
  })

  channel.listen('.appointment.changed', () => {
    void loadStaffDataRef.current({ silent: true })
  })

  const fallbackInterval = window.setInterval(() => {
    void loadStaffDataRef.current({ silent: true })
  }, 60000)

  return () => {
    channel.stopListening('.ticket.changed')
    channel.stopListening('.appointment.changed')
    echo.leaveChannel('officeflow.staff')
    window.clearInterval(fallbackInterval)
  }
}, [])

  const staffStats = [
    {
      label: 'My active tickets',
      value: String(dashboardTotals.myActiveTickets),
      icon: TicketCheck,
      card: 'border-sky-200 bg-sky-50',
      iconBox: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Unassigned tickets',
      value: String(dashboardTotals.unassignedTickets),
      icon: Users,
      card: 'border-violet-200 bg-violet-50',
      iconBox: 'bg-violet-100 text-violet-700',
    },
    {
      label: 'Pending appointments',
      value: String(dashboardTotals.pendingAppointments),
      icon: CalendarCheck,
      card: 'border-amber-200 bg-amber-50',
      iconBox: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Resolved today',
      value: String(dashboardTotals.resolvedToday),
      icon: CheckCircle2,
      card: 'border-emerald-200 bg-emerald-50',
      iconBox: 'bg-emerald-100 text-emerald-700',
    },
  ]

  async function handleTicketStatusChange(ticketId: number, status: TicketStatus) {
    setUpdatingKey(`ticket-${ticketId}`)
    setError('')

    try {
      const response = await updateTicketStatus(ticketId, status)

      setTickets((current) =>
        current.map((ticket) => (ticket.id === ticketId ? response.data : ticket))
      )

      await loadStaffData({ silent: true })
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to update ticket status.'))
    } finally {
      setUpdatingKey(null)
    }
  }

  
 async function handleClaimTicket(ticketId: number) {
  if (!user?.id) return

  const previousTickets = tickets
  const previousTicketMeta = ticketMeta
  const previousTotals = dashboardTotals
  const claimedTicket = tickets.find((ticket) => ticket.id === ticketId)

  setUpdatingKey(`ticket-${ticketId}`)
  setError('')

  if (activeView === 'unassigned') {
    setTickets((current) => current.filter((ticket) => ticket.id !== ticketId))
    setTicketMeta((current) => ({
      ...current,
      total: Math.max(current.total - 1, 0),
    }))
  }

  if (claimedTicket?.assigned_to_id === null) {
    setDashboardTotals((current) => ({
      ...current,
      unassignedTickets: Math.max(current.unassignedTickets - 1, 0),
      myActiveTickets: current.myActiveTickets + 1,
    }))
  }

  try {
    const response = await assignTicket(ticketId, user.id)

    if (activeView !== 'unassigned') {
      setTickets((current) =>
        current.map((ticket) => (ticket.id === ticketId ? response.data : ticket))
      )
    }

    await loadStaffData({ silent: true })
  } catch (error) {
    setTickets(previousTickets)
    setTicketMeta(previousTicketMeta)
    setDashboardTotals(previousTotals)
    setError(getApiErrorMessage(error, 'Unable to claim ticket.'))
  } finally {
    setUpdatingKey(null)
  }
}

async function handleClaimAppointment(appointmentId: number) {
  const previousAppointments = appointments
  const previousAppointmentMeta = appointmentMeta
  const previousTotals = dashboardTotals
  const claimedAppointment = appointments.find((appointment) => appointment.id === appointmentId)

  setUpdatingKey(`appointment-${appointmentId}`)
  setError('')

  if (activeView === 'unassigned') {
    setAppointments((current) =>
      current.filter((appointment) => appointment.id !== appointmentId)
    )
    setAppointmentMeta((current) => ({
      ...current,
      total: Math.max(current.total - 1, 0),
    }))
  }

  if (claimedAppointment?.status === 'pending') {
    setDashboardTotals((current) => ({
      ...current,
      pendingAppointments: Math.max(current.pendingAppointments - 1, 0),
    }))
  }

  try {
    const response = await assignAppointment(appointmentId)

    if (activeView !== 'unassigned') {
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId ? response.data : appointment
        )
      )
    }

    await loadStaffData({ silent: true })
  } catch (error) {
    setAppointments(previousAppointments)
    setAppointmentMeta(previousAppointmentMeta)
    setDashboardTotals(previousTotals)
    setError(getApiErrorMessage(error, 'Unable to claim appointment.'))
  } finally {
    setUpdatingKey(null)
  }
}

  async function handleAppointmentStatusChange(appointmentId: number, status: AppointmentStatus) {
    setUpdatingKey(`appointment-${appointmentId}`)
    setError('')

    try {
      const response = await updateAppointmentStatus(appointmentId, status)

      setAppointments((current) =>
        current.map((appointment) => (appointment.id === appointmentId ? response.data : appointment))
      )

      await loadStaffData({ silent: true })
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to update appointment status.'))
    } finally {
      setUpdatingKey(null)
    }
  }

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearch(event.target.value)
  }

  function handleQueueChange(view: StaffQueueView) {
    setActiveView(view)
    setTicketPage(1)
    setAppointmentPage(1)
  }

  async function handleLogout() {
    await logoutUser()
    navigate('/', { replace: true })
  }

  const showInitialLoading = isLoading && !hasLoadedOnce

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f6f8fb_48%,#f7fbf5_100%)] text-slate-950">
      <header className="border-b bg-white/90 backdrop-blur">
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
            <Badge variant="secondary" className={cn('mb-3 border', activeQueue.accent)}>
              Staff operations
            </Badge>
            <h1 className="text-2xl font-semibold">Manage service queues</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              New requests, assigned work, and completed items update in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs text-muted-foreground shadow-sm">
            <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
            Live sync
          </div>
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

        <div className="mt-6 rounded-lg border bg-white p-4 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[1fr_420px] xl:items-center">
            <div className="grid gap-2 sm:grid-cols-4">
              {queueViews.map((view) => (
                <button
                  key={view.value}
                  type="button"
                  onClick={() => handleQueueChange(view.value)}
                  className={cn(
                    'cursor-pointer rounded-lg border px-3 py-3 text-left transition-colors hover:bg-slate-50',
                    activeView === view.value
                      ? view.accent
                      : 'border-slate-200 bg-white text-slate-600'
                  )}
                >
                  <p className="text-sm font-medium">{view.label}</p>
                  <p className="mt-1 line-clamp-2 text-xs opacity-80">{view.description}</p>
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={handleSearchChange}
                placeholder="Search requester, number, department, or subject..."
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="overflow-hidden rounded-lg border border-sky-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b bg-sky-50/70 px-5 py-4">
              <div>
                <h2 className="font-semibold">{activeQueue.ticketTitle}</h2>
                <p className="text-sm text-muted-foreground">
                  {ticketMeta.total} ticket{ticketMeta.total === 1 ? '' : 's'}
                </p>
              </div>
              <FileText className="size-5 text-sky-700" />
            </div>

            {showInitialLoading ? (
              <div className="px-5 py-8 text-sm text-muted-foreground">Loading tickets...</div>
            ) : tickets.length ? (
              tickets.map((ticket) => (
                <article
                  key={ticket.id}
                  className="grid gap-4 border-b px-5 py-4 transition-colors last:border-b-0 hover:bg-slate-50 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
                >
                  <div className="flex min-w-0 gap-3">
                    <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                      <FileText className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{ticket.subject}</p>
                        <Badge variant="secondary" className={cn('border-0 capitalize', statusStyles[ticket.status])}>
                          {formatStatus(ticket.status)}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {ticket.priority}
                        </Badge>
                        {!ticket.assigned_to_id ? (
                          <Badge variant="secondary" className="border-0 bg-violet-100 text-violet-700">
                            Unassigned
                          </Badge>
                        ) : null}
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {ticket.ticket_number} - {ticket.department} - {ticket.category}
                      </p>

                      <p className="mt-2 text-xs text-muted-foreground">
                        Requester:{' '}
                        <span className="font-medium text-foreground">
                          {ticket.requester?.name ?? 'Unknown'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                    {activeView === 'unassigned' && ticket.assigned_to_id === null ? (
                        <Button
                        type="button"
                        size="sm"
                        className="h-9 cursor-pointer gap-2"
                        disabled={updatingKey === `ticket-${ticket.id}`}
                        onClick={() => void handleClaimTicket(ticket.id)}
                        >
                        <UserCheck className="size-4" />
                        Claim ticket
                        </Button>
                    ) : null}

                    <div className="flex justify-start lg:justify-end">
                      <TicketDetailsDialog
                        ticket={ticket}
                        mode={activeView === 'mine' ? 'work' : activeView === 'unassigned' ? 'queue' : 'readonly'}
                        isUpdating={updatingKey === `ticket-${ticket.id}`}
                        onStatusChange={activeView === 'mine' ? handleTicketStatusChange : undefined}
                        footerAction={
                          activeView === 'unassigned' && ticket.assigned_to_id === null ? (
                            <Button
                              type="button"
                              className="w-full cursor-pointer gap-2"
                              disabled={updatingKey === `ticket-${ticket.id}`}
                              onClick={() => void handleClaimTicket(ticket.id)}
                            >
                              <UserCheck className="size-4" />
                              Claim ticket
                            </Button>
                          ) : undefined
                        }
                      />
                    </div>
                    </div>
                </article>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-muted-foreground">{activeQueue.ticketEmpty}</div>
            )}

            <PaginationFooter
              meta={ticketMeta}
              onPrevious={() => setTicketPage((page) => Math.max(page - 1, 1))}
              onNext={() => setTicketPage((page) => Math.min(page + 1, ticketMeta.last_page))}
            />
          </section>

          <section className="overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b bg-emerald-50/70 px-5 py-4">
              <div>
                <h2 className="font-semibold">{activeQueue.appointmentTitle}</h2>
                <p className="text-sm text-muted-foreground">
                  {appointmentMeta.total} appointment{appointmentMeta.total === 1 ? '' : 's'}
                </p>
              </div>
              <Clock3 className="size-5 text-emerald-700" />
            </div>

            {showInitialLoading ? (
              <div className="px-5 py-8 text-sm text-muted-foreground">Loading appointments...</div>
            ) : appointments.length ? (
              appointments.map((appointment) => (
                <article
                  key={appointment.id}
                  className="grid gap-4 border-b px-5 py-4 transition-colors last:border-b-0 hover:bg-slate-50 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
                >
                  <div className="flex min-w-0 gap-3">
                    <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <CalendarCheck className="size-4" />
                    </div>

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

                      <p className="mt-2 text-xs text-muted-foreground">
                        Requester:{' '}
                        <span className="font-medium text-foreground">
                          {appointment.requester?.name ?? 'Unknown'}
                        </span>
                      </p>
                    </div>
                  </div>

                <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                  {activeView === 'unassigned' &&
                  appointment.assigned_to_id === null &&
                  appointment.status === 'pending' ? (
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 cursor-pointer gap-2"
                      disabled={updatingKey === `appointment-${appointment.id}`}
                      onClick={() => void handleClaimAppointment(appointment.id)}
                    >
                      <UserCheck className="size-4" />
                      Claim appointment
                    </Button>
                  ) : null}

                  <AppointmentDetailsDialog
                    appointment={appointment}
                    isUpdating={updatingKey === `appointment-${appointment.id}`}
                    onStatusChange={handleAppointmentStatusChange}
                  />
</div>
                </article>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-muted-foreground">
                {activeQueue.appointmentEmpty}
              </div>
            )}

            <PaginationFooter
              meta={appointmentMeta}
              onPrevious={() => setAppointmentPage((page) => Math.max(page - 1, 1))}
              onNext={() => setAppointmentPage((page) => Math.min(page + 1, appointmentMeta.last_page))}
            />
          </section>
        </div>
      </section>
    </main>
  )
}

function PaginationFooter({
  meta,
  onPrevious,
  onNext,
}: {
  meta: PaginationMeta
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between border-t bg-slate-50/70 px-5 py-4">
      <p className="text-sm text-muted-foreground">
        Page {meta.current_page} of {meta.last_page}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer bg-white"
          disabled={meta.current_page <= 1}
          onClick={onPrevious}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer bg-white"
          disabled={meta.current_page >= meta.last_page}
          onClick={onNext}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}