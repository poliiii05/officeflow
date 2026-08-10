import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Database,
  FileClock,
  Search,
  TicketCheck,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Appointment } from '@/features/appointments/appointment-api'
import { AppointmentDetailsDialog } from '@/features/appointments/components/AppointmentDetailsDialog'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import { getStaffOverview, type StaffDashboardTotals } from '@/features/staff/staff-dashboard-api'
import type { Ticket } from '@/features/tickets/ticket-api'
import { TicketDetailsDialog } from '@/features/tickets/components/TicketDetailsDialog'
import { echo } from '@/lib/echo'
import { cn } from '@/lib/utils'

type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

type RecordFilter = 'all' | 'tickets' | 'appointments'

type RecordRow =
  | {
      kind: 'ticket'
      id: number
      reference: string
      title: string
      requester: string
      office: string
      service: string
      status: string
      submittedAt: string
      item: Ticket
    }
  | {
      kind: 'appointment'
      id: number
      reference: string
      title: string
      requester: string
      office: string
      service: string
      status: string
      submittedAt: string
      item: Appointment
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

const recordFilters: Array<{ value: RecordFilter; label: string }> = [
  { value: 'all', label: 'All records' },
  { value: 'tickets', label: 'Tickets' },
  { value: 'appointments', label: 'Appointments' },
]

const statusStyles: Record<string, string> = {
  open: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-sky-100 text-sky-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-700',
}

// Shared column template — used by both the header row and every data row so
// they can never drift apart. min-width lets the table scroll horizontally
// on narrow screens instead of squeezing 6 columns into unreadable slivers.
const TABLE_COLUMNS = 'grid-cols-[1.3fr_1.05fr_1.05fr_1fr_0.75fr_0.95fr]'
const TABLE_MIN_WIDTH = 'min-w-[860px]'

// Shared by the filter/search row AND the date-range row below it — using
// the same template for both (instead of the date row's previous separate
// sm:grid-cols-2 + xl:ml-auto + xl:w-[340px] combo) guarantees their left
// and right edges line up at every breakpoint instead of approximating it.
const HEADER_ROW_COLS = 'md:grid-cols-[1fr_320px] xl:grid-cols-[420px_1fr]'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function normalizeStatus(value: string) {
  return value.replace('_', ' ')
}

function buildTicketRow(ticket: Ticket): RecordRow {
  return {
    kind: 'ticket',
    id: ticket.id,
    reference: ticket.ticket_number,
    title: ticket.subject,
    requester: ticket.requester?.name ?? 'Unknown requester',
    office: ticket.department,
    service: ticket.category,
    status: ticket.status,
    submittedAt: ticket.created_at,
    item: ticket,
  }
}

function buildAppointmentRow(appointment: Appointment): RecordRow {
  return {
    kind: 'appointment',
    id: appointment.id,
    reference: appointment.appointment_number,
    title: appointment.purpose,
    requester: appointment.requester?.name ?? 'Unknown requester',
    office: appointment.department,
    service: 'Appointment',
    status: appointment.status,
    submittedAt: appointment.created_at,
    item: appointment,
  }
}

export function StaffRecordsPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [ticketMeta, setTicketMeta] = useState<PaginationMeta>(emptyMeta)
  const [appointmentMeta, setAppointmentMeta] = useState<PaginationMeta>(emptyMeta)
  const [totals, setTotals] = useState<StaffDashboardTotals>(emptyTotals)
  const [page, setPage] = useState(1)
  const [recordFilter, setRecordFilter] = useState<RecordFilter>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [error, setError] = useState('')

  const loadRecords = useCallback(async () => {
    try {
      const response = await getStaffOverview({
        view: 'all',
        ticket_page: page,
        appointment_page: page,
        per_page: 10,
        search: debouncedSearch || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })

      setTickets(response.data.tickets.data)
      setTicketMeta(response.data.tickets.meta)
      setAppointments(response.data.appointments.data)
      setAppointmentMeta(response.data.appointments.meta)
      setTotals(response.data.totals)
      setError('')
      setHasLoadedOnce(true)
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to load staff records.'))
    } finally {
      setIsLoading(false)
    }
  }, [dateFrom, dateTo, debouncedSearch, page])

  const loadRecordsRef = useRef(loadRecords)

  useEffect(() => {
    loadRecordsRef.current = loadRecords
  }, [loadRecords])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setDebouncedSearch(search.trim())
    }, 250)

    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [dateFrom, dateTo, recordFilter])

  useEffect(() => {
    setIsLoading(true)
    void loadRecords()
  }, [loadRecords])

  useEffect(() => {
    const channel = echo.channel('officeflow.staff')

    channel.listen('.ticket.changed', () => void loadRecordsRef.current())
    channel.listen('.appointment.changed', () => void loadRecordsRef.current())

    return () => {
      channel.stopListening('.ticket.changed')
      channel.stopListening('.appointment.changed')
      echo.leaveChannel('officeflow.staff')
    }
  }, [])

  const rows = useMemo(() => {
    const ticketRows = recordFilter === 'appointments' ? [] : tickets.map(buildTicketRow)
    const appointmentRows =
      recordFilter === 'tickets' ? [] : appointments.map(buildAppointmentRow)

    return [...ticketRows, ...appointmentRows]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 10)
  }, [appointments, recordFilter, tickets])

  const visibleTotal =
    recordFilter === 'tickets'
      ? ticketMeta.total
      : recordFilter === 'appointments'
        ? appointmentMeta.total
        : ticketMeta.total + appointmentMeta.total

  const currentPage =
    recordFilter === 'tickets'
      ? ticketMeta.current_page
      : recordFilter === 'appointments'
        ? appointmentMeta.current_page
        : Math.max(ticketMeta.current_page, appointmentMeta.current_page)

  const lastPage =
    recordFilter === 'tickets'
      ? ticketMeta.last_page
      : recordFilter === 'appointments'
        ? appointmentMeta.last_page
        : Math.max(ticketMeta.last_page, appointmentMeta.last_page)

  const showInitialLoading = isLoading && !hasLoadedOnce

  return (
    <section className="mx-auto max-w-7xl space-y-5">
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={Database}
          title="All records"
          value={totals.allRecords}
          description="Tickets and appointments in your staff view."
          tone="slate"
        />
        <MetricCard
          icon={TicketCheck}
          title="Ticket records"
          value={ticketMeta.total}
          description="Ticket requests available in this record view."
          tone="sky"
        />
        <MetricCard
          icon={CalendarCheck}
          title="Appointment records"
          value={appointmentMeta.total}
          description="Appointment requests available in this record view."
          tone="emerald"
        />
      </div>

      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="border-b bg-slate-50 px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <FileClock className="size-5" />
              </div>

              <div>
                <h2 className="font-semibold">Request records</h2>
                <p className="text-sm text-muted-foreground">
                  Search and review ticket and appointment history without changing status.
                </p>
              </div>
            </div>

            <div className="grid gap-3 xl:w-[900px]">
              <div className={cn('grid gap-2 xl:items-end', HEADER_ROW_COLS)}>
                <div className="grid grid-cols-3 gap-2">
                  {recordFilters.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setRecordFilter(filter.value)}
                      className={cn(
                        'flex h-11 cursor-pointer items-center justify-center rounded-lg border px-4 text-center text-sm font-medium transition-colors',
                        recordFilter === filter.value
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search requester, number, office, or service..."
                    className="h-11 bg-white pl-9"
                  />
                </div>
              </div>

              {/* Full-width row spanning the same 900px container as the row
                  above — previously this only occupied the search column's
                  width (nested under HEADER_ROW_COLS's second cell), which
                  left an empty gap under the filter buttons and made the
                  whole control cluster look like an L-shape instead of a
                  clean rectangle. */}
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-xs font-medium uppercase text-muted-foreground">
                  From
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="h-11 bg-white normal-case"
                  />
                </label>

                <label className="grid gap-1 text-xs font-medium uppercase text-muted-foreground">
                  To
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="h-11 bg-white normal-case"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal scroll container: below ~860px the table scrolls
            sideways instead of squeezing 6 columns into unreadable slivers. */}
        <div className="overflow-x-auto">
          <div className={TABLE_MIN_WIDTH}>
            <div
              className={cn(
                'grid border-b bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-muted-foreground',
                TABLE_COLUMNS
              )}
            >
              <p>Request</p>
              <p>Requester</p>
              <p>Office</p>
              <p>Submitted</p>
              <p>Status</p>
              <p>Action</p>
            </div>

            {/* Subtle inline indicator while a filter/search/date change is
                refetching, so the table doesn't look frozen mid-interaction. */}
            {isLoading && hasLoadedOnce ? (
              <div className="h-0.5 w-full overflow-hidden bg-slate-100">
                <div className="h-full w-1/3 animate-pulse bg-slate-400" />
              </div>
            ) : null}

            {showInitialLoading ? (
              <div className="px-5 py-10 text-sm text-muted-foreground">Loading records...</div>
            ) : rows.length ? (
              rows.map((row) => (
                <article
                  key={`${row.kind}-${row.id}`}
                  className={cn(
                    'grid items-center border-b px-5 py-4 text-sm last:border-b-0',
                    TABLE_COLUMNS
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-lg',
                        row.kind === 'ticket'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-emerald-100 text-emerald-700'
                      )}
                    >
                      {row.kind === 'ticket' ? (
                        <TicketCheck className="size-4" />
                      ) : (
                        <CalendarCheck className="size-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.title}</p>
                      <p className="truncate text-muted-foreground">{row.reference}</p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.requester}</p>
                    <p className="text-xs capitalize text-muted-foreground">{row.kind}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.office}</p>
                    <p className="truncate text-muted-foreground">{row.service}</p>
                  </div>

                  <p className="font-medium text-slate-700">{formatDateTime(row.submittedAt)}</p>

                  <Badge
                    variant="secondary"
                    className={cn(
                      'w-fit border-0 capitalize',
                      statusStyles[row.status] ?? 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {normalizeStatus(row.status)}
                  </Badge>

                  <div className="flex justify-start">
                    {row.kind === 'ticket' ? (
                      <TicketDetailsDialog ticket={row.item} mode="readonly" />
                    ) : (
                      <AppointmentDetailsDialog appointment={row.item} mode="readonly" />
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="px-5 py-10 text-sm text-muted-foreground">
                No records found. Try changing the search, date range, or record filter.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {currentPage} of {lastPage} - {visibleTotal} record
            {visibleTotal === 1 ? '' : 's'}
          </span>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer bg-white"
              disabled={currentPage <= 1}
              onClick={() => setPage((page) => Math.max(page - 1, 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              className="cursor-pointer bg-white"
              disabled={currentPage >= lastPage}
              onClick={() => setPage((page) => Math.min(page + 1, lastPage))}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
    </section>
  )
}

function MetricCard({
  icon: Icon,
  title,
  value,
  description,
  tone,
}: {
  icon: LucideIcon
  title: string
  value: number
  description: string
  tone: 'slate' | 'sky' | 'emerald'
}) {
  const toneStyles = {
    slate: 'border-slate-200 bg-white text-slate-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return (
    <div className={cn('rounded-lg border p-5 shadow-sm', toneStyles[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-950">{title}</p>
          <p className="mt-6 text-3xl font-semibold text-slate-950">{value}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}