import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { BarChart3, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar } from 'react-chartjs-2'

import {
  getStaffProductivity,
  type StaffProductivity,
  type StaffProductivityRange,
} from '@/features/staff/analytics/staff-analytics-api'
import { cn } from '@/lib/utils'

ChartJS.register(BarElement, CategoryScale, Legend, LinearScale, Tooltip)

const dayOptions: StaffProductivityRange[] = [7, 14, 30]

export function StaffProductivityChart() {
  const [days, setDays] = useState<StaffProductivityRange>(7)
  const [productivity, setProductivity] = useState<StaffProductivity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProductivity = useCallback(async () => {
    try {
      setError('')
      const data = await getStaffProductivity(days)
      setProductivity(data)
    } catch {
      setError('Unable to load productivity trend.')
    } finally {
      setIsLoading(false)
    }
  }, [days])

  useEffect(() => {
    setIsLoading(true)
    void loadProductivity()
  }, [loadProductivity])

  const chartData = useMemo(
    () => ({
      labels: productivity?.labels ?? [],
      datasets: [
        {
          label: 'Resolved tickets',
          data: productivity?.tickets_resolved ?? [],
          backgroundColor: '#bae6fd',
          borderRadius: 8,
          maxBarThickness: 34,
        },
        {
          label: 'Completed appointments',
          data: productivity?.appointments_completed ?? [],
          backgroundColor: '#bbf7d0',
          borderRadius: 8,
          maxBarThickness: 34,
        },
      ],
    }),
    [productivity]
  )

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
  }

  return (
    <section className="rounded-lg border bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b px-5 py-4 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700">
            <BarChart3 className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold">My productivity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Resolved tickets and completed appointments assigned to you.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dayOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDays(option)}
              className={cn(
                'h-8 cursor-pointer rounded-md border px-3 text-xs font-medium transition-colors',
                days === option
                  ? 'border-sky-300 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-muted-foreground hover:bg-slate-50'
              )}
            >
              {option} days
            </button>
          ))}

          <button
            type="button"
            onClick={() => void loadProductivity()}
            className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border bg-white px-3 text-xs font-medium text-muted-foreground shadow-xs hover:bg-slate-50"
          >
            <RefreshCw className={cn('size-3.5', isLoading && 'animate-spin')} />
            Sync
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-5 xl:grid-cols-[1fr_240px]">
        <div className="h-64 rounded-lg border bg-slate-50/60 p-4">
          <Bar data={chartData} options={chartOptions} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <Summary label="Tickets resolved" value={productivity?.totals.tickets_resolved ?? 0} tone="sky" />
          <Summary label="Appointments completed" value={productivity?.totals.appointments_completed ?? 0} tone="emerald" />
          <Summary label="Total completed" value={productivity?.totals.completed ?? 0} tone="violet" />
        </div>
      </div>

      {error ? (
        <div className="border-t px-5 py-3 text-sm text-destructive">{error}</div>
      ) : null}
    </section>
  )
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'sky' | 'emerald' | 'violet'
}) {
  const styles = {
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
  }

  return (
    <div className={cn('rounded-lg border p-4', styles[tone])}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}