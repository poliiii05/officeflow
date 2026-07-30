import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Inbox,
  ListChecks,
  Power,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import { StaffProductivityChart } from '@/features/staff/dashboard/StaffProductivityChart'
import { getStaffOverview, type StaffDashboardTotals } from '@/features/staff/staff-dashboard-api'
import {
  endStaffShift,
  getCurrentStaffShift,
  startStaffShift,
  type StaffShiftEndReason,
  type StaffShiftState,
} from '@/features/staff/staff-shift-api'
import { echo } from '@/lib/echo'
import { cn } from '@/lib/utils'

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

const endShiftOptions: Array<{
  value: StaffShiftEndReason
  label: string
  description: string
}> = [
  {
    value: 'early_out',
    label: 'Early out',
    description: 'Use this when ending the shift earlier than expected.',
  },
  {
    value: 'end_shift',
    label: 'End shift',
    description: 'Normal shift close for today.',
  },
]

function getMinutesBetween(startedAt?: string | null, endedAt?: string | null, fallbackEnd = Date.now()) {
  if (!startedAt) return 0

  const start = new Date(startedAt).getTime()
  const end = endedAt ? new Date(endedAt).getTime() : fallbackEnd

  return Math.max(Math.floor((end - start) / 60000), 0)
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours <= 0) return `${remainingMinutes}m`
  return `${hours}h ${remainingMinutes}m`
}

function formatShiftSession(startedAt?: string | null, endedAt?: string | null, now = Date.now()) {
  if (!startedAt) return 'No active shift'

  const duration = formatDuration(getMinutesBetween(startedAt, endedAt, now))
  return endedAt ? `${duration} recorded` : `${duration} on duty`
}

function formatShiftDateTime(value?: string | null) {
  if (!value) {
    return {
      primary: 'Not started',
      secondary: 'No shift today',
    }
  }

  const date = new Date(value)

  return {
    primary: date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    }),
    secondary: date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  }
}

function formatNowDateTime(now = Date.now()) {
  return formatShiftDateTime(new Date(now).toISOString())
}

export function StaffDashboardPanel() {
  const [totals, setTotals] = useState<StaffDashboardTotals>(emptyTotals)
  const [shiftState, setShiftState] = useState<StaffShiftState>({
    is_on_duty: false,
    can_start_shift: true,
    has_shift_today: false,
    shift: null,
    today_shift: null,
  })
  const [nowTick, setNowTick] = useState(Date.now())
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingShift, setIsUpdatingShift] = useState(false)
  const [isEndShiftOpen, setIsEndShiftOpen] = useState(false)
  const [endShiftReason, setEndShiftReason] = useState<StaffShiftEndReason>('end_shift')
  const [error, setError] = useState('')

  const displayShift = shiftState.shift ?? shiftState.today_shift
  const canStartShift = shiftState.can_start_shift && !shiftState.is_on_duty

  const sessionLabel = useMemo(
    () => formatShiftSession(displayShift?.started_at, displayShift?.ended_at, nowTick),
    [displayShift?.ended_at, displayShift?.started_at, nowTick]
  )

  const startedDisplay = useMemo(
    () => formatShiftDateTime(displayShift?.started_at),
    [displayShift?.started_at]
  )

  const endingDisplay = useMemo(() => formatNowDateTime(nowTick), [nowTick])

  const selectedEndShift = useMemo(
    () => endShiftOptions.find((option) => option.value === endShiftReason) ?? endShiftOptions[1],
    [endShiftReason]
  )

  const shiftBadgeLabel = isLoading
    ? 'Checking'
    : shiftState.is_on_duty
      ? 'Clocked in'
      : shiftState.has_shift_today
        ? 'Shift recorded'
        : 'Off duty'

  const shiftDescription = shiftState.is_on_duty
    ? 'Your staff actions are enabled for this active shift.'
    : shiftState.has_shift_today
      ? 'Your shift for today is already recorded.'
      : 'Start your shift before claiming or updating requests.'

  const loadDashboard = useCallback(async () => {
    try {
      const [overviewResponse, shiftResponse] = await Promise.all([
        getStaffOverview({
          view: 'mine',
          per_page: 1,
        }),
        getCurrentStaffShift(),
      ])

      setTotals(overviewResponse.data.totals)
      setShiftState(shiftResponse.data)
      setError('')
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to load staff dashboard.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadDashboardRef = useRef(loadDashboard)

  useEffect(() => {
    loadDashboardRef.current = loadDashboard
  }, [loadDashboard])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTick(Date.now())
    }, 30000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const channel = echo.channel('officeflow.staff')

    channel.listen('.ticket.changed', () => {
      void loadDashboardRef.current()
    })

    channel.listen('.appointment.changed', () => {
      void loadDashboardRef.current()
    })

    return () => {
      channel.stopListening('.ticket.changed')
      channel.stopListening('.appointment.changed')
      echo.leaveChannel('officeflow.staff')
    }
  }, [])

  async function handleStartShift() {
    if (!canStartShift) return

    setIsUpdatingShift(true)
    setError('')

    try {
      const response = await startStaffShift()
      setShiftState(response.data)
      await loadDashboard()
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to start shift.'))
    } finally {
      setIsUpdatingShift(false)
    }
  }

  function handleOpenEndShift() {
    setNowTick(Date.now())
    setEndShiftReason('end_shift')
    setIsEndShiftOpen(true)
  }

  async function handleEndShift() {
    setIsUpdatingShift(true)
    setError('')

    try {
      const response = await endStaffShift(endShiftReason)
      setShiftState(response.data)
      setIsEndShiftOpen(false)
      setEndShiftReason('end_shift')
      await loadDashboard()
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to end shift.'))
    } finally {
      setIsUpdatingShift(false)
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Inbox}
          label="Queuing"
          value={totals.queueTotal}
          description={`${totals.unassignedTickets} ticket, ${totals.pendingAppointments} appointments waiting.`}
          tone="violet"
        />
        <StatCard
          icon={ListChecks}
          label="My work"
          value={totals.myWorkTotal}
          description="Tickets and appointments assigned to you."
          tone="sky"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved today"
          value={totals.resolvedToday}
          description="Completed by staff today."
          tone="emerald"
        />
        <StatCard
          icon={Database}
          label="All records"
          value={totals.allRecords}
          description="Tickets and appointments."
          tone="slate"
        />
      </section>

      <StaffProductivityChart />

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <ListChecks className="size-4" />
            </div>

            <div>
              <h2 className="font-semibold">Assigned work split</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Current tickets and appointments assigned to your staff account.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <WorkloadBox label="Tickets" value={totals.myActiveTickets} tone="sky" />
            <WorkloadBox label="Appointments" value={totals.myActiveAppointments} tone="emerald" />
          </div>
        </article>

        <article className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                  shiftState.is_on_duty
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-700'
                )}
              >
                <Clock3 className="size-4" />
              </div>

              <div>
                <h2 className="font-semibold">Shift status</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{shiftDescription}</p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end sm:text-right">
              <div
                className={cn(
                  'inline-flex h-8 items-center gap-2 rounded-full px-3 text-sm font-medium',
                  shiftState.is_on_duty
                    ? 'bg-emerald-100 text-emerald-700'
                    : shiftState.has_shift_today
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-700'
                )}
              >
                <span
                  className={cn(
                    'size-2 rounded-full',
                    shiftState.is_on_duty
                      ? 'bg-emerald-500'
                      : shiftState.has_shift_today
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                  )}
                />
                {shiftBadgeLabel}
              </div>

              {shiftState.is_on_duty ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="cursor-pointer gap-2"
                  disabled={isUpdatingShift}
                  onClick={handleOpenEndShift}
                >
                  <Power className="size-4" />
                  End shift
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="cursor-pointer gap-2"
                  disabled={isLoading || isUpdatingShift || !canStartShift}
                  onClick={handleStartShift}
                >
                  <Power className="size-4" />
                  Start shift
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <ShiftMetric
              label="Shift status"
              value={
                shiftState.is_on_duty
                  ? 'On duty'
                  : shiftState.has_shift_today
                    ? 'Completed today'
                    : 'Off duty'
              }
              tone={
                shiftState.is_on_duty
                  ? 'emerald'
                  : shiftState.has_shift_today
                    ? 'amber'
                    : 'slate'
              }
            />
            <ShiftMetric
              label="Started at"
              value={startedDisplay.primary}
              helper={startedDisplay.secondary}
              tone="sky"
            />
            <ShiftMetric label="Session" value={sessionLabel} tone="violet" />
          </div>
        </article>
      </section>

      <Dialog open={isEndShiftOpen} onOpenChange={setIsEndShiftOpen}>
        <DialogContent className="!max-w-md overflow-hidden p-0">
          <div className="border-b bg-amber-50 px-5 py-4">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700">
                  <AlertTriangle className="size-4" />
                </div>

                <div>
                  <DialogTitle className="text-base">End your shift?</DialogTitle>
                  <DialogDescription className="mt-0.5 text-sm">
                    Choose how this shift should be closed for today.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="space-y-3 px-5 py-4">
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {endShiftOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEndShiftReason(option.value)}
                  className={cn(
                    'cursor-pointer rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                    endShiftReason === option.value
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              {selectedEndShift.description}
            </p>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              Assigned requests will stay assigned to you. Status updates and staff replies are paused until your next shift.
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
             <ShiftInfoCard
              label="Started at"
              value={startedDisplay.primary}
              secondary={startedDisplay.secondary}
            />

            <ShiftInfoCard
              label="Ending at"
              value={endingDisplay.primary}
              secondary={endingDisplay.secondary}
            />

            <ShiftInfoCard
              label="Current session"
              value={formatShiftSession(shiftState.shift?.started_at, null, nowTick)}
            />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t bg-slate-50 px-5 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer bg-white"
              disabled={isUpdatingShift}
              onClick={() => setIsEndShiftOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="cursor-pointer"
              disabled={isUpdatingShift}
              onClick={handleEndShift}
            >
              Confirm {selectedEndShift.label}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: number
  description: string
  tone: 'violet' | 'sky' | 'emerald' | 'slate'
}) {
  const styles = {
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    slate: 'border-slate-200 bg-white text-slate-700',
  }

  return (
    <article className={cn('rounded-lg border p-4 shadow-sm', styles[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-700">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
          <p className="mt-2 text-sm">{description}</p>
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  )
}

function ShiftMetric({
  label,
  value,
  helper,
  tone,
}: {
  label: string
  value: string
  helper?: string
  tone: 'emerald' | 'sky' | 'violet' | 'slate' | 'amber'
}) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    violet: 'bg-violet-50 text-violet-700',
    slate: 'bg-slate-50 text-slate-700',
    amber: 'bg-amber-50 text-amber-700',
  }

  return (
    <div className={cn('rounded-lg border p-3', styles[tone])}>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 truncate font-semibold">{value}</p>
      {helper ? <p className="mt-1 truncate text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  )
}

function WorkloadBox({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'sky' | 'emerald'
}) {
  const styles = {
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return (
    <div className={cn('rounded-lg border p-4', styles[tone])}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function ShiftInfoCard({
  label,
  value,
  secondary,
}: {
  label: string
  value: string
  secondary?: string
}) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-950">{value}</p>
      {secondary ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{secondary}</p>
      ) : null}
    </div>
  )
}