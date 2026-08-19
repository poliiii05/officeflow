import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  FileText,
  Inbox,
  Search,
  UserCheck,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

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
import {
  getStaffQueue,
  type StaffQueueItem,
  type StaffQueueMeta,
  type StaffQueueScope,
} from '@/features/staff/queue/staff-queue-api'
import {
  getCurrentStaffShift,
  type StaffShiftState,
} from '@/features/staff/staff-shift-api'
import {
  assignTicket,
  type Ticket,
  type TicketStatus,
} from '@/features/tickets/ticket-api'
import { TicketDetailsDialog } from '@/features/tickets/components/TicketDetailsDialog'
import { getStoredUser } from '@/lib/auth-storage'
import { echo } from '@/lib/echo'
import { cn } from '@/lib/utils'

const emptyMeta: StaffQueueMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
}

const initialShiftState: StaffShiftState = {
  is_on_duty: false,
  can_start_shift: true,
  has_shift_today: false,
  shift: null,
  today_shift: null,
  today_summary: null,
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

// Scope toggle options, in display order. "overdue" surfaces waiting items
// that have sat in the queue past their expected time - relies on the
// backend /staff/queue endpoint handling scope=overdue.
const scopeOptions: { value: StaffQueueScope; label: string }[] = [
  { value: 'all', label: 'All waiting' },
  { value: 'today', label: 'Today' },
  { value: 'overdue', label: 'Overdue' },
]

function formatStatus(status: string) {
  return status.replace('_', ' ')
}

function getQueueCardCopy(scope: StaffQueueScope) {
  if (scope === 'today') return 'Requests submitted today.'
  if (scope === 'overdue') return 'Waiting longer than expected.'
  return 'Unclaimed tickets and appointments.'
}

function getEmptyStateCopy(scope: StaffQueueScope) {
  if (scope === 'today') return 'No queue requests were submitted today.'
  if (scope === 'overdue') return 'Nothing is overdue right now.'
  return 'Queue is clear right now.'
}

export function StaffQueuePanel() {
  const user = getStoredUser()

  const [items, setItems] = useState<StaffQueueItem[]>([])
  const [meta, setMeta] = useState<StaffQueueMeta>(emptyMeta)
  const [scope, setScope] = useState<StaffQueueScope>('all')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [shiftState, setShiftState] = useState<StaffShiftState>(initialShiftState)
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [updatingKey, setUpdatingKey] = useState<string | null>(null)
  const [error, setError] = useState('')

  const loadQueue = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) setIsLoading(true)

      try {
        const response = await getStaffQueue({
          scope,
          page,
          per_page: 10,
          search: debouncedSearch || undefined,
        })

        setItems(response.data)
        setMeta(response.meta)
        setError('')
        setHasLoadedOnce(true)
      } catch (error) {
        setError(getApiErrorMessage(error, 'Unable to load staff queue.'))
      } finally {
        setIsLoading(false)
      }
    },
    [debouncedSearch, page, scope]
  )

  const loadQueueRef = useRef(loadQueue)

  useEffect(() => {
    loadQueueRef.current = loadQueue
  }, [loadQueue])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
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

  function handleScopeChange(nextScope: StaffQueueScope) {
    setScope(nextScope)
    setPage(1)
  }

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

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <article className="rounded-lg border border-violet-200 bg-violet-50 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-violet-950">Waiting queue</p>
              <p className="mt-7 text-4xl font-semibold text-slate-950">
                {isLoading && !hasLoadedOnce ? '...' : meta.total}
              </p>
              <p className="mt-2 text-sm text-violet-700">{getQueueCardCopy(scope)}</p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <Inbox className="size-5" />
            </div>
          </div>
        </article>

        <article className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <h2 className="text-lg font-semibold">Unclaimed requests</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                New tickets and appointments update automatically while you work.
              </p>
            </div>

            <div className="relative min-w-0 lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search queue..."
                className="pl-9"
              />
            </div>
          </div>

          {!shiftState.is_on_duty ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Start your shift from Shift History before claiming queue items.
            </div>
          ) : null}
        </article>
      </div>

      <article className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b bg-violet-50/70 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-violet-950">Waiting for staff</h2>
            <p className="mt-1 text-sm text-violet-700">
              Review the shared queue before claiming an item.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {scopeOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={scope === option.value ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => handleScopeChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {showInitialLoading ? (
          <div className="px-5 py-10 text-sm text-muted-foreground">Loading queue...</div>
        ) : items.length ? (
          <div className="divide-y">
            {items.map((item) => (
              <QueueRequestRow
                key={`${item.kind}-${item.data.id}`}
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
            {getEmptyStateCopy(scope)}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50/70 px-5 py-4">
          <p className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.last_page} - {meta.total} request
            {meta.total === 1 ? '' : 's'}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer bg-white"
              disabled={page <= 1}
              onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer bg-white"
              disabled={page >= meta.last_page}
              onClick={() => setPage((currentPage) => Math.min(currentPage + 1, meta.last_page))}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </article>
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
  item: StaffQueueItem
  isOnDuty: boolean
  updatingKey: string | null
  onClaimTicket: (ticketId: number) => void
  onClaimAppointment: (appointmentId: number) => void
}) {
  const isTicket = item.kind === 'ticket'
  const request = item.data as Ticket | Appointment
  const isUpdating = updatingKey === `${item.kind}-${request.id}`

  const title = isTicket
    ? (request as Ticket).subject
    : (request as Appointment).purpose

  const number = isTicket
    ? (request as Ticket).ticket_number
    : (request as Appointment).appointment_number

  const status = request.status as TicketStatus | AppointmentStatus

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
            <p className="font-medium">{title}</p>

            <Badge
              variant="secondary"
              className={cn(
                'border-0',
                isTicket ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
              )}
            >
              {isTicket ? 'Ticket' : 'Appointment'}
            </Badge>

            <Badge
              variant="secondary"
              className={cn('border-0 capitalize', statusStyles[status])}
            >
              {formatStatus(status)}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {number} - {request.department}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Requester:{' '}
            <span className="font-medium text-foreground">
              {request.requester?.name ?? 'Unknown requester'}
            </span>
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
              onClaimTicket(request.id)
              return
            }

            onClaimAppointment(request.id)
          }}
        >
          <UserCheck className="size-4" />
          {isOnDuty ? 'Claim' : 'Start shift first'}
        </Button>

        {isTicket ? (
          <TicketDetailsDialog
            ticket={request as Ticket}
            mode="queue"
            footerAction={
              <Button
                type="button"
                className="w-full cursor-pointer gap-2"
                disabled={isUpdating || !isOnDuty}
                onClick={() => onClaimTicket(request.id)}
              >
                <UserCheck className="size-4" />
                {isOnDuty ? 'Claim ticket' : 'Start shift first'}
              </Button>
            }
          />
        ) : (
          <AppointmentDetailsDialog
            appointment={request as Appointment}
            mode="queue"
            footerAction={
              <Button
                type="button"
                className="w-full cursor-pointer gap-2"
                disabled={isUpdating || !isOnDuty}
                onClick={() => onClaimAppointment(request.id)}
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