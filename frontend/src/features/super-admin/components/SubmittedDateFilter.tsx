import { CalendarRange, ChevronDown, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type DatePreset =
  | 'all'
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'overdue'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_60_days'

const PRESET_LABELS: Record<DatePreset, string> = {
  all: 'All',
  today: 'Today',
  this_week: 'This week',
  this_month: 'This month',
  overdue: 'Overdue',
  last_7_days: 'Last 7 days',
  last_30_days: 'Last 30 days',
  last_60_days: 'Last 60 days',
}

function toIsoDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getDay()
  // treat Monday as the first day of the week
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  return result
}

/**
 * Turns a preset into a concrete { from, to } ISO date range.
 * "overdue" intentionally leaves `from` empty and caps `to` at yesterday -
 * pair it with a non-completed status filter on the caller's side to get a
 * true "still pending and past its date" view.
 */
export function getPresetRange(preset: DatePreset): { from: string; to: string } {
  const today = new Date()
  const todayIso = toIsoDate(today)

  switch (preset) {
    case 'today':
      return { from: todayIso, to: todayIso }
    case 'this_week': {
      const start = startOfWeek(today)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return { from: toIsoDate(start), to: toIsoDate(end) }
    }
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return { from: toIsoDate(start), to: toIsoDate(end) }
    }
    case 'overdue': {
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      return { from: '', to: toIsoDate(yesterday) }
    }
    case 'last_7_days':
    case 'last_30_days':
    case 'last_60_days': {
      // "Last N days" includes today, so a 7-day window spans today minus 6
      // through today - matches how most timesheet tools count it.
      const spans: Record<string, number> = {
        last_7_days: 7,
        last_30_days: 30,
        last_60_days: 60,
      }
      const start = new Date(today)
      start.setDate(today.getDate() - (spans[preset] - 1))
      return { from: toIsoDate(start), to: todayIso }
    }
    case 'all':
    default:
      return { from: '', to: '' }
  }
}

interface SubmittedDateFilterProps {
  /** Which presets to render, in order. Defaults to all/today/this_week/overdue. */
  presets?: DatePreset[]
  activePreset: DatePreset | 'custom'
  dateFrom: string
  dateTo: string
  onPresetChange: (preset: DatePreset) => void
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onClear: () => void
  /** Optional tooltip clarifying what "Overdue" means for this resource. */
  overdueHint?: string
}

const DEFAULT_PRESETS: DatePreset[] = ['all', 'today', 'this_week', 'overdue']

export function SubmittedDateFilter({
  presets = DEFAULT_PRESETS,
  activePreset,
  dateFrom,
  dateTo,
  onPresetChange,
  onDateFromChange,
  onDateToChange,
  onClear,
  overdueHint,
}: SubmittedDateFilterProps) {
  const [showCustomRange, setShowCustomRange] = useState(activePreset === 'custom')

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="inline-flex flex-wrap items-center gap-1 rounded-md border bg-white p-1">
        {presets.map((preset) => (
          <Button
            key={preset}
            type="button"
            size="sm"
            variant="ghost"
            title={preset === 'overdue' ? overdueHint : undefined}
            className={cn(
              'h-7 cursor-pointer rounded-sm px-2.5 text-xs font-medium text-muted-foreground hover:bg-slate-100 hover:text-foreground',
              activePreset === preset &&
                'bg-slate-900 text-white hover:bg-slate-900 hover:text-white'
            )}
            onClick={() => {
              setShowCustomRange(false)
              onPresetChange(preset)
            }}
          >
            {PRESET_LABELS[preset]}
          </Button>
        ))}

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn(
            'h-7 cursor-pointer gap-1 rounded-sm px-2.5 text-xs font-medium text-muted-foreground hover:bg-slate-100 hover:text-foreground',
            activePreset === 'custom' &&
              'bg-slate-900 text-white hover:bg-slate-900 hover:text-white'
          )}
          onClick={() => setShowCustomRange((current) => !current)}
        >
          <CalendarRange className="size-3.5" />
          Custom
          <ChevronDown
            className={cn(
              'size-3.5 transition-transform',
              showCustomRange && 'rotate-180'
            )}
          />
        </Button>
      </div>

      {showCustomRange ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-slate-50 p-2">
          <Input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(event) => onDateFromChange(event.target.value)}
            className="h-8 w-auto text-xs"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => onDateToChange(event.target.value)}
            className="h-8 w-auto text-xs"
          />
          {dateFrom || dateTo ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 cursor-pointer gap-1 px-2 text-xs text-muted-foreground"
              onClick={onClear}
            >
              <X className="size-3.5" />
              Clear
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}