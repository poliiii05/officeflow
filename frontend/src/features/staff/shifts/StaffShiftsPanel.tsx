import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileClock,
  Power,
  TimerReset,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import {
  endStaffShift,
  getCurrentStaffShift,
  getStaffShiftHistory,
  startStaffShift,
  type StaffShiftEndReason,
  type StaffShiftHistoryItem,
  type StaffShiftHistoryMeta,
  type StaffShiftState,
} from '@/features/staff/staff-shift-api'
import {
  getPresetRange,
  SubmittedDateFilter,
  type DatePreset,
} from '@/features/super-admin/components/SubmittedDateFilter'
import { cn } from '@/lib/utils'

const emptyMeta: StaffShiftHistoryMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
}

const emptyShiftState: StaffShiftState = {
  is_on_duty: false,
  can_start_shift: true,
  has_shift_today: false,
  shift: null,
  today_shift: null,
  today_summary: null,
}

// Shift history is a "how far back" view, not a calendar-month view, so it
// uses relative "Last N days" presets (the pattern used by timesheet tools
// like When I Work / Connecteam) rather than This week / This month.
const SHIFT_DATE_PRESETS: DatePreset[] = ['all', 'last_7_days', 'last_30_days', 'last_60_days']

const TABLE_COLUMNS = 'grid-cols-[1.1fr_1fr_1fr_1fr_1fr_1.1fr_1fr]'
const TABLE_MIN_WIDTH = 'min-w-[880px]'

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded'

  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(value?: string | null) {
  if (!value) return 'Not recorded'

  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDuration(minutes: number) {
  if (minutes <= 0) return '0m'

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours <= 0) return `${remainingMinutes}m`
  if (remainingMinutes <= 0) return `${hours}h`

  return `${hours}h ${remainingMinutes}m`
}

function getLiveDuration(startedAt?: string | null, now = Date.now()) {
  if (!startedAt) return 'No active session'

  const diff = now - new Date(startedAt).getTime()
  const minutes = Math.max(Math.floor(diff / 60000), 0)

  return `${formatDuration(minutes)} on duty`
}

function formatEndReason(value: StaffShiftHistoryItem['end_reason']) {
  if (value === 'early_out') return 'Early out'
  if (value === 'end_shift') return 'End shift'
  return 'Active shift'
}

export function StaffShiftsPanel() {
  const [shiftState, setShiftState] = useState<StaffShiftState>(emptyShiftState)
  const [shifts, setShifts] = useState<StaffShiftHistoryItem[]>([])
  const [meta, setMeta] = useState<StaffShiftHistoryMeta>(emptyMeta)
  const [page, setPage] = useState(1)
  const [datePreset, setDatePreset] = useState<DatePreset | 'custom'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingShift, setIsUpdatingShift] = useState(false)
  const [isEndShiftOpen, setIsEndShiftOpen] = useState(false)
  const [endShiftReason, setEndShiftReason] = useState<StaffShiftEndReason>('end_shift')
  const [nowTick, setNowTick] = useState(Date.now())
  const [error, setError] = useState('')

  const displayShift = shiftState.shift ?? shiftState.today_shift
  const canStartShift = shiftState.can_start_shift && !shiftState.is_on_duty
  const endingPreview = useMemo(() => new Date(nowTick).toISOString(), [nowTick])

  // When today's shift is already closed, the summary cards are showing a
  // finished session, so label them as the last recorded shift rather than a
  // live one - avoids reading like a shift is still open.
  const showingClosedShift = !shiftState.is_on_duty && shiftState.has_shift_today

  const statusLabel = shiftState.is_on_duty
    ? 'On duty'
    : shiftState.has_shift_today
      ? 'Shift recorded'
      : 'Off duty'

  const statusDescription = shiftState.is_on_duty
    ? getLiveDuration(shiftState.shift?.started_at, nowTick)
    : shiftState.has_shift_today
      ? 'Your shift for today is already closed.'
      : 'No shift recorded for today.'

 const completedToday = shiftState.today_summary?.completed_total ?? 0

  const loadShiftHistory = useCallback(async () => {
    try {
      const [currentResponse, historyResponse] = await Promise.all([
        getCurrentStaffShift(),
        getStaffShiftHistory({
          page,
          per_page: 10,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
      ])

      setShiftState(currentResponse.data)
      setShifts(historyResponse.data)
      setMeta(historyResponse.meta)
      setError('')
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to load shift history.'))
    } finally {
      setIsLoading(false)
    }
  }, [dateFrom, dateTo, page])

  useEffect(() => {
    void loadShiftHistory()
  }, [loadShiftHistory])

  useEffect(() => {
    if (!shiftState.is_on_duty) return

    const timer = window.setInterval(() => {
      setNowTick(Date.now())
    }, 30000)

    return () => window.clearInterval(timer)
  }, [shiftState.is_on_duty])

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

  async function handleStartShift() {
    if (!canStartShift || isUpdatingShift) return

    setIsUpdatingShift(true)
    setError('')

    try {
      const response = await startStaffShift()
      setShiftState(response.data)
      setNowTick(Date.now())
      await loadShiftHistory()
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to start shift.'))
    } finally {
      setIsUpdatingShift(false)
    }
  }

  function handleOpenEndShift() {
    if (!shiftState.is_on_duty) return

    setNowTick(Date.now())
    setEndShiftReason('end_shift')
    setIsEndShiftOpen(true)
  }

  async function handleEndShift() {
    if (!shiftState.is_on_duty || isUpdatingShift) return

    setIsUpdatingShift(true)
    setError('')

    try {
      const response = await endStaffShift(endShiftReason)
      setShiftState(response.data)
      setIsEndShiftOpen(false)
      setEndShiftReason('end_shift')
      await loadShiftHistory()
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to end shift.'))
    } finally {
      setIsUpdatingShift(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-5">
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div
          className={cn(
            'rounded-lg border p-5 shadow-sm',
            shiftState.is_on_duty
              ? 'border-emerald-200 bg-emerald-50'
              : shiftState.has_shift_today
                ? 'border-amber-200 bg-amber-50'
                : 'border-slate-200 bg-white'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today</p>
              <h2 className="mt-2 text-2xl font-semibold">{statusLabel}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{statusDescription}</p>
            </div>

            <div
              className={cn(
                'flex size-11 items-center justify-center rounded-lg',
                shiftState.is_on_duty
                  ? 'bg-emerald-100 text-emerald-700'
                  : shiftState.has_shift_today
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-700'
              )}
            >
              <Clock3 className="size-5" />
            </div>
          </div>

          <div className="mt-5">
            {shiftState.is_on_duty ? (
              <Button
                type="button"
                variant="destructive"
                className="w-full cursor-pointer"
                onClick={handleOpenEndShift}
                disabled={isUpdatingShift}
              >
                End shift
                <Power className="size-4" />
              </Button>
            ) : canStartShift ? (
              <Button
                type="button"
                className="w-full cursor-pointer"
                onClick={handleStartShift}
                disabled={isUpdatingShift}
              >
                Start shift
                <Power className="size-4" />
              </Button>
            ) : (
              <Button type="button" variant="outline" className="w-full bg-white" disabled>
                Shift completed today
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          {/* Header line clarifies whether these three cards describe a live
              shift or the last recorded one for the day. */}
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            {shiftState.is_on_duty
              ? 'Current shift'
              : showingClosedShift
                ? 'Last recorded shift today'
                : 'Latest shift'}
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              icon={CalendarClock}
              label="Started at"
              value={formatTime(displayShift?.started_at)}
              helper={formatDate(displayShift?.started_at)}
              tone="sky"
            />
            <SummaryCard
              icon={TimerReset}
              label="Ended at"
              value={shiftState.is_on_duty ? 'Active now' : formatTime(displayShift?.ended_at)}
              helper={shiftState.is_on_duty ? 'Current shift' : formatDate(displayShift?.ended_at)}
              tone="emerald"
            />
            <SummaryCard
              icon={CheckCircle2}
              label="Completed today"
              value={String(completedToday)}
              helper="Resolved tickets and completed appointments"
              tone="violet"
            />
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b bg-slate-50 px-5 py-4 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <FileClock className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">Shift history</h2>
              <p className="text-sm text-muted-foreground">
                Review your staff attendance records, session duration, and completed work.
              </p>
            </div>
          </div>

          <SubmittedDateFilter
            presets={SHIFT_DATE_PRESETS}
            activePreset={datePreset}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onPresetChange={handlePresetChange}
            onDateFromChange={handleDateFromChange}
            onDateToChange={handleDateToChange}
            onClear={clearDateFilter}
          />
        </div>

        <div className="overflow-x-auto">
          <div className={TABLE_MIN_WIDTH}>
            <div
              className={cn(
                'grid border-b bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-muted-foreground',
                TABLE_COLUMNS
              )}
            >
              <p>Date</p>
              <p>Time in</p>
              <p>Time out</p>
              <p>Duration</p>
              <p>Close type</p>
              <p>Completed work</p>
              <p>Status</p>
            </div>

            {isLoading ? (
              <div className="px-5 py-10 text-sm text-muted-foreground">
                Loading shift history...
              </div>
            ) : shifts.length ? (
              shifts.map((shift) => (
                <article
                  key={shift.id}
                  className={cn(
                    'grid items-center border-b px-5 py-4 text-sm last:border-b-0',
                    TABLE_COLUMNS
                  )}
                >
                  <div>
                    <p className="font-medium">{formatDate(shift.started_at)}</p>
                  </div>

                  <p>{formatTime(shift.started_at)}</p>
                  <p>{shift.ended_at ? formatTime(shift.ended_at) : 'Active now'}</p>
                  <p className="font-medium">{formatDuration(shift.duration_minutes)}</p>

                  <Badge variant="secondary" className="w-fit border-0 bg-slate-100 text-slate-700">
                    {formatEndReason(shift.end_reason)}
                  </Badge>

                  <p
                    className="truncate text-sm text-muted-foreground"
                    title={`${shift.completed_tickets} tickets, ${shift.completed_appointments} appointments`}
                  >
                    <span className="font-medium text-sky-700">{shift.completed_tickets}</span> tickets -{' '}
                    <span className="font-medium text-emerald-700">
                      {shift.completed_appointments}
                    </span>{' '}
                    appts
                  </p>

                  <Badge
                    variant="secondary"
                    className={cn(
                      'w-fit border-0 capitalize',
                      shift.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {shift.status}
                  </Badge>
                </article>
              ))
            ) : (
              <div className="px-5 py-10 text-sm text-muted-foreground">
                No shift records found for this date range.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {meta.current_page} of {meta.last_page} - {meta.total} shift
            {meta.total === 1 ? '' : 's'}
          </span>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer bg-white"
              disabled={meta.current_page <= 1}
              onClick={() => setPage((page) => Math.max(page - 1, 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              className="cursor-pointer bg-white"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage((page) => Math.min(page + 1, meta.last_page))}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={isEndShiftOpen} onOpenChange={setIsEndShiftOpen}>
        <DialogContent className="!max-w-lg overflow-hidden p-0">
          <div className="border-b bg-amber-50 px-5 py-4">
            <DialogHeader>
              <DialogTitle>End your shift?</DialogTitle>
              <DialogDescription>
                Choose how this shift should be closed for today.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-5 py-5">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                {
                  value: 'early_out',
                  label: 'Early out',
                  description: 'Close this shift before your regular end time.',
                },
                {
                  value: 'end_shift',
                  label: 'End shift',
                  description: 'Normal shift close for today.',
                },
              ].map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => setEndShiftReason(reason.value as StaffShiftEndReason)}
                  className={cn(
                    'cursor-pointer rounded-lg border p-3 text-left transition-colors',
                    endShiftReason === reason.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  )}
                >
                  <p className="font-medium">{reason.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {reason.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="rounded-lg border bg-slate-50 p-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Assigned requests will stay assigned to you. Status updates and staff replies pause
                until your next shift.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <ShiftDialogMetric
                label="Started at"
                value={formatTime(shiftState.shift?.started_at)}
                helper={formatDate(shiftState.shift?.started_at)}
              />
              <ShiftDialogMetric
                label="Ending at"
                value={formatTime(endingPreview)}
                helper={formatDate(endingPreview)}
              />
              <ShiftDialogMetric
                label="Session"
                value={getLiveDuration(shiftState.shift?.started_at, nowTick)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t bg-slate-50 px-5 py-3">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer bg-white"
              onClick={() => setIsEndShiftOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
              onClick={handleEndShift}
              disabled={isUpdatingShift}
            >
              End shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  helper: string
  tone: 'sky' | 'emerald' | 'violet'
}) {
  const toneStyles = {
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
  }

  return (
    <div className={cn('rounded-lg border p-4', toneStyles[tone])}>
      <Icon className="size-4" />
      <p className="mt-3 text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
    </div>
  )
}

function ShiftDialogMetric({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper?: string
}) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
      {helper ? <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  )
}