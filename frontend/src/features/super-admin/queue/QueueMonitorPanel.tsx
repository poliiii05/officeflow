import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Search,
  TicketCheck,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAppointments, type Appointment } from '@/features/appointments/appointment-api'
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

type TicketQueueItem = {
  id: string
  type: 'ticket'
  title: string
  number: string
  office: string
  service: string
  requester: string
  status: string
  created_at: string
  searchText: string
  data: Ticket
}

type AppointmentQueueItem = {
  id: string
  type: 'appointment'
  title: string
  number: string
  office: string
  service: string
  requester: string
  status: string
  created_at: string
  searchText: string
  data: Appointment
}

type QueueItem = TicketQueueItem | AppointmentQueueItem

const QUEUE_PAGE_SIZE = 10

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 50,
  total: 0,
}

const queueFilters: { value: QueueFilter; label: string }[] = [
  { value: 'all', label: 'All queue' },
  { value: 'ticket', label: 'Tickets' },
  { value: 'appointment', label: 'Appointments' },
]

const statusStyles: Record<string, string> = {
  open: 'bg-sky-500/15 text-sky-700',
  in_progress: 'bg-amber-500/15 text-amber-700',
  resolved: 'bg-emerald-500/15 text-emerald-700',
  closed: 'bg-slate-500/15 text-slate-700',
  pending: 'bg-amber-500/15 text-amber-700',
  scheduled: 'bg-sky-500/15 text-sky-700',
  completed: 'bg-emerald-500/15 text-emerald-700',
  cancelled: 'bg-slate-500/15 text-slate-700',
}

function formatStatus(status: string) {
  return status.replace('_', ' ')
}

function formatWaitingTime(value: string) {
  const createdAt = new Date(value).getTime()
  const diffMs = Date.now() - createdAt
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes < 60) return `${diffMinutes}m`
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`

  return `${Math.floor(diffMinutes / 1440)}d`
}

export function QueueMonitorPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [ticketMeta, setTicketMeta] = useState<PaginationMeta>(emptyMeta)
  const [appointmentMeta, setAppointmentMeta] = useState<PaginationMeta>(emptyMeta)
  const [search, setSearch] = useState('')
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all')
  const [queuePage, setQueuePage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadQueue = useCallback(async () => {
    try {
      const [ticketResponse, appointmentResponse] = await Promise.all([
        getTickets({ queue: 'unassigned', per_page: 50 }),
        getAppointments({ queue: 'pending', per_page: 50 }),
      ])

      setTickets(ticketResponse.data)
      setTicketMeta(ticketResponse.meta)
      setAppointments(appointmentResponse.data)
      setAppointmentMeta(appointmentResponse.meta)
      setError('')
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, 'Unable to load queue monitor.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadQueue()
  }, [loadQueue])

  useEffect(() => {
    const channel = echo.channel('officeflow.staff')

    channel.listen('.ticket.changed', () => {
      void loadQueue()
    })

    channel.listen('.appointment.changed', () => {
      void loadQueue()
    })

    return () => {
      channel.stopListening('.ticket.changed')
      channel.stopListening('.appointment.changed')
      echo.leave('officeflow.staff')
    }
  }, [loadQueue])

  useEffect(() => {
    setQueuePage(1)
  }, [queueFilter, search])

  const queueItems = useMemo<QueueItem[]>(() => {
    const ticketItems: QueueItem[] = tickets.map((ticket) => ({
      id: `ticket-${ticket.id}`,
      type: 'ticket',
      title: ticket.subject,
      number: ticket.ticket_number,
      office: ticket.department,
      service: ticket.category,
      requester: ticket.requester?.name ?? 'Requester',
      status: ticket.status,
      created_at: ticket.created_at,
      searchText: [
        ticket.subject,
        ticket.ticket_number,
        ticket.department,
        ticket.category,
        ticket.requester?.name,
        ticket.requester?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
      data: ticket,
    }))

    const appointmentItems: QueueItem[] = appointments.map((appointment) => ({
      id: `appointment-${appointment.id}`,
      type: 'appointment',
      title: appointment.purpose,
      number: appointment.appointment_number,
      office: appointment.department,
      service: 'Appointment',
      requester: appointment.requester?.name ?? 'Requester',
      status: appointment.status,
      created_at: appointment.created_at,
      searchText: [
        appointment.purpose,
        appointment.appointment_number,
        appointment.department,
        appointment.requester?.name,
        appointment.requester?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
      data: appointment,
    }))

    return [...ticketItems, ...appointmentItems].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [appointments, tickets])

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return queueItems.filter((item) => {
      const matchesType = queueFilter === 'all' || item.type === queueFilter
      const matchesSearch = normalizedSearch ? item.searchText.includes(normalizedSearch) : true

      return matchesType && matchesSearch
    })
  }, [queueFilter, queueItems, search])

  const queueLastPage = Math.max(1, Math.ceil(filteredItems.length / QUEUE_PAGE_SIZE))
  const pagedItems = filteredItems.slice(
    (queuePage - 1) * QUEUE_PAGE_SIZE,
    queuePage * QUEUE_PAGE_SIZE
  )

  const queueTotal = ticketMeta.total + appointmentMeta.total
  const oldestWaiting = queueItems[0]?.created_at

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <SummaryCard
          title="Queue waiting"
          value={queueTotal}
          description={`${ticketMeta.total} tickets, ${appointmentMeta.total} appointments`}
          icon={ClipboardList}
          accent="violet"
        />
        <SummaryCard
          title="Tickets waiting"
          value={ticketMeta.total}
          description="Unassigned ticket requests"
          icon={TicketCheck}
          accent="sky"
        />
        <SummaryCard
          title="Appointments waiting"
          value={appointmentMeta.total}
          description="Pending appointment requests"
          icon={CalendarCheck}
          accent="emerald"
        />
        <SummaryCard
          title="Oldest waiting"
          value={oldestWaiting ? formatWaitingTime(oldestWaiting) : 'Clear'}
          description={oldestWaiting ? 'Longest unclaimed request' : 'No waiting requests'}
          icon={Clock3}
          accent="amber"
        />
      </div>

      <section className="overflow-hidden rounded-lg border border-violet-100 bg-white shadow-sm">
        <div className="border-b bg-violet-50/60 px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Waiting for staff</h2>
                <Badge className="border-0 bg-violet-100 text-violet-700">
                  {filteredItems.length}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Combined list of unclaimed tickets and pending appointments.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex flex-wrap gap-2">
                {queueFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setQueueFilter(filter.value)}
                    className={cn(
                      'h-10 cursor-pointer rounded-lg border px-4 text-sm font-medium transition-colors',
                      queueFilter === filter.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-0 lg:w-96">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search number, requester, department..."
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1120px]">
            <div className="grid grid-cols-[34%_14%_14%_14%_24%] border-b bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-muted-foreground">
              <span>Request</span>
              <span>Type</span>
              <span>Status</span>
              <span>Waiting</span>
              <span>Details</span>
            </div>

            {isLoading ? (
              <div className="px-5 py-10 text-sm text-muted-foreground">Loading queue...</div>
            ) : pagedItems.length ? (
              pagedItems.map((item) => <QueueItemRow key={item.id} item={item} />)
            ) : (
              <div className="px-5 py-10 text-sm text-muted-foreground">
                No waiting requests match this view.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {queuePage} of {queueLastPage} - {filteredItems.length} waiting{' '}
            {filteredItems.length === 1 ? 'request' : 'requests'}
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              disabled={queuePage <= 1}
              onClick={() => setQueuePage((page) => Math.max(page - 1, 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              disabled={queuePage >= queueLastPage}
              onClick={() => setQueuePage((page) => Math.min(page + 1, queueLastPage))}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function QueueItemRow({ item }: { item: QueueItem }) {
  const Icon = item.type === 'ticket' ? TicketCheck : CalendarCheck
  const itemColor =
    item.type === 'ticket'
      ? 'bg-sky-100 text-sky-700'
      : 'bg-emerald-100 text-emerald-700'

  return (
    <div className="grid grid-cols-[34%_14%_14%_14%_24%] items-center border-b px-5 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg', itemColor)}>
          <Icon className="size-4" />
        </div>

        <div className="min-w-0">
          <p className="truncate font-semibold">{item.title}</p>
          <p className="truncate text-sm text-muted-foreground">{item.number}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {item.office} - {item.service}
          </p>
        </div>
      </div>

      <div>
        <Badge variant="outline" className="capitalize">
          {item.type}
        </Badge>
      </div>

      <div>
        <Badge className={cn('border-0 capitalize', statusStyles[item.status] ?? '')}>
          {formatStatus(item.status)}
        </Badge>
      </div>

      <div className="text-sm text-muted-foreground">{formatWaitingTime(item.created_at)}</div>

      <div className="flex justify-start [&_button]:min-w-[132px] [&_button]:whitespace-nowrap">
        {item.type === 'ticket' ? (
          <TicketDetailsDialog ticket={item.data} mode="readonly" />
        ) : (
          <AppointmentDetailsDialog appointment={item.data} mode="readonly" />
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: {
  title: string
  value: number | string
  description: string
  icon: LucideIcon
  accent: 'violet' | 'sky' | 'emerald' | 'amber'
}) {
  const accentStyles = {
    violet: 'border-violet-200 bg-violet-50/70 text-violet-700',
    sky: 'border-sky-200 bg-sky-50/70 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50/70 text-amber-700',
  }

  return (
    <article className={cn('rounded-lg border p-5 shadow-sm', accentStyles[accent])}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-slate-700">{title}</p>
          <p className="mt-7 text-3xl font-semibold text-slate-950">{value}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  )
}