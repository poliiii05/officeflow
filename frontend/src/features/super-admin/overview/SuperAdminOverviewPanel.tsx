import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Database,
  TicketCheck,
  UserRoundCheck,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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

type SuperAdminOverviewPanelProps = {
  onRefreshingChange?: (isRefreshing: boolean) => void
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
  if (!value) return 'Off duty'

  return `Started ${new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

export function SuperAdminOverviewPanel({ onRefreshingChange }: SuperAdminOverviewPanelProps) {
  const [totals, setTotals] = useState<SuperAdminTotals>(emptyTotals)
  const [staffWorkload, setStaffWorkload] = useState<StaffWorkloadItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOverview = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (silent) {
        onRefreshingChange?.(true)
      } else {
        setIsLoading(true)
      }

      try {
        const response = await getSuperAdminOverview()

        setTotals(response.data.totals)
        setStaffWorkload(response.data.staff_workload)
        setError('')
      } catch (error) {
        setError(getApiErrorMessage(error, 'Unable to load super admin overview.'))
      } finally {
        setIsLoading(false)
        onRefreshingChange?.(false)
      }
    },
    [onRefreshingChange]
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

  const summaryCards = useMemo(
    () => [
      {
        label: 'Queue waiting',
        value: totals.queue_total,
        description: `${totals.unassigned_tickets} tickets, ${totals.pending_appointments} appointments`,
        icon: ClipboardList,
        card: 'border-violet-200 bg-violet-50',
        iconBox: 'bg-violet-100 text-violet-700',
      },
      {
        label: 'On-duty staff',
        value: totals.on_duty_staff,
        description: `${totals.staff} total staff accounts`,
        icon: UserRoundCheck,
        card: 'border-emerald-200 bg-emerald-50',
        iconBox: 'bg-emerald-100 text-emerald-700',
      },
      {
        label: 'Resolved today',
        value: totals.resolved_today,
        description: 'Tickets and appointments completed today',
        icon: CheckCircle2,
        card: 'border-sky-200 bg-sky-50',
        iconBox: 'bg-sky-100 text-sky-700',
      },
      {
        label: 'All records',
        value: totals.all_tickets + totals.all_appointments,
        description: `${totals.all_tickets} tickets, ${totals.all_appointments} appointments`,
        icon: Database,
        card: 'border-slate-200 bg-white',
        iconBox: 'bg-slate-100 text-slate-700',
      },
    ],
    [totals]
  )

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((stat) => {
          const Icon = stat.icon

          return (
            <article key={stat.label} className={cn('rounded-lg border p-5 shadow-sm', stat.card)}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">{stat.label}</p>
                  <p className="mt-7 text-3xl font-semibold">{stat.value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{stat.description}</p>
                </div>

                <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', stat.iconBox)}>
                  <Icon className="size-5" />
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-4">
            <div>
              <h2 className="font-semibold">Staff workload</h2>
              <p className="text-sm text-muted-foreground">
                On-duty status and active assigned work.
              </p>
            </div>

            <Users className="size-5 text-slate-700" />
          </div>

          {isLoading ? (
            <div className="px-5 py-8 text-sm text-muted-foreground">Loading staff...</div>
          ) : staffWorkload.length ? (
            staffWorkload.map((staff) => <StaffWorkloadRow key={staff.id} staff={staff} />)
          ) : (
            <div className="px-5 py-8 text-sm text-muted-foreground">
              No staff accounts found.
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-violet-100 bg-violet-50/70 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <Activity className="size-5" />
              </div>

              <div>
                <h2 className="font-semibold">Operations snapshot</h2>
                <p className="text-sm text-muted-foreground">Current service desk pressure.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <SnapshotRow label="Queue waiting" value={totals.queue_total} />
              <SnapshotRow label="On-duty staff" value={totals.on_duty_staff} />
              <SnapshotRow label="Registered users" value={totals.users} />
              <SnapshotRow label="Total staff" value={totals.staff} />
            </div>
          </section>

          <section className="rounded-lg border border-sky-100 bg-sky-50/70 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <TicketCheck className="size-5" />
              </div>

              <div>
                <h2 className="font-semibold">Queue mix</h2>
                <p className="text-sm text-muted-foreground">Unclaimed requests by type.</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm text-muted-foreground">Tickets</p>
                <p className="mt-2 text-2xl font-semibold">{totals.unassigned_tickets}</p>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm text-muted-foreground">Appointments</p>
                <p className="mt-2 text-2xl font-semibold">{totals.pending_appointments}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}

function StaffWorkloadRow({ staff }: { staff: StaffWorkloadItem }) {
  return (
    <article className="grid gap-4 border-b px-5 py-4 last:border-b-0 hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="flex min-w-0 gap-3">
        <Avatar className="size-10">
          <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{staff.name}</p>

            <Badge variant="secondary" className="capitalize">
              {staff.role.replace('_', ' ')}
            </Badge>

            <Badge
              variant="secondary"
              className={cn(
                'border-0',
                staff.is_on_duty
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200 text-slate-700'
              )}
            >
              {staff.is_on_duty ? 'On duty' : 'Off duty'}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">{staff.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatShiftTime(staff.shift_started_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg border bg-sky-50 px-3 py-2">
          <p className="font-semibold">{staff.active_tickets}</p>
          <p className="text-xs text-muted-foreground">Tickets</p>
        </div>

        <div className="rounded-lg border bg-emerald-50 px-3 py-2">
          <p className="font-semibold">{staff.active_appointments}</p>
          <p className="text-xs text-muted-foreground">Appts</p>
        </div>

        <div className="rounded-lg border bg-violet-50 px-3 py-2">
          <p className="font-semibold">{staff.active_total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>
    </article>
  )
}

function SnapshotRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}