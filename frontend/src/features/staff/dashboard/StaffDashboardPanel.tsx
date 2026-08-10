import {
  CheckCircle2,
  Database,
  Inbox,
  ListChecks,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { getApiErrorMessage } from '@/features/auth/auth-api'
import { StaffProductivityChart } from '@/features/staff/dashboard/StaffProductivityChart'
import { getStaffOverview, type StaffDashboardTotals } from '@/features/staff/staff-dashboard-api'
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

export function StaffDashboardPanel() {
  const [totals, setTotals] = useState<StaffDashboardTotals>(emptyTotals)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setIsLoading(true)

    try {
      const overviewResponse = await getStaffOverview({
        view: 'mine',
        per_page: 1,
      })

      setTotals(overviewResponse.data.totals)
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
    const channel = echo.channel('officeflow.staff')

    channel.listen('.ticket.changed', () => {
      void loadDashboardRef.current({ silent: true })
    })

    channel.listen('.appointment.changed', () => {
      void loadDashboardRef.current({ silent: true })
    })

    return () => {
      channel.stopListening('.ticket.changed')
      channel.stopListening('.appointment.changed')
      echo.leaveChannel('officeflow.staff')
    }
  }, [])

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
          isLoading={isLoading}
        />

        <StatCard
          icon={ListChecks}
          label="My work"
          value={totals.myWorkTotal}
          description={`${totals.myActiveTickets} tickets, ${totals.myActiveAppointments} appointments assigned to you.`}
          tone="sky"
          isLoading={isLoading}
        />

        <StatCard
          icon={CheckCircle2}
          label="Resolved today"
          value={totals.resolvedToday}
          description="Completed by staff today."
          tone="emerald"
          isLoading={isLoading}
        />

        <StatCard
          icon={Database}
          label="All records"
          value={totals.allRecords}
          description="Tickets and appointments."
          tone="slate"
          isLoading={isLoading}
        />
      </section>

      <StaffProductivityChart />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
  isLoading,
}: {
  icon: LucideIcon
  label: string
  value: number
  description: string
  tone: 'violet' | 'sky' | 'emerald' | 'slate'
  isLoading: boolean
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
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {isLoading ? '...' : value}
          </p>
          <p className="mt-2 text-sm">{description}</p>
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  )
}