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
import { useCallback, useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppointmentDetailsDialog } from '@/features/appointments/components/AppointmentDetailsDialog'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import {
  getStaffRecords,
  type StaffRecord,
  type StaffRecordKind,
  type StaffRecordsMeta,
  type StaffRecordsSummary,
} from '@/features/staff/records/staff-records-api'
import {
  getPresetRange,
  SubmittedDateFilter,
  type DatePreset,
} from '@/features/super-admin/components/SubmittedDateFilter'
import { TicketDetailsDialog } from '@/features/tickets/components/TicketDetailsDialog'
import { echo } from '@/lib/echo'
import { cn } from '@/lib/utils'

const emptyMeta: StaffRecordsMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
}

const emptySummary: StaffRecordsSummary = {
  all: 0,
  tickets: 0,
  appointments: 0,
}

const filters: Array<{ value: StaffRecordKind; label: string }> = [
  { value: 'all', label: 'All records' },
  { value: 'tickets', label: 'Tickets' },
  { value: 'appointments', label: 'Appointments' },
]

// Records is a history view over requests regardless of their current
// status, so "Overdue" (which depends on a request still being
// pending/unresolved) doesn't map onto it the way it does for the live
// Tickets/Appointments queues - left out on purpose.
const RECORDS_DATE_PRESETS: DatePreset[] = ['all', 'today', 'this_week', 'this_month']

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

const tableColumns = 'grid-cols-[1.35fr_1.05fr_1.05fr_1fr_0.8fr_1fr]'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatStatus(value: string) {
  return value.replace('_', ' ')
}

export function StaffRecordsPanel() {
  const [records, setRecords] = useState<StaffRecord[]>([])
  const [meta, setMeta] = useState<StaffRecordsMeta>(emptyMeta)
  const [summary, setSummary] = useState<StaffRecordsSummary>(emptySummary)
  const [filter, setFilter] = useState<StaffRecordKind>('all')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [datePreset, setDatePreset] = useState<DatePreset | 'custom'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [error, setError] = useState('')

  const loadRecords = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) setIsLoading(true)

      try {
        const response = await getStaffRecords({
          kind: filter,
          page,
          per_page: 10,
          search: debouncedSearch || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        })

        setRecords(response.data)
        setMeta(response.meta)
        setSummary(response.summary)
        setError('')
      } catch (error) {
        setError(getApiErrorMessage(error, 'Unable to load staff records.'))
      } finally {
        setIsLoading(false)
        setHasLoadedOnce(true)
      }
    },
    [dateFrom, dateTo, debouncedSearch, filter, page]
  )

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
    void loadRecords()
  }, [loadRecords])

  useEffect(() => {
    const channel = echo.channel('officeflow.staff')

    channel.listen('.ticket.changed', () => {
      void loadRecordsRef.current({ silent: true })
    })

    channel.listen('.appointment.changed', () => {
      void loadRecordsRef.current({ silent: true })
    })

    return () => {
      channel.stopListening('.ticket.changed')
      channel.stopListening('.appointment.changed')
      echo.leaveChannel('officeflow.staff')
    }
  }, [])

  function changeFilter(value: StaffRecordKind) {
    setFilter(value)
    setPage(1)
  }

  function handlePresetChange(preset: DatePreset) {
    const range = getPresetRange(preset)

    setPage(1)
    setDatePreset(preset)
    setDateFrom(range.from)
    setDateTo(range.to)
  }

  function handleDateFromChange(value: string) {
    setPage(1)
    setDatePreset('custom')
    setDateFrom(value)

    if (dateTo && value && value > dateTo) {
      setDateTo('')
    }
  }

  function handleDateToChange(value: string) {
    setPage(1)
    setDatePreset('custom')
    setDateTo(value)
  }

  function clearDateFilter() {
    setPage(1)
    setDatePreset('all')
    setDateFrom('')
    setDateTo('')
  }

  const isInitialLoading = isLoading && !hasLoadedOnce

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
          value={summary.all}
          description="Tickets and appointments in the staff record view."
          tone="slate"
        />
        <MetricCard
          icon={TicketCheck}
          title="Ticket records"
          value={summary.tickets}
          description="Ticket requests matching the current date and search filters."
          tone="sky"
        />
        <MetricCard
          icon={CalendarCheck}
          title="Appointment records"
          value={summary.appointments}
          description="Appointment requests matching the current date and search filters."
          tone="emerald"
        />
      </div>

      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="border-b bg-slate-50 px-5 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <FileClock className="size-5" />
              </div>

              <div>
                <h2 className="font-semibold">Request records</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Search and review ticket and appointment history without changing status.
                </p>
              </div>
            </div>

            {/* One horizontal toolbar: kind toggle on the left, date presets
                and search on the right - keeps every control on a single
                aligned row instead of stacked full-width blocks. */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex items-center gap-1 rounded-md border bg-white p-1">
                {filters.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => changeFilter(item.value)}
                    className={cn(
                      'h-8 cursor-pointer rounded-sm px-3 text-sm font-medium transition-colors',
                      filter === item.value
                        ? 'bg-slate-900 text-white'
                        : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SubmittedDateFilter
                  presets={RECORDS_DATE_PRESETS}
                  activePreset={datePreset}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onPresetChange={handlePresetChange}
                  onDateFromChange={handleDateFromChange}
                  onDateToChange={handleDateToChange}
                  onClear={clearDateFilter}
                />

                <div className="relative sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search requester, number, office..."
                    className="h-9 bg-white pl-9"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {isLoading && hasLoadedOnce ? (
          <div className="h-0.5 overflow-hidden bg-slate-100">
            <div className="h-full w-1/3 animate-pulse bg-slate-400" />
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div
              className={cn(
                'grid border-b bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-muted-foreground',
                tableColumns
              )}
            >
              <p>Request</p>
              <p>Requester</p>
              <p>Office</p>
              <p>Submitted</p>
              <p>Status</p>
              <p>Action</p>
            </div>

            {isInitialLoading ? (
              <div className="px-5 py-10 text-sm text-muted-foreground">
                Loading records...
              </div>
            ) : records.length ? (
              records.map((record) => (
                <RecordRow key={`${record.kind}-${record.item.id}`} record={record} />
              ))
            ) : (
              <div className="px-5 py-10 text-sm text-muted-foreground">
                No records found. Try changing the date range, search, or record filter.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {meta.current_page} of {meta.last_page} - {meta.total} record
            {meta.total === 1 ? '' : 's'}
          </span>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer bg-white"
              disabled={meta.current_page <= 1}
              onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              className="cursor-pointer bg-white"
              disabled={meta.current_page >= meta.last_page}
              onClick={() =>
                setPage((currentPage) => Math.min(currentPage + 1, meta.last_page))
              }
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

function RecordRow({ record }: { record: StaffRecord }) {
  if (record.kind === 'ticket') {
    const ticket = record.item

    return (
      <article
        className={cn(
          'grid items-center border-b px-5 py-4 text-sm last:border-b-0',
          tableColumns
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <TicketCheck className="size-4" />
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium">{ticket.subject}</p>
            <p className="truncate text-muted-foreground">
              {ticket.ticket_number}
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <p className="truncate font-medium">
            {ticket.requester?.name ?? 'Unknown requester'}
          </p>
          <p className="text-xs text-muted-foreground">Ticket</p>
        </div>

        <div className="min-w-0">
          <p className="truncate font-medium">{ticket.department}</p>
          <p className="truncate text-muted-foreground">{ticket.category}</p>
        </div>

        <p className="font-medium text-slate-700">
          {formatDateTime(ticket.created_at)}
        </p>

        <Badge
          variant="secondary"
          className={cn(
            'w-fit border-0 capitalize',
            statusStyles[ticket.status] ?? 'bg-slate-100 text-slate-700'
          )}
        >
          {formatStatus(ticket.status)}
        </Badge>

        <div className="flex justify-start">
          <TicketDetailsDialog ticket={ticket} mode="readonly" />
        </div>
      </article>
    )
  }

  const appointment = record.item

  return (
    <article
      className={cn(
        'grid items-center border-b px-5 py-4 text-sm last:border-b-0',
        tableColumns
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <CalendarCheck className="size-4" />
        </div>

        <div className="min-w-0">
          <p className="truncate font-medium">{appointment.purpose}</p>
          <p className="truncate text-muted-foreground">
            {appointment.appointment_number}
          </p>
        </div>
      </div>

      <div className="min-w-0">
        <p className="truncate font-medium">
          {appointment.requester?.name ?? 'Unknown requester'}
        </p>
        <p className="text-xs text-muted-foreground">Appointment</p>
      </div>

      <div className="min-w-0">
        <p className="truncate font-medium">{appointment.department}</p>
        <p className="truncate text-muted-foreground">Appointment</p>
      </div>

      <p className="font-medium text-slate-700">
        {formatDateTime(appointment.created_at)}
      </p>

      <Badge
        variant="secondary"
        className={cn(
          'w-fit border-0 capitalize',
          statusStyles[appointment.status] ?? 'bg-slate-100 text-slate-700'
        )}
      >
        {formatStatus(appointment.status)}
      </Badge>

      <div className="flex justify-start">
        <AppointmentDetailsDialog appointment={appointment} mode="readonly" />
      </div>
    </article>
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
  const styles = {
    slate: 'border-slate-200 bg-white text-slate-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return (
    <article className={cn('rounded-lg border p-5 shadow-sm', styles[tone])}>
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
    </article>
  )
}