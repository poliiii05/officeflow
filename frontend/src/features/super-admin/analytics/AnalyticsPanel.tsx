import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import {
  BarChart3,
  CalendarCheck,
  RefreshCw,
  TicketCheck,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Doughnut, Line } from 'react-chartjs-2'

import {
  getSuperAdminAnalytics,
  type SuperAdminAnalytics,
} from '@/features/super-admin/super-admin-api'
import { cn } from '@/lib/utils'

ChartJS.register(
  ArcElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
)

const dayOptions = [7, 14, 30] as const

export function AnalyticsPanel() {
  const [analytics, setAnalytics] = useState<SuperAdminAnalytics | null>(null)
  const [days, setDays] = useState<(typeof dayOptions)[number]>(7)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAnalytics = useCallback(async () => {
    try {
      setError('')
      const data = await getSuperAdminAnalytics(days)
      setAnalytics(data)
    } catch {
      setError('Unable to load analytics.')
    } finally {
      setIsLoading(false)
    }
  }, [days])

  useEffect(() => {
    setIsLoading(true)
    void loadAnalytics()
  }, [loadAnalytics])

  const serviceTrendData = useMemo(
    () => ({
      labels: analytics?.trends.map((item) => item.label) ?? [],
      datasets: [
        {
          label: 'Tickets',
          data: analytics?.trends.map((item) => item.tickets) ?? [],
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.14)',
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Appointments',
          data: analytics?.trends.map((item) => item.appointments) ?? [],
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Completed',
          data: analytics?.trends.map((item) => item.completed) ?? [],
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.09)',
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    }),
    [analytics]
  )

  const ticketStatusData = useMemo(
    () => ({
      labels: analytics?.ticket_statuses.map((item) => item.label) ?? [],
      datasets: [
        {
          data: analytics?.ticket_statuses.map((item) => item.count) ?? [],
          backgroundColor: ['#bae6fd', '#fde68a', '#bbf7d0', '#e2e8f0'],
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    }),
    [analytics]
  )

  const appointmentStatusData = useMemo(
    () => ({
      labels: analytics?.appointment_statuses.map((item) => item.label) ?? [],
      datasets: [
        {
          data: analytics?.appointment_statuses.map((item) => item.count) ?? [],
          backgroundColor: ['#fde68a', '#bbf7d0', '#ddd6fe', '#e2e8f0'],
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    }),
    [analytics]
  )

  const lineOptions: ChartOptions<'line'> = {
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

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '66%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 11 },
        },
      },
    },
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <section className="rounded-lg border bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b px-5 py-4 lg:flex-row lg:items-start">
          <div className="flex items-start gap-3">
            <IconBox icon={BarChart3} tone="sky" />

            <div>
              <h2 className="font-semibold">Service analytics</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Compact performance view for service volume and request status.
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
                  'h-8 rounded-md border px-3 text-xs font-medium transition-colors',
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
              onClick={() => void loadAnalytics()}
              className="inline-flex h-8 items-center gap-2 rounded-md border bg-white px-3 text-xs font-medium text-muted-foreground shadow-xs hover:bg-slate-50"
            >
              <RefreshCw className={cn('size-3.5', isLoading && 'animate-spin')} />
              Sync
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-5 xl:grid-cols-[1.45fr_0.8fr]">
          <div className="rounded-lg border bg-slate-50/60 p-4">
            <div className="mb-3">
              <h3 className="font-medium">Service volume trend</h3>
              <p className="text-sm text-muted-foreground">
                Tickets, appointments, and completed work over time.
              </p>
            </div>

            <div className="h-72">
              <Line data={serviceTrendData} options={lineOptions} />
            </div>
          </div>

          <div className="grid gap-4">
            <MiniChartCard
              icon={TicketCheck}
              title="Ticket status"
              description="Ticket records by current status."
              tone="sky"
            >
              <div className="h-32">
                <Doughnut data={ticketStatusData} options={doughnutOptions} />
              </div>
            </MiniChartCard>

            <MiniChartCard
              icon={CalendarCheck}
              title="Appointment status"
              description="Appointment records by current status."
              tone="emerald"
            >
              <div className="h-32">
                <Doughnut data={appointmentStatusData} options={doughnutOptions} />
              </div>
            </MiniChartCard>
          </div>
        </div>
      </section>

      {isLoading && !analytics ? (
        <div className="rounded-lg border bg-white px-4 py-6 text-center text-sm text-muted-foreground shadow-sm">
          Loading analytics...
        </div>
      ) : null}
    </div>
  )
}

function MiniChartCard({
  icon,
  title,
  description,
  tone,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  tone: 'sky' | 'emerald'
  children: ReactNode
}) {
  return (
    <article className="rounded-lg border bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-start gap-3">
        <IconBox icon={icon} tone={tone} size="sm" />

        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {children}
    </article>
  )
}

function IconBox({
  icon: Icon,
  tone,
  size = 'md',
}: {
  icon: LucideIcon
  tone: 'sky' | 'emerald'
  size?: 'sm' | 'md'
}) {
  const toneStyles = {
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg border',
        size === 'sm' ? 'size-9' : 'size-11',
        toneStyles[tone]
      )}
    >
      <Icon className={size === 'sm' ? 'size-4' : 'size-5'} />
    </div>
  )
}