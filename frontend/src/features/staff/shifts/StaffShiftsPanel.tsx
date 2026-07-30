import {
  AlertTriangle,
  Clock3,
  Power,
  RefreshCw,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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
  startStaffShift,
  type StaffShiftEndReason,
  type StaffShiftState,
} from '@/features/staff/staff-shift-api'
import { cn } from '@/lib/utils'

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

function formatDateTime(value?: string | null) {
  if (!value) return 'Not recorded'

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatNowDateTime() {
  return formatDateTime(new Date().toISOString())
}

function getElapsed(startedAt?: string | null, endedAt?: string | null) {
  if (!startedAt) return 'No active session'

  const end = endedAt ? new Date(endedAt).getTime() : Date.now()
  const diff = end - new Date(startedAt).getTime()
  const minutes = Math.max(Math.floor(diff / 60000), 0)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours <= 0) return `${remainingMinutes}m`
  return `${hours}h ${remainingMinutes}m`
}

export function StaffShiftsPanel() {
  const [shiftState, setShiftState] = useState<StaffShiftState>({
    is_on_duty: false,
    can_start_shift: true,
    has_shift_today: false,
    shift: null,
    today_shift: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false)
  const [endShiftReason, setEndShiftReason] = useState<StaffShiftEndReason>('end_shift')
  const [error, setError] = useState('')

  const displayShift = shiftState.shift ?? shiftState.today_shift
  const canStartShift = shiftState.can_start_shift && !shiftState.is_on_duty

  const elapsedLabel = useMemo(
    () => getElapsed(displayShift?.started_at, displayShift?.ended_at),
    [displayShift?.ended_at, displayShift?.started_at]
  )

  const selectedEndShift = useMemo(
    () => endShiftOptions.find((option) => option.value === endShiftReason) ?? endShiftOptions[1],
    [endShiftReason]
  )

  const statusLabel = isLoading
    ? 'Checking...'
    : shiftState.is_on_duty
      ? 'On duty'
      : shiftState.has_shift_today
        ? 'Shift recorded'
        : 'Off duty'

  const statusDescription = shiftState.is_on_duty
    ? 'You can claim requests, update statuses, and send staff replies.'
    : shiftState.has_shift_today
      ? 'Your staff shift for today is already closed.'
      : 'Start your shift before claiming requests or updating assigned work.'

  async function loadShift() {
    setIsLoading(true)

    try {
      const response = await getCurrentStaffShift()
      setShiftState(response.data)
      setError('')
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to load shift status.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadShift()
  }, [])

  async function handleStartShift() {
    if (!canStartShift) return

    setIsUpdating(true)
    setError('')

    try {
      const response = await startStaffShift()
      setShiftState(response.data)
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to start shift.'))
    } finally {
      setIsUpdating(false)
    }
  }

  function handleOpenEndShift() {
    setEndShiftReason('end_shift')
    setIsEndDialogOpen(true)
  }

  async function handleEndShift() {
    setIsUpdating(true)
    setError('')

    try {
      const response = await endStaffShift(endShiftReason)
      setShiftState(response.data)
      setIsEndDialogOpen(false)
      setEndShiftReason('end_shift')
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to end shift.'))
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
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
              <p className="font-medium">Current duty status</p>
              <p className="mt-7 text-3xl font-semibold">{statusLabel}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {shiftState.is_on_duty ? `${elapsedLabel} active` : statusDescription}
              </p>
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
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold">Shift controls</h2>
              <p className="text-sm text-muted-foreground">{statusDescription}</p>
            </div>

            {shiftState.is_on_duty ? (
              <Button
                type="button"
                variant="destructive"
                className="cursor-pointer gap-2"
                disabled={isUpdating}
                onClick={handleOpenEndShift}
              >
                <Power className="size-4" />
                End shift
              </Button>
            ) : (
              <Button
                type="button"
                className="cursor-pointer gap-2"
                disabled={isLoading || isUpdating || !canStartShift}
                onClick={handleStartShift}
              >
                <Power className="size-4" />
                Start shift
              </Button>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoCard
              icon={Clock3}
              label="Started at"
              value={formatDateTime(displayShift?.started_at)}
            />
            <InfoCard
              icon={RefreshCw}
              label="Ended at"
              value={shiftState.is_on_duty ? 'Active now' : formatDateTime(displayShift?.ended_at)}
            />
            <InfoCard
              icon={ShieldCheck}
              label="Queue access"
              value={shiftState.is_on_duty ? 'Claiming enabled' : 'Claiming paused'}
            />
            <InfoCard
              icon={AlertTriangle}
              label="Status updates"
              value={shiftState.is_on_duty ? 'Replies enabled' : 'Read-only mode'}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Shift rules</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <RuleCard title="Start shift" text="Only one staff shift can be recorded per day." />
          <RuleCard title="During shift" text="Claim requests, update statuses, and send replies." />
          <RuleCard title="End shift" text="Once ended, the shift cannot be restarted again today." />
        </div>
      </div>

      <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
        <DialogContent className="!max-w-md overflow-hidden p-0">
          <div className="border-b bg-amber-50 px-5 py-4">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700">
                  <AlertTriangle className="size-5" />
                </div>

                <div>
                  <DialogTitle>End your shift?</DialogTitle>
                  <DialogDescription className="mt-1">
                    Choose how this shift should be closed for today.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="grid grid-cols-2 gap-1 rounded-lg border bg-slate-50 p-1">
              {endShiftOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEndShiftReason(option.value)}
                  className={cn(
                    'cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
              <ShiftInfoCard label="Started at" value={formatDateTime(shiftState.shift?.started_at)} />
              <ShiftInfoCard label="Ending at" value={formatNowDateTime()} />
              <ShiftInfoCard label="Current session" value={getElapsed(shiftState.shift?.started_at)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t bg-slate-50 px-5 py-3">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer bg-white"
              onClick={() => setIsEndDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
              onClick={handleEndShift}
              disabled={isUpdating}
            >
              Confirm {selectedEndShift.label}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <Icon className="size-4 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}

function RuleCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  )
}

function ShiftInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}