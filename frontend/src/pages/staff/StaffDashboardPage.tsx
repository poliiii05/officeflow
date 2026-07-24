import {
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ClipboardList,
  Database,
  FileText,
  Inbox,
  ListChecks,
  LogOut,
  Power,
  RefreshCw,
  Search,
  UserCheck,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  assignAppointment,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentStatus,
} from '@/features/appointments/appointment-api'
import { AppointmentDetailsDialog } from '@/features/appointments/components/AppointmentDetailsDialog'
import { getApiErrorMessage, logoutUser } from '@/features/auth/auth-api'
import {
  getStaffOverview,
  type StaffDashboardTotals,
  type StaffQueueView,
} from '@/features/staff/staff-dashboard-api'
import {
  endStaffShift,
  getCurrentStaffShift,
  startStaffShift,
  type StaffShiftState,
} from '@/features/staff/staff-shift-api'
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

type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

type WorkView = Extract<StaffQueueView, 'mine' | 'resolved_today' | 'all'>

type QueueItem =
  | {
      kind: 'ticket'
      id: number
      title: string
      number: string
      requester: string
      department: string
      status: TicketStatus
      createdAt: string
      data: Ticket
    }
  | {
      kind: 'appointment'
      id: number
      title: string
      number: string
      requester: string
      department: string
      status: AppointmentStatus
      createdAt: string
      data: Appointment
    }

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
}

const emptyTotals: StaffDashboardTotals = {
  queueTotal: 0,
  myWorkTotal: 0,
  resolvedToday: 0,
  allRecords: 0,
  myActiveTickets: 0,
  myActiveAppointments: 0,
  unassignedTickets: 0,
  pendingAppointments: 0,
}

const workViews: Array<{
  value: WorkView
  label: string
  description: string
  ticketTitle: string
  appointmentTitle: string
  ticketEmpty: string
  appointmentEmpty: string
  accent: string
}> = [
  {
    value: 'mine',
    label: 'My work',
    description: 'Requests currently assigned to you.',
    ticketTitle: 'My active tickets',
    appointmentTitle: 'Scheduled appointments',
    ticketEmpty: 'No active tickets assigned to you.',
    appointmentEmpty: 'No scheduled appointments assigned to you.',
    accent: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  {
    value: 'resolved_today',
    label: 'Resolved today',
    description: 'Completed work for today.',
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

function formatShiftStartedAt(value?: string | null) {
  if (!value) return 'No active shift'

  return `Started ${new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

function createQueueItems(tickets: Ticket[], appointments: Appointment[]): QueueItem[] {
  return [
    ...tickets.map((ticket): QueueItem => ({
      kind: 'ticket',
      id: ticket.id,
      title: ticket.subject,
      number: ticket.ticket_number,
      requester: ticket.requester?.name ?? 'Unknown requester',
      department: ticket.department,
      status: ticket.status,
      createdAt: ticket.created_at,
      data: ticket,
    })),
    ...appointments.map((appointment): QueueItem => ({
      kind: 'appointment',
      id: appointment.id,
      title: appointment.purpose,
      number: appointment.appointment_number,
      requester: appointment.requester?.name ?? 'Unknown requester',
      department: appointment.department,
      status: appointment.status,
      createdAt: appointment.created_at,
      data: appointment,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function StaffDashboardPage() {
  const navigate = useNavigate()
  const user = getStoredUser()

  const [activeView, setActiveView] = useState<WorkView>('mine')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [queueTickets, setQueueTickets] = useState<Ticket[]>([])
  const [queueAppointments, setQueueAppointments] = useState<Appointment[]>([])
  const [ticketMeta, setTicketMeta] = useState<PaginationMeta>(emptyMeta)
  const [appointmentMeta, setAppointmentMeta] = useState<PaginationMeta>(emptyMeta)
  const [queueTicketMeta, setQueueTicketMeta] = useState<PaginationMeta>(emptyMeta)
  const [queueAppointmentMeta, setQueueAppointmentMeta] = useState<PaginationMeta>(emptyMeta)
  const [dashboardTotals, setDashboardTotals] = useState<StaffDashboardTotals>(emptyTotals)
  const [ticketPage, setTicketPage] = useState(1)
  const [appointmentPage, setAppointmentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
const [shiftState, setShiftState] = useState<StaffShiftState>({
  is_on_duty: false,
  shift: null,
})
const [isShiftLoading, setIsShiftLoading] = useState(true)
const [isShiftUpdating, setIsShiftUpdating] = useState(false)
const [isEndShiftDialogOpen, setIsEndShiftDialogOpen] = useState(false)
const [updatingKey, setUpdatingKey] = useState<string | null>(null)
const [error, setError] = useState('')

    const activeWorkView = useMemo(
    () => workViews.find((view) => view.value === activeView) ?? workViews[0],
    [activeView]
  )

  const queueItems = useMemo(
    () => createQueueItems(queueTickets, queueAppointments),
    [queueAppointments, queueTickets]
  )

  const loadStaffData = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (silent) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const [activeResponse, queueResponse] = await Promise.all([
          getStaffOverview({
            view: activeView,
            ticket_page: ticketPage,
            appointment_page: appointmentPage,
            per_page: 10,
            search: debouncedSearch || undefined,
          }),
          getStaffOverview({
            view: 'unassigned',
            ticket_page: 1,
            appointment_page: 1,
            per_page: 10,
          }),
        ])

        setTickets(activeResponse.data.tickets.data)
        setTicketMeta(activeResponse.data.tickets.meta)
        setAppointments(activeResponse.data.appointments.data)
        setAppointmentMeta(activeResponse.data.appointments.meta)
        setDashboardTotals(activeResponse.data.totals)

        setQueueTickets(queueResponse.data.tickets.data)
        setQueueTicketMeta(queueResponse.data.tickets.meta)
        setQueueAppointments(queueResponse.data.appointments.data)
        setQueueAppointmentMeta(queueResponse.data.appointments.meta)

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
  async function loadCurrentShift() {
    try {
      const response = await getCurrentStaffShift()
      setShiftState(response.data)
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to load staff shift.'))
    } finally {
      setIsShiftLoading(false)
    }
  }

  void loadCurrentShift()
}, [])


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
    const previousQueueTickets = queueTickets
    const previousTicketMeta = ticketMeta
    const previousQueueTicketMeta = queueTicketMeta
    const previousTotals = dashboardTotals
    const claimedTicket = queueTickets.find((ticket) => ticket.id === ticketId)

    setUpdatingKey(`ticket-${ticketId}`)
    setError('')
    setQueueTickets((current) => current.filter((ticket) => ticket.id !== ticketId))
    setQueueTicketMeta((current) => ({ ...current, total: Math.max(current.total - 1, 0) }))
    setDashboardTotals((current) => ({
      ...current,
      queueTotal: Math.max(current.queueTotal - 1, 0),
      unassignedTickets: Math.max(current.unassignedTickets - 1, 0),
      myWorkTotal: current.myWorkTotal + 1,
      myActiveTickets: current.myActiveTickets + 1,
    }))

    try {
      const response = await assignTicket(ticketId, user.id)

      if (activeView === 'mine') {
        setTickets((current) => [
          response.data,
          ...current.filter((ticket) => ticket.id !== response.data.id),
        ])
        setTicketMeta((current) => ({ ...current, total: current.total + 1 }))
      }

      await loadStaffData({ silent: true })
    } catch (error) {
      setTickets(previousTickets)
      setQueueTickets(previousQueueTickets)
      setTicketMeta(previousTicketMeta)
      setQueueTicketMeta(previousQueueTicketMeta)
      setDashboardTotals(previousTotals)
      setError(
        getApiErrorMessage(
          error,
          claimedTicket
            ? `Unable to claim ${claimedTicket.ticket_number}.`
            : 'Unable to claim ticket.'
        )
      )
    } finally {
      setUpdatingKey(null)
    }
  }

  async function handleClaimAppointment(appointmentId: number) {
    const previousAppointments = appointments
    const previousQueueAppointments = queueAppointments
    const previousAppointmentMeta = appointmentMeta
    const previousQueueAppointmentMeta = queueAppointmentMeta
    const previousTotals = dashboardTotals
    const claimedAppointment = queueAppointments.find(
      (appointment) => appointment.id === appointmentId
    )

    setUpdatingKey(`appointment-${appointmentId}`)
    setError('')
    setQueueAppointments((current) =>
      current.filter((appointment) => appointment.id !== appointmentId)
    )
    setQueueAppointmentMeta((current) => ({
      ...current,
      total: Math.max(current.total - 1, 0),
    }))
    setDashboardTotals((current) => ({
      ...current,
      queueTotal: Math.max(current.queueTotal - 1, 0),
      pendingAppointments: Math.max(current.pendingAppointments - 1, 0),
      myWorkTotal: current.myWorkTotal + 1,
      myActiveAppointments: current.myActiveAppointments + 1,
    }))

    try {
      const response = await assignAppointment(appointmentId)

      if (activeView === 'mine') {
        setAppointments((current) => [
          response.data,
          ...current.filter((appointment) => appointment.id !== response.data.id),
        ])
        setAppointmentMeta((current) => ({ ...current, total: current.total + 1 }))
      }

      await loadStaffData({ silent: true })
    } catch (error) {
      setAppointments(previousAppointments)
      setQueueAppointments(previousQueueAppointments)
      setAppointmentMeta(previousAppointmentMeta)
      setQueueAppointmentMeta(previousQueueAppointmentMeta)
      setDashboardTotals(previousTotals)
      setError(
        getApiErrorMessage(
          error,
          claimedAppointment
            ? `Unable to claim ${claimedAppointment.appointment_number}.`
            : 'Unable to claim appointment.'
        )
      )
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
      const response = await updateAppointmentStatus(appointmentId, status)

      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId ? response.data : appointment
        )
      )

      await loadStaffData({ silent: true })
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to update appointment status.'))
    } finally {
      setUpdatingKey(null)
    }
  }

  async function handleStartShift() {
    setIsShiftUpdating(true)
    setError('')

    try {
      const response = await startStaffShift()
      setShiftState(response.data)
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to start shift.'))
    } finally {
      setIsShiftUpdating(false)
    }
  }

  async function handleEndShift() {
    setIsShiftUpdating(true)
    setError('')

    try {
      const response = await endStaffShift()
      setShiftState(response.data)
      setIsEndShiftDialogOpen(false)
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to end shift.'))
    } finally {
      setIsShiftUpdating(false)
    }
  }

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearch(event.target.value)
  }

  function handleWorkViewChange(view: WorkView) {
    setActiveView(view)
    setTicketPage(1)
    setAppointmentPage(1)
  }

  async function handleLogout() {
    await logoutUser()
    navigate('/', { replace: true })
  }

  const showInitialLoading = isLoading && !hasLoadedOnce
  const queuePreviewItems = queueItems.slice(0, 4)
  const shiftTimeLabel = shiftState.is_on_duty
  const hasActiveWork = dashboardTotals.myWorkTotal > 0
    ? formatShiftStartedAt(shiftState.shift?.started_at)
  : 'Start shift to claim queue items'

  const summaryCards = [
    {
      label: 'Queuing',
      value: String(dashboardTotals.queueTotal),
      description: `${dashboardTotals.unassignedTickets} ticket, ${dashboardTotals.pendingAppointments} appointments waiting for staff.`,
      icon: Inbox,
      card: 'border-violet-200 bg-violet-50',
      iconBox: 'bg-violet-100 text-violet-700',
    },
    {
      label: 'My work',
      value: String(dashboardTotals.myWorkTotal),
      description: `${dashboardTotals.myActiveTickets} tickets, ${dashboardTotals.myActiveAppointments} appointments`,
      icon: ListChecks,
      card: 'border-sky-200 bg-sky-50',
      iconBox: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Resolved today',
      value: String(dashboardTotals.resolvedToday),
      description: 'Completed by staff today',
      icon: CheckCircle2,
      card: 'border-emerald-200 bg-emerald-50',
      iconBox: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'All records',
      value: String(dashboardTotals.allRecords),
      description: 'Tickets and appointments',
      icon: Database,
      card: 'border-slate-200 bg-white',
      iconBox: 'bg-slate-100 text-slate-700',
    },
  ]

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7faff_0%,#f4f7fb_52%,#f7fbf5_100%)] text-slate-950">
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
            <Badge variant="secondary" className="mb-3 border border-sky-200 bg-sky-50 text-sky-700">
              Staff operations
            </Badge>
            <h1 className="text-2xl font-semibold">Manage service queues</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              New requests, assigned work, and completed items update in real time.
            </p>
          </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className={cn(
              'flex min-w-72 items-center justify-between gap-4 rounded-lg border px-4 py-3 shadow-sm',
              shiftState.is_on_duty
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-slate-200 bg-white'
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'relative flex size-3 rounded-full',
                  shiftState.is_on_duty ? 'bg-emerald-500' : 'bg-slate-300'
                )}
              >
                {shiftState.is_on_duty ? (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                ) : null}
              </span>

              <div>
                <p className="text-sm font-semibold">
                  {shiftState.is_on_duty ? 'Clocked in' : 'Not clocked in'}
                </p>
                <p className="text-xs text-muted-foreground">{shiftTimeLabel}</p>
              </div>
            </div>

            {shiftState.is_on_duty ? (
              <Dialog open={isEndShiftDialogOpen} onOpenChange={setIsEndShiftDialogOpen}>
                <DialogTrigger className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border bg-white px-3 text-sm font-medium shadow-xs hover:bg-slate-50">
                  End shift
                </DialogTrigger>

                <DialogContent className="!max-w-xl overflow-hidden rounded-xl p-0">
                  <div className="border-b bg-gradient-to-r from-amber-50 via-white to-slate-50 px-6 py-5">
                    <DialogHeader>
                      <div className="flex items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                          <Clock3 className="size-5" />
                        </div>

                        <div>
                          <DialogTitle>End your shift?</DialogTitle>
                          <DialogDescription className="mt-1">
                            This will clock you out and record your work session end time.
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>
                  </div>

                  <div className="space-y-4 px-6 py-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border bg-slate-50 p-4">
                        <p className="text-sm text-muted-foreground">Current status</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          <p className="font-medium text-emerald-700">Clocked in</p>
                        </div>
                      </div>

                      <div className="rounded-lg border bg-slate-50 p-4">
                        <p className="text-sm text-muted-foreground">Shift started</p>
                        <p className="mt-2 font-medium">
                          {shiftState.shift?.started_at
                            ? new Date(shiftState.shift.started_at).toLocaleString()
                            : 'Not available'}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border bg-sky-50 p-4">
                        <p className="text-sm text-muted-foreground">Active tickets</p>
                        <p className="mt-2 text-2xl font-semibold">{dashboardTotals.myActiveTickets}</p>
                      </div>

                      <div className="rounded-lg border bg-emerald-50 p-4">
                        <p className="text-sm text-muted-foreground">Appointments</p>
                        <p className="mt-2 text-2xl font-semibold">{dashboardTotals.myActiveAppointments}</p>
                      </div>

                      <div className="rounded-lg border bg-violet-50 p-4">
                        <p className="text-sm text-muted-foreground">Total active</p>
                        <p className="mt-2 text-2xl font-semibold">{dashboardTotals.myWorkTotal}</p>
                      </div>
                    </div>

                    {hasActiveWork ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <p className="font-medium">Active assigned work remains</p>
                        <p className="mt-1 leading-6">
                          You still have {dashboardTotals.myWorkTotal} active assigned request
                          {dashboardTotals.myWorkTotal === 1 ? '' : 's'}. They will stay assigned to you after clock out.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        No active assigned work. You can safely end this shift.
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 border-t bg-slate-50 px-6 py-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer bg-white"
                      onClick={() => setIsEndShiftDialogOpen(false)}
                      disabled={isShiftUpdating}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={handleEndShift}
                      disabled={isShiftUpdating}
                    >
                      End shift
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                type="button"
                className="cursor-pointer gap-2"
                disabled={isShiftLoading || isShiftUpdating}
                onClick={handleStartShift}
              >
                <Power className="size-4" />
                Start shift
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs text-muted-foreground shadow-sm">
            <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
            Live sync
          </div>
        </div>
         </div>

        {error ? (
          <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((stat) => {
            const Icon = stat.icon

            return (
              <div key={stat.label} className={cn('rounded-lg border p-5 shadow-sm', stat.card)}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{stat.label}</p>
                    <p className="mt-7 text-3xl font-semibold">{stat.value}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{stat.description}</p>
                  </div>
                  <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', stat.iconBox)}>
                    <Icon className="size-5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <section className="mt-6 overflow-hidden rounded-lg border border-violet-200 bg-violet-50/70 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-violet-950">Waiting for staff</h2>
              <Badge variant="secondary" className="border-0 bg-violet-100 text-violet-700">
                {dashboardTotals.queueTotal}
              </Badge>
            </div>

            <p className="text-sm text-violet-700">
              showing {Math.min(queuePreviewItems.length, dashboardTotals.queueTotal)} of {dashboardTotals.queueTotal}
            </p>
          </div>

            {activeView === 'mine' && !shiftState.is_on_duty ? (
            <div className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-800">
              Start your shift to update statuses or send staff replies.
            </div>
          ) : null}

          <div className="space-y-3 px-5 pb-5">
            {showInitialLoading ? (
              <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">
                Loading queue...
              </p>
            ) : queuePreviewItems.length ? (
              queuePreviewItems.map((item) => (
                <QueueRequestRow
                  key={`${item.kind}-${item.id}`}
                  item={item}
                  isOnDuty={shiftState.is_on_duty}
                  updatingKey={updatingKey}
                  onClaimTicket={handleClaimTicket}
                  onClaimAppointment={handleClaimAppointment}
                />
              ))
            ) : (
              <p className="rounded-lg border border-dashed bg-white p-4 text-sm text-muted-foreground">
                Queue is clear right now.
              </p>
            )}
          </div>

          <div className="border-t border-violet-100 bg-violet-50 px-5 py-3 text-center">
            <Dialog open={isQueueOpen} onOpenChange={setIsQueueOpen}>
              <DialogTrigger className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-medium text-violet-700 hover:bg-violet-100">
                View all {dashboardTotals.queueTotal} in queue →
              </DialogTrigger>

              <DialogContent className="flex !max-w-4xl max-h-[88vh] flex-col overflow-hidden p-0">
                <div className="border-b bg-violet-50/80 px-6 py-5">
                  <DialogHeader>
                    <DialogTitle>All queued requests</DialogTitle>
                    <DialogDescription>
                      Tickets and appointments waiting for staff action.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
                  {queueItems.length ? (
                    queueItems.map((item) => (
                     <QueueRequestRow
                        key={`${item.kind}-${item.id}`}
                        item={item}
                        isOnDuty={shiftState.is_on_duty}
                        updatingKey={updatingKey}
                        onClaimTicket={handleClaimTicket}
                        onClaimAppointment={handleClaimAppointment}
                      />
                    ))
                  ) : (
                    <p className="rounded-lg border border-dashed bg-slate-50 p-6 text-sm text-muted-foreground">
                      Queue is clear right now.
                    </p>
                  )}
                </div>

                <div className="border-t bg-slate-50/70 px-6 py-4 text-xs text-muted-foreground">
                  Showing {queueTicketMeta.total + queueAppointmentMeta.total} queued records.
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </section>

                <div className="mt-6 rounded-lg border bg-white p-4 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[1fr_420px] xl:items-center">
            <div className="grid gap-2 sm:grid-cols-3">
              {workViews.map((view) => (
                <button
                  key={view.value}
                  type="button"
                  onClick={() => handleWorkViewChange(view.value)}
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
                <h2 className="font-semibold">{activeWorkView.ticketTitle}</h2>
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
                  <TicketSummary ticket={ticket} />

                 <TicketDetailsDialog
                  ticket={ticket}
                  mode={activeView === 'mine' && shiftState.is_on_duty ? 'work' : 'readonly'}
                  isUpdating={updatingKey === `ticket-${ticket.id}`}
                  onStatusChange={
                    activeView === 'mine' && shiftState.is_on_duty ? handleTicketStatusChange : undefined
                  }
                />
                </article>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-muted-foreground">{activeWorkView.ticketEmpty}</div>
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
                <h2 className="font-semibold">{activeWorkView.appointmentTitle}</h2>
                <p className="text-sm text-muted-foreground">
                  {appointmentMeta.total} appointment{appointmentMeta.total === 1 ? '' : 's'}
                </p>
              </div>
              <CalendarCheck className="size-5 text-emerald-700" />
            </div>

            {activeView === 'mine' && !shiftState.is_on_duty ? (
            <div className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-800">
              Start your shift to update statuses or send staff replies.
            </div>
          ) : null}

            {showInitialLoading ? (
              <div className="px-5 py-8 text-sm text-muted-foreground">Loading appointments...</div>
            ) : appointments.length ? (
              appointments.map((appointment) => (
                <article
                  key={appointment.id}
                  className="grid gap-4 border-b px-5 py-4 transition-colors last:border-b-0 hover:bg-slate-50 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
                >
                  <AppointmentSummary appointment={appointment} />

                  <AppointmentDetailsDialog
                  appointment={appointment}
                  mode={activeView === 'mine' && shiftState.is_on_duty ? 'work' : 'readonly'}
                  isUpdating={updatingKey === `appointment-${appointment.id}`}
                  onStatusChange={
                    activeView === 'mine' && shiftState.is_on_duty ? handleAppointmentStatusChange : undefined
                  }
                />
                </article>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-muted-foreground">
                {activeWorkView.appointmentEmpty}
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

function QueueRequestRow({
  item,
  isOnDuty,
  updatingKey,
  onClaimTicket,
  onClaimAppointment,
}: {
  item: QueueItem
  isOnDuty: boolean
  updatingKey: string | null
  onClaimTicket: (ticketId: number) => void
  onClaimAppointment: (appointmentId: number) => void
}) {
  const isTicket = item.kind === 'ticket'
  const updatingId = `${item.kind}-${item.id}`
  const isUpdating = updatingKey === updatingId

  return (
    <div className="grid gap-3 rounded-lg border bg-white p-4 shadow-xs sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="flex min-w-0 gap-3">
        <div
          className={cn(
            'mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg',
            isTicket ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
          )}
        >
          {isTicket ? <FileText className="size-4" /> : <CalendarCheck className="size-4" />}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{item.title}</p>
            <Badge
              variant="secondary"
              className={cn(
                'border-0 capitalize',
                isTicket ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
              )}
            >
              {isTicket ? 'ticket' : 'appointment'}
            </Badge>
            <Badge variant="secondary" className={cn('border-0 capitalize', statusStyles[item.status])}>
              {formatStatus(item.status)}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {item.number} - {item.department} - Requester: {item.requester}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
        <Button
          type="button"
          size="sm"
          className="h-9 cursor-pointer gap-2"
          disabled={isUpdating || !isOnDuty}
          onClick={() => {
            if (isTicket) {
              onClaimTicket(item.data.id)
              return
            }

            onClaimAppointment(item.data.id)
          }}
        >
         <UserCheck className="size-4" />
{isOnDuty ? 'Claim' : 'Start shift first'}
        </Button>

        {isTicket ? (
          <TicketDetailsDialog
            ticket={item.data}
            mode="queue"
            isUpdating={isUpdating}
            footerAction={
              <Button
                type="button"
                className="w-full cursor-pointer gap-2"
                disabled={isUpdating || !isOnDuty}
                onClick={() => onClaimTicket(item.data.id)}
              >
                <UserCheck className="size-4" />
              {isOnDuty ? 'Claim ticket' : 'Start shift first'}
              </Button>
            }
          />
        ) : (
          <AppointmentDetailsDialog
            appointment={item.data}
            mode="queue"
            isUpdating={isUpdating}
            footerAction={
              <Button
                type="button"
                className="w-full cursor-pointer gap-2"
                disabled={isUpdating || !isOnDuty}
                onClick={() => onClaimAppointment(item.data.id)}
              >
                <UserCheck className="size-4" />
                {isOnDuty ? 'Claim appointment' : 'Start shift first'}
              </Button>
            }
          />
        )}
      </div>
    </div>
  )
}

function TicketSummary({ ticket }: { ticket: Ticket }) {
  return (
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

        {['resolved', 'closed'].includes(ticket.status) ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {ticket.status === 'closed' ? 'Closed' : 'Resolved'}{' '}
            {new Date(ticket.updated_at).toLocaleString()}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function AppointmentSummary({ appointment }: { appointment: Appointment }) {
  return (
    <div className="flex min-w-0 gap-3">
      <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
        <CalendarCheck className="size-4" />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{appointment.purpose}</p>
          <Badge variant="secondary" className={cn('border-0 capitalize', statusStyles[appointment.status])}>
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

        {['completed', 'cancelled'].includes(appointment.status) ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {appointment.status === 'cancelled' ? 'Cancelled' : 'Completed'}{' '}
            {new Date(appointment.updated_at).toLocaleString()}
          </p>
        ) : null}
      </div>
    </div>
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