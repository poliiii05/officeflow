import {
  CalendarCheck,
  ClipboardList,
  Clock3,
  FileClock,
  RefreshCw,
  Search,
  TicketCheck,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  getAppointments,
  type Appointment,
} from '@/features/appointments/appointment-api'
import { AppointmentDetailsDialog } from '@/features/appointments/components/AppointmentDetailsDialog'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import { getTickets, type Ticket } from '@/features/tickets/ticket-api'
import { TicketDetailsDialog } from '@/features/tickets/components/TicketDetailsDialog'
import { echo } from '@/lib/echo'
import { cn } from '@/lib/utils'

type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

type QueueFilter = 'all' | 'ticket' | 'appointment'

type QueueItem =
  | {
      kind: 'ticket'
      id: number
      title: string
      number: string
      department: string
      detail: string
      requester: string
      created_at: string
      status: string
      accentClassName: string
      data: Ticket
    }
  | {
      kind: 'appointment'
      id: number
      title: string
      number: string
      department: string
      detail: string
      requester: string
      created_at: string
      status: string
      accentClassName: string
      data: Appointment
    }

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 50,
  total: 0,
}

const queueFilters: Array<{ value: QueueFilter; label: string }> = [
  { value: 'all', label: 'All queue' },
  { value: 'ticket', label: 'Tickets' },
  { value: 'appointment', label: 'Appointments' },
]

const statusStyles: Record<string, string> = {
  open: 'bg-sky-100 text-sky-700',
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-sky-100 text-sky-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-slate-200 text-slate-700',
}

function formatStatus(status: string) {
  return status.replace('_', ' ')
}

function formatWaitingTime(value: string) {
  const diffMs = Math.max(Date.now() - new Date(value).getTime(), 0)
  const minutes = Math.floor(diffMs / 60000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`

  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

export function QueueMonitorPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [ticketMeta, setTicketMeta] = useState<PaginationMeta>(emptyMeta)
  const [appointmentMeta, setAppointmentMeta] = useState<PaginationMeta>(emptyMeta)
  const [search, setSearch] = useState('')
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadQueue = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (silent) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    setError('')

    try {
      const [ticketResponse, appointmentResponse] = await Promise.all([
        getTickets({ queue: 'unassigned', per_page: 50 }),
        getAppointments({ queue: 'pending', per_page: 50 }),
      ])

      setTickets(ticketResponse.data)
      setTicketMeta(ticketResponse.meta)
      setAppointments(appointmentResponse.data)
      setAppointmentMeta(appointmentResponse.meta)
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to load service queue.'))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadQueue()
  }, [loadQueue])

  useEffect(() => {
    const channel = echo.channel('officeflow.staff')

    const refreshSoon = () => {
      window.setTimeout(() => void loadQueue({ silent: true }), 150)
    }

    channel.listen('.ticket.changed', refreshSoon)
    channel.listen('.appointment.changed', refreshSoon)

    return () => {
      channel.stopListening('.ticket.changed')
      channel.stopListening('.appointment.changed')
      echo.leaveChannel('officeflow.staff')
    }
  }, [loadQueue])

  const queueItems = useMemo<QueueItem[]>(() => {
    const ticketItems: QueueItem[] = tickets.map((ticket) => ({
      kind: 'ticket',
      id: ticket.id,
      title: ticket.subject,
      number: ticket.ticket_number,
      department: ticket.department,
      detail: ticket.category,
      requester: ticket.requester?.name ?? 'Unknown requester',
      created_at: ticket.created_at,
      status: ticket.status,
      accentClassName: 'bg-sky-100 text-sky-700',
      data: ticket,
    }))

    const appointmentItems: QueueItem[] = appointments.map((appointment) => ({
      kind: 'appointment',
      id: appointment.id,
      title: appointment.purpose,
      number: appointment.appointment_number,
      department: appointment.department,
      detail: new Date(appointment.scheduled_at).toLocaleString(),
      requester: appointment.requester?.name ?? 'Unknown requester',
      created_at: appointment.created_at,
      status: appointment.status,
      accentClassName: 'bg-emerald-100 text-emerald-700',
      data: appointment,
    }))

    return [...ticketItems, ...appointmentItems].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [appointments, tickets])

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return queueItems.filter((item) => {
      const matchesFilter = queueFilter === 'all' || item.kind === queueFilter
      const matchesSearch =
        !normalizedSearch ||
        [
          item.title,
          item.number,
          item.department,
          item.detail,
          item.requester,
          item.kind,
          item.status,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesFilter && matchesSearch
    })
  }, [queueFilter, queueItems, search])

  const queueTotal = ticketMeta.total + appointmentMeta.total
  const oldestWaiting = queueItems[0] ? formatWaitingTime(queueItems[0].created_at) : 'Clear'

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Queue waiting"
          value={queueTotal}
          description={`${ticketMeta.total} tickets, ${appointmentMeta.total} appointments`}
          icon={ClipboardList}
          className="border-violet-200 bg-violet-50/70 text-violet-700"
        />

        <SummaryCard
          label="Tickets waiting"
          value={ticketMeta.total}
          description="Unassigned ticket requests"
          icon={TicketCheck}
          className="border-sky-200 bg-sky-50/70 text-sky-700"
        />

        <SummaryCard
          label="Appointments waiting"
          value={appointmentMeta.total}
          description="Pending appointment requests"
          icon={CalendarCheck}
          className="border-emerald-200 bg-emerald-50/70 text-emerald-700"
        />

        <SummaryCard
          label="Oldest waiting"
          value={oldestWaiting}
          description="Longest request in queue"
          icon={Clock3}
          className="border-amber-200 bg-amber-50/70 text-amber-700"
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-violet-200 bg-white shadow-sm">
        <div className="grid gap-4 border-b bg-violet-50/70 px-5 py-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Waiting for staff</h2>
              <Badge className="border-0 bg-violet-100 text-violet-700">
                {filteredItems.length}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Combined view of unclaimed tickets and appointment requests.
            </p>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex flex-wrap gap-2">
              {queueFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setQueueFilter(filter.value)}
                  className={cn(
                    'cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                    queueFilter === filter.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-white text-muted-foreground hover:bg-slate-50 hover:text-foreground'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="relative w-full xl:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search queue..."
                className="bg-white pl-9"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-b bg-white px-5 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {filteredItems.length} of {queueItems.length} waiting requests
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
            Live sync
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] table-fixed">
            <colgroup>
              <col className="w-[42%]" />
              <col className="w-[14%]" />
              <col className="w-[20%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
            </colgroup>

            <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Request</th>
                <th className="px-5 py-3 text-center">Type</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-center">Waiting</th>
                <th className="px-5 py-3 text-center">Details</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-sm text-muted-foreground">
                    Loading queue...
                  </td>
                </tr>
              ) : filteredItems.length ? (
                filteredItems.map((item) => <QueueItemRow key={`${item.kind}-${item.id}`} item={item} />)
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <FileClock className="mx-auto size-9 text-muted-foreground" />
                    <h3 className="mt-3 font-semibold">Queue is clear</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      New tickets and appointment requests will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function QueueItemRow({ item }: { item: QueueItem }) {
  const Icon = item.kind === 'ticket' ? TicketCheck : CalendarCheck

  return (
    <tr className="border-b last:border-b-0 hover:bg-slate-50">
      <td className="px-5 py-5 align-middle">
        <div className="flex min-w-0 gap-3">
          <div
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-lg',
              item.accentClassName
            )}
          >
            <Icon className="size-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold">{item.title}</p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {item.number} - {item.department} - {item.detail}
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              Requester: <span className="font-medium text-foreground">{item.requester}</span>
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-5 text-center align-middle">
        <Badge
          variant="outline"
          className={cn('inline-flex h-8 w-28 justify-center capitalize', item.accentClassName)}
        >
          {item.kind}
        </Badge>
      </td>

      <td className="px-5 py-5 text-center align-middle">
        <Badge
          variant="secondary"
          className={cn(
            'inline-flex h-8 w-32 justify-center border-0 capitalize',
            statusStyles[item.status] ?? 'bg-slate-100 text-slate-700'
          )}
        >
          {formatStatus(item.status)}
        </Badge>
      </td>

      <td className="px-5 py-5 text-center align-middle">
        <Badge variant="secondary" className="inline-flex h-8 w-24 justify-center border-0 bg-amber-100 text-amber-700">
          {formatWaitingTime(item.created_at)}
        </Badge>
      </td>

      <td className="px-5 py-5 text-center align-middle">
        {item.kind === 'ticket' ? (
          <TicketDetailsDialog ticket={item.data} mode="readonly" />
        ) : (
          <AppointmentDetailsDialog appointment={item.data} mode="readonly" />
        )}
      </td>
    </tr>
  )
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  className,
}: {
  label: string
  value: string | number
  description: string
  icon: LucideIcon
  className?: string
}) {
  return (
    <article className={cn('rounded-lg border p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-slate-700">{label}</p>
          <p className="mt-6 text-3xl font-semibold text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  )
}