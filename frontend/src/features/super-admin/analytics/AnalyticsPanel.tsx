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
import { BarChart3, CalendarCheck, TicketCheck, type LucideIcon } from 'lucide-react'
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

const rangeOptions = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 365, label: '12 months' },
] as const

type AnalyticsRange = (typeof rangeOptions)[number]['value']

export function AnalyticsPanel() {
  const [analytics, setAnalytics] = useState<SuperAdminAnalytics | null>(null)
  const [range, setRange] = useState<AnalyticsRange>(7)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAnalytics = useCallback(async () => {
    try {
      setError('')
      const data = await getSuperAdminAnalytics(range)
      setAnalytics(data)
    } catch {
      setError('Unable to load analytics.')
    } finally {
      setIsLoading(false)
    }
  }, [range])

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

  // Chart.js happily renders an axis with nothing on it, which looks like a
  // broken/empty chart rather than "no data yet". These flags let us swap in
  // an explicit empty state instead.
  const hasTrendData = useMemo(
    () =>
      (analytics?.trends ?? []).some(
        (item) => item.tickets > 0 || item.appointments > 0 || item.completed > 0
      ),
    [analytics]
  )

  const hasTicketStatusData = useMemo(
    () => (analytics?.ticket_statuses ?? []).some((item) => item.count > 0),
    [analytics]
  )

  const hasAppointmentStatusData = useMemo(
    () => (analytics?.appointment_statuses ?? []).some((item) => item.count > 0),
    [analytics]
  )

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
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
      x: {
        grid: { display: false },
        ticks: {
          autoSkip: true,
          maxTicksLimit: range === 365 ? 12 : 10,
        },
      },
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

      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
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
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRange(option.value)}
                className={cn(
                  'h-8 cursor-pointer rounded-md border px-3 text-xs font-medium transition-colors',
                  range === option.value
                    ? 'border-sky-300 bg-sky-50 text-sky-700'
                    : 'border-slate-200 bg-white text-muted-foreground hover:bg-slate-50'
                )}
              >
                {option.label}
              </button>
            ))}
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

            <div className="relative h-72">
              {isLoading && !analytics ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Loading analytics...
                </div>
              ) : (
                <>
                  <Line data={serviceTrendData} options={lineOptions} />
                  {hasTrendData ? null : (
                    <EmptyChartOverlay
                      icon={BarChart3}
                      message={`No records yet for the last ${
                        rangeOptions.find((option) => option.value === range)?.label ??
                        'selected range'
                      }.`}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <MiniChartCard
              icon={TicketCheck}
              title="Ticket status"
              description="Ticket records by current status."
              tone="sky"
            >
              <div className="relative h-32">
                <Doughnut data={ticketStatusData} options={doughnutOptions} />
                {hasTicketStatusData ? null : (
                  <EmptyChartOverlay icon={TicketCheck} message="No ticket records yet." compact />
                )}
              </div>
            </MiniChartCard>

            <MiniChartCard
              icon={CalendarCheck}
              title="Appointment status"
              description="Appointment records by current status."
              tone="emerald"
            >
              <div className="relative h-32">
                <Doughnut data={appointmentStatusData} options={doughnutOptions} />
                {hasAppointmentStatusData ? null : (
                  <EmptyChartOverlay
                    icon={CalendarCheck}
                    message="No appointment records yet."
                    compact
                  />
                )}
              </div>
            </MiniChartCard>
          </div>
        </div>
      </section>
    </div>
  )
}

function EmptyChartOverlay({
  icon: Icon,
  message,
  compact = false,
}: {
  icon: LucideIcon
  message: string
  compact?: boolean
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 px-4 text-center">
      <Icon className={cn('text-slate-300', compact ? 'size-6' : 'size-8')} />
      <p className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>{message}</p>
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