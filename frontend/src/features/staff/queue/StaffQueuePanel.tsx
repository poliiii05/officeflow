import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  FileText,
  Inbox,
  RefreshCw,
  Search,
  UserCheck,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  assignAppointment,
  type Appointment,
  type AppointmentStatus,
} from '@/features/appointments/appointment-api'
import { AppointmentDetailsDialog } from '@/features/appointments/components/AppointmentDetailsDialog'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import { getStaffOverview } from '@/features/staff/staff-dashboard-api'
import {
  getCurrentStaffShift,
  type StaffShiftState,
} from '@/features/staff/staff-shift-api'
import { assignTicket, type Ticket, type TicketStatus } from '@/features/tickets/ticket-api'
import { TicketDetailsDialog } from '@/features/tickets/components/TicketDetailsDialog'
import { getStoredUser } from '@/lib/auth-storage'
import { echo } from '@/lib/echo'
import { cn } from '@/lib/utils'

type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

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

export function StaffQueuePanel() {
  const user = getStoredUser()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [ticketMeta, setTicketMeta] = useState<PaginationMeta>(emptyMeta)
  const [appointmentMeta, setAppointmentMeta] = useState<PaginationMeta>(emptyMeta)
  const [ticketPage, setTicketPage] = useState(1)
  const [appointmentPage, setAppointmentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [shiftState, setShiftState] = useState<StaffShiftState>({
  is_on_duty: false,
  can_start_shift: true,
  has_shift_today: false,
  shift: null,
  today_shift: null,
})
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatingKey, setUpdatingKey] = useState<string | null>(null)
  const [error, setError] = useState('')

  const queueItems = useMemo(
    () => createQueueItems(tickets, appointments),
    [appointments, tickets]
  )

  const queueTotal = ticketMeta.total + appointmentMeta.total

  const loadQueue = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (silent) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const response = await getStaffOverview({
          view: 'unassigned',
          ticket_page: ticketPage,
          appointment_page: appointmentPage,
          per_page: 10,
          search: debouncedSearch || undefined,
        })

        setTickets(response.data.tickets.data)
        setTicketMeta(response.data.tickets.meta)
        setAppointments(response.data.appointments.data)
        setAppointmentMeta(response.data.appointments.meta)
        setError('')
        setHasLoadedOnce(true)
      } catch (error) {
        setError(getApiErrorMessage(error, 'Unable to load staff queue.'))
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [appointmentPage, debouncedSearch, ticketPage]
  )

  const loadQueueRef = useRef(loadQueue)

  useEffect(() => {
    loadQueueRef.current = loadQueue
  }, [loadQueue])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTicketPage(1)
      setAppointmentPage(1)
      setDebouncedSearch(search.trim())
    }, 250)

    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    async function loadShift() {
      try {
        const response = await getCurrentStaffShift()
        setShiftState(response.data)
      } catch (error) {
        setError(getApiErrorMessage(error, 'Unable to load staff shift.'))
      }
    }

    void loadShift()
  }, [])

  useEffect(() => {
    void loadQueue()
  }, [loadQueue])

  useEffect(() => {
    const channel = echo.channel('officeflow.staff')

    channel.listen('.ticket.changed', () => {
      void loadQueueRef.current({ silent: true })
    })

    channel.listen('.appointment.changed', () => {
      void loadQueueRef.current({ silent: true })
    })

    return () => {
      channel.stopListening('.ticket.changed')
      channel.stopListening('.appointment.changed')
      echo.leaveChannel('officeflow.staff')
    }
  }, [])

  async function handleClaimTicket(ticketId: number) {
    if (!user?.id || !shiftState.is_on_duty) return

    setUpdatingKey(`ticket-${ticketId}`)
    setError('')

    try {
      await assignTicket(ticketId, user.id)
      await loadQueue({ silent: true })
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to claim ticket.'))
    } finally {
      setUpdatingKey(null)
    }
  }

  async function handleClaimAppointment(appointmentId: number) {
    if (!shiftState.is_on_duty) return

    setUpdatingKey(`appointment-${appointmentId}`)
    setError('')

    try {
      await assignAppointment(appointmentId)
      await loadQueue({ silent: true })
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to claim appointment.'))
    } finally {
      setUpdatingKey(null)
    }
  }

  const showInitialLoading = isLoading && !hasLoadedOnce

  return (
    <section className="mx-auto max-w-7xl space-y-5">
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-violet-950">Waiting queue</p>
              <p className="mt-7 text-4xl font-semibold">{queueTotal}</p>
              <p className="mt-2 text-sm text-violet-700">
                {ticketMeta.total} ticket{ticketMeta.total === 1 ? '' : 's'}, {appointmentMeta.total}{' '}
                appointment{appointmentMeta.total === 1 ? '' : 's'} waiting.
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <Inbox className="size-5" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-lg font-semibold">Unclaimed requests</h2>
              <p className="text-sm text-muted-foreground">
                New tickets and appointments visible to all on-duty staff.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search queue..."
                  className="pl-9"
                />
              </div>

              <div className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-muted-foreground">
                <RefreshCw className={cn('size-4', isRefreshing && 'animate-spin')} />
                Live sync
              </div>
            </div>
          </div>

          {!shiftState.is_on_duty ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Start your shift from the dashboard before claiming queue items.
            </div>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="border-b bg-violet-50/70 px-5 py-4">
          <h2 className="font-semibold text-violet-950">Waiting for staff</h2>
          <p className="text-sm text-violet-700">
            Combined queue of unassigned tickets and pending appointments.
          </p>
        </div>

        {showInitialLoading ? (
          <div className="px-5 py-10 text-sm text-muted-foreground">Loading queue...</div>
        ) : queueItems.length ? (
          <div className="divide-y">
            {queueItems.map((item) => (
              <QueueRequestRow
                key={`${item.kind}-${item.id}`}
                item={item}
                isOnDuty={shiftState.is_on_duty}
                updatingKey={updatingKey}
                onClaimTicket={handleClaimTicket}
                onClaimAppointment={handleClaimAppointment}
              />
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-sm text-muted-foreground">
            Queue is clear right now.
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50/70 px-5 py-4">
          <p className="text-sm text-muted-foreground">
            Tickets page {ticketMeta.current_page} of {ticketMeta.last_page}. Appointments page{' '}
            {appointmentMeta.current_page} of {appointmentMeta.last_page}.
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer bg-white"
              disabled={ticketPage <= 1 && appointmentPage <= 1}
              onClick={() => {
                setTicketPage((page) => Math.max(page - 1, 1))
                setAppointmentPage((page) => Math.max(page - 1, 1))
              }}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer bg-white"
              disabled={
                ticketPage >= ticketMeta.last_page &&
                appointmentPage >= appointmentMeta.last_page
              }
              onClick={() => {
                setTicketPage((page) => Math.min(page + 1, ticketMeta.last_page))
                setAppointmentPage((page) =>
                  Math.min(page + 1, appointmentMeta.last_page)
                )
              }}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
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
  const isUpdating = updatingKey === `${item.kind}-${item.id}`

  return (
    <article className="grid gap-4 px-5 py-4 transition-colors hover:bg-slate-50 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="flex min-w-0 gap-3">
        <div
          className={cn(
            'mt-1 flex size-10 shrink-0 items-center justify-center rounded-lg',
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
              {isTicket ? 'Ticket' : 'Appointment'}
            </Badge>
            <Badge
              variant="secondary"
              className={cn('border-0 capitalize', statusStyles[item.status])}
            >
              {formatStatus(item.status)}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {item.number} - {item.department}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Requester:{' '}
            <span className="font-medium text-foreground">{item.requester}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
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
    </article>
  )
}