import {
  Activity,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Database,
  FileClock,
  Gauge,
  Settings,
  ShieldCheck,
  TicketCheck,
  UserCog,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import {
  getSuperAdminOverview,
  type StaffWorkloadItem,
  type SuperAdminTotals,
} from '@/features/super-admin/super-admin-api'
import { echo } from '@/lib/echo'
import { cn } from '@/lib/utils'

const emptyTotals: SuperAdminTotals = {
  users: 0,
  staff: 0,
  on_duty_staff: 0,
  queue_total: 0,
  unassigned_tickets: 0,
  pending_appointments: 0,
  resolved_today: 0,
  all_tickets: 0,
  all_appointments: 0,
}

function getInitials(name?: string) {
  if (!name) return 'OF'

  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatShiftTime(value: string | null) {
  if (!value) return 'No active shift'

  return `Started ${new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

function getLoadLabel(total: number) {
  if (total >= 8) return 'Heavy'
  if (total >= 4) return 'Moderate'
  if (total > 0) return 'Light'
  return 'No work'
}

function getLoadClass(total: number) {
  if (total >= 8) return 'bg-red-100 text-red-700'
  if (total >= 4) return 'bg-amber-100 text-amber-700'
  if (total > 0) return 'bg-sky-100 text-sky-700'

  return 'bg-slate-200 text-slate-700'
}

export function SuperAdminOverviewPanel() {
  const [totals, setTotals] = useState<SuperAdminTotals>(emptyTotals)
  const [staffWorkload, setStaffWorkload] = useState<StaffWorkloadItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOverview = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) setIsLoading(true)

      try {
        const response = await getSuperAdminOverview()

        setTotals(response.data.totals)
        setStaffWorkload(response.data.staff_workload)
        setError('')
      } catch (error) {
        setError(getApiErrorMessage(error, 'Unable to load the dashboard.'))
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const loadOverviewRef = useRef(loadOverview)

  useEffect(() => {
    loadOverviewRef.current = loadOverview
  }, [loadOverview])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  useEffect(() => {
    const channel = echo.channel('officeflow.staff')

    channel.listen('.ticket.changed', () => {
      void loadOverviewRef.current({ silent: true })
    })

    channel.listen('.appointment.changed', () => {
      void loadOverviewRef.current({ silent: true })
    })

    const fallbackInterval = window.setInterval(() => {
      void loadOverviewRef.current({ silent: true })
    }, 60000)

    return () => {
      channel.stopListening('.ticket.changed')
      channel.stopListening('.appointment.changed')
      echo.leaveChannel('officeflow.staff')
      window.clearInterval(fallbackInterval)
    }
  }, [])

  const activeAssigned = useMemo(
    () => staffWorkload.reduce((total, staff) => total + staff.active_total, 0),
    [staffWorkload]
  )

  const onDutyStaffWorkload = useMemo(
    () => staffWorkload.filter((staff) => staff.is_on_duty),
    [staffWorkload]
  )

  const offDutyStaff = Math.max(totals.staff - totals.on_duty_staff, 0)
  const allRecords = totals.all_tickets + totals.all_appointments
  const queueHasPressure = totals.queue_total > 0
  const hasCoverage = totals.on_duty_staff > 0

  const summaryCards = [
    {
      label: 'Queue waiting',
      value: totals.queue_total,
      description: `${totals.unassigned_tickets} tickets, ${totals.pending_appointments} appointments`,
      icon: ClipboardList,
      className: 'border-violet-200 bg-violet-50/70 text-violet-700',
    },
    {
      label: 'Staff coverage',
      value: `${totals.on_duty_staff}/${totals.staff}`,
      description: `${offDutyStaff} off duty`,
      icon: UserRoundCheck,
      className: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    },
    {
      label: 'Active assigned',
      value: activeAssigned,
      description: 'Requests currently owned by staff',
      icon: Gauge,
      className: 'border-sky-200 bg-sky-50/70 text-sky-700',
    },
    {
      label: 'Completed today',
      value: totals.resolved_today,
      description: 'Resolved tickets and completed appointments',
      icon: CheckCircle2,
      className: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    },
    {
      label: 'All records',
      value: allRecords,
      description: `${totals.all_tickets} tickets, ${totals.all_appointments} appointments`,
      icon: Database,
      className: 'border-slate-200 bg-white text-slate-700',
    },
  ]

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((stat) => (
          <SummaryCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <Users className="size-5" />
              </div>

              <div>
                <h2 className="font-semibold">On-duty staff workload</h2>
                <p className="text-sm text-muted-foreground">
                  Active tickets and appointments for staff currently on shift.
                </p>
              </div>
            </div>

            <Link
              to="/super-admin/staff"
              className="inline-flex h-10 w-fit items-center justify-center rounded-lg border bg-white px-4 text-sm font-medium shadow-sm hover:bg-slate-50"
            >
              View staff
            </Link>
          </div>

          <div className="hidden grid-cols-[minmax(0,1.45fr)_minmax(82px,0.5fr)_64px_64px_minmax(82px,0.55fr)] gap-3 border-b bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-muted-foreground md:grid">
            <span>Staff account</span>
            <span className="text-center">Shift</span>
            <span className="text-center">Tickets</span>
            <span className="text-center">Appts</span>
            <span className="text-center">Load</span>
          </div>

          {isLoading ? (
            <div className="px-5 py-8 text-sm text-muted-foreground">Loading staff...</div>
          ) : onDutyStaffWorkload.length ? (
            <div className="divide-y">
              {onDutyStaffWorkload.slice(0, 5).map((staff) => (
                <StaffWorkloadRow key={staff.id} staff={staff} />
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-sm text-muted-foreground">
              No staff currently on duty.
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-violet-200 bg-violet-50/60 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <Activity className="size-5" />
              </div>

              <div>
                <h2 className="font-semibold">Operations snapshot</h2>
                <p className="text-sm text-muted-foreground">Current desk pressure and coverage.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <SnapshotRow label="Queue waiting" value={totals.queue_total} />
              <SnapshotRow label="Active assigned" value={activeAssigned} />
              <SnapshotRow label="On-duty staff" value={totals.on_duty_staff} />
              <SnapshotRow label="Registered users" value={totals.users} />
              <SnapshotRow label="Total staff" value={totals.staff} />
            </div>
          </section>

          <section className="rounded-lg border border-sky-200 bg-sky-50/60 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <ClipboardList className="size-5" />
              </div>

              <div>
                <h2 className="font-semibold">Queue mix</h2>
                <p className="text-sm text-muted-foreground">Unclaimed requests by type.</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniMetric label="Tickets" value={totals.unassigned_tickets} />
              <MiniMetric label="Appointments" value={totals.pending_appointments} />
            </div>
          </section>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">Control center</h2>
              <p className="text-sm text-muted-foreground">
                Access people, queue monitoring, audit history, reports, and system controls.
              </p>
            </div>
          </div>

          <Badge
            variant="secondary"
            className={cn(
              'w-fit border-0',
              queueHasPressure
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            )}
          >
            {queueHasPressure ? 'Queue needs attention' : 'Queue stable'}
          </Badge>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-5">
          <ControlLink
            to="/super-admin/users"
            icon={UserCog}
            title="Users"
            description={`${totals.users} registered accounts`}
          />
          <ControlLink
            to="/super-admin/queue"
            icon={TicketCheck}
            title="Queue Monitor"
            description={`${totals.queue_total} waiting requests`}
          />
          <ControlLink
            to="/super-admin/audit-logs"
            icon={FileClock}
            title="Audit Logs"
            description="Review role and system activity"
          />
          <ControlLink
            to="/super-admin/analytics"
            icon={BarChart3}
            title="Reports"
            description="View service volume trends"
          />
          <ControlLink
            to="/super-admin/settings"
            icon={Settings}
            title="System Settings"
            description="Manage availability and workspace rules"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <HealthCard
          title="Queue status"
          value={queueHasPressure ? 'Active queue' : 'Clear'}
          description={
            queueHasPressure
              ? 'There are requests waiting for staff action.'
              : 'No unclaimed requests are waiting right now.'
          }
          tone={queueHasPressure ? 'amber' : 'emerald'}
        />

        <HealthCard
          title="Coverage"
          value={hasCoverage ? 'Covered' : 'No active staff'}
          description={
            hasCoverage
              ? `${totals.on_duty_staff} staff currently on duty.`
              : 'No staff account is currently checked in.'
          }
          tone={hasCoverage ? 'emerald' : 'amber'}
        />

        <HealthCard
          title="Records"
          value={String(allRecords)}
          description="Total ticket and appointment records in the system."
          tone="sky"
        />
      </section>
    </section>
  )
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  className,
}: {
  label: string
  value: string | number
  description: string
  icon: LucideIcon
  className: string
}) {
  return (
    <article className={cn('rounded-lg border p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="mt-7 text-3xl font-semibold text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/75">
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  )
}

function StaffWorkloadRow({ staff }: { staff: StaffWorkloadItem }) {
  return (
    <article className="grid grid-cols-2 gap-x-3 gap-y-4 px-4 py-4 hover:bg-slate-50 md:grid-cols-[minmax(0,1.45fr)_minmax(82px,0.5fr)_64px_64px_minmax(82px,0.55fr)] md:items-center md:px-5">
      <div className="col-span-2 flex min-w-0 gap-3 md:col-span-1">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate font-medium">{staff.name}</p>
            <Badge variant="secondary" className="shrink-0 border-0 bg-slate-100 text-slate-700">
              Staff
            </Badge>
          </div>

          <p className="mt-1 truncate text-sm text-muted-foreground">{staff.email}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {formatShiftTime(staff.shift_started_at)}
          </p>
        </div>
      </div>

      <WorkloadCell label="Shift">
        <Badge
          variant="secondary"
          className="h-7 w-full justify-center border-0 bg-emerald-100 text-emerald-700"
        >
          On duty
        </Badge>
      </WorkloadCell>

      <WorkloadCell label="Tickets">
        <span className="text-lg font-semibold text-slate-950">{staff.active_tickets}</span>
      </WorkloadCell>

      <WorkloadCell label="Appointments">
        <span className="text-lg font-semibold text-slate-950">{staff.active_appointments}</span>
      </WorkloadCell>

      <WorkloadCell label="Load">
        <Badge
          variant="secondary"
          className={cn(
            'h-7 w-full justify-center whitespace-nowrap border-0 text-xs',
            getLoadClass(staff.active_total)
          )}
        >
          {getLoadLabel(staff.active_total)}
        </Badge>
      </WorkloadCell>
    </article>
  )
}

function WorkloadCell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 text-center">
      <p className="mb-1 text-xs font-medium uppercase text-muted-foreground md:hidden">
        {label}
      </p>
      {children}
    </div>
  )
}

function SnapshotRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function ControlLink({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <Link
      to={to}
      className="rounded-lg border bg-white p-4 transition-colors hover:border-primary/40 hover:bg-slate-50"
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        <Icon className="size-5" />
      </div>

      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
    </Link>
  )
}

function HealthCard({
  title,
  value,
  description,
  tone,
}: {
  title: string
  value: string
  description: string
  tone: 'sky' | 'emerald' | 'amber'
}) {
  const toneClass = {
    sky: 'border-sky-200 bg-sky-50/70 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50/70 text-amber-700',
  }[tone]

  return (
    <article className={cn('rounded-lg border p-5 shadow-sm', toneClass)}>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-5 text-muted-foreground">{description}</p>
    </article>
  )
}