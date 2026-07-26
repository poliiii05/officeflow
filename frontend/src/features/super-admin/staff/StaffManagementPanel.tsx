import {
  BriefcaseBusiness,
  CalendarCheck,
  Clock3,
  RefreshCw,
  Search,
  TicketCheck,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import {
  getSuperAdminOverview,
  type StaffWorkloadItem,
} from '@/features/super-admin/super-admin-api'
import { echo } from '@/lib/echo'
import { cn } from '@/lib/utils'

type StaffStatusFilter = 'all' | 'on_duty' | 'off_duty'

const statusFilters: Array<{ value: StaffStatusFilter; label: string }> = [
  { value: 'all', label: 'All staff' },
  { value: 'on_duty', label: 'On duty' },
  { value: 'off_duty', label: 'Off duty' },
]

function getInitials(name?: string) {
  if (!name) return 'OF'

  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatRole(role: StaffWorkloadItem['role']) {
  return role === 'super_admin' ? 'Super Admin' : 'Staff'
}

function formatShiftTime(value: string | null) {
  if (!value) return 'No active shift'

  return `Started ${new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

function getWorkloadLabel(total: number) {
  if (total >= 8) return 'Heavy load'
  if (total >= 4) return 'Moderate load'
  if (total > 0) return 'Light load'

  return 'No active work'
}

function getWorkloadTone(total: number) {
  if (total >= 8) return 'bg-red-100 text-red-700'
  if (total >= 4) return 'bg-amber-100 text-amber-700'
  if (total > 0) return 'bg-sky-100 text-sky-700'

  return 'bg-slate-200 text-slate-700'
}

export function StaffManagementPanel() {
  const [staffWorkload, setStaffWorkload] = useState<StaffWorkloadItem[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadStaff = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (silent) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const response = await getSuperAdminOverview()

      setStaffWorkload(response.data.staff_workload)
      setError('')
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to load staff workload.'))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadStaff()
  }, [loadStaff])

  useEffect(() => {
    const channel = echo.channel('officeflow.staff')

    channel.listen('.ticket.changed', () => {
      void loadStaff({ silent: true })
    })

    channel.listen('.appointment.changed', () => {
      void loadStaff({ silent: true })
    })

    const fallbackInterval = window.setInterval(() => {
      void loadStaff({ silent: true })
    }, 60000)

    return () => {
      channel.stopListening('.ticket.changed')
      channel.stopListening('.appointment.changed')
      echo.leaveChannel('officeflow.staff')
      window.clearInterval(fallbackInterval)
    }
  }, [loadStaff])

  const filteredStaff = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return staffWorkload.filter((staff) => {
      const matchesSearch =
        !normalizedSearch ||
        staff.name.toLowerCase().includes(normalizedSearch) ||
        staff.email.toLowerCase().includes(normalizedSearch) ||
        formatRole(staff.role).toLowerCase().includes(normalizedSearch)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'on_duty' && staff.is_on_duty) ||
        (statusFilter === 'off_duty' && !staff.is_on_duty)

      return matchesSearch && matchesStatus
    })
  }, [search, staffWorkload, statusFilter])

  const onDutyCount = staffWorkload.filter((staff) => staff.is_on_duty).length
  const offDutyCount = staffWorkload.length - onDutyCount
  const activeTicketsTotal = staffWorkload.reduce((total, staff) => total + staff.active_tickets, 0)
  const activeAppointmentsTotal = staffWorkload.reduce(
    (total, staff) => total + staff.active_appointments,
    0
  )

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Staff accounts"
          value={staffWorkload.length}
          description={`${onDutyCount} on duty, ${offDutyCount} off duty`}
          icon={Users}
          tone="slate"
        />

        <SummaryCard
          label="On-duty staff"
          value={onDutyCount}
          description="Available to handle work"
          icon={UserRoundCheck}
          tone="emerald"
        />

        <SummaryCard
          label="Assigned tickets"
          value={activeTicketsTotal}
          description="Active ticket workload"
          icon={TicketCheck}
          tone="sky"
        />

        <SummaryCard
          label="Assigned appointments"
          value={activeAppointmentsTotal}
          description="Active appointment workload"
          icon={CalendarCheck}
          tone="violet"
        />
      </div>

      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="grid gap-4 border-b bg-slate-50 px-5 py-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <BriefcaseBusiness className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">Staff workload</h2>
              <p className="text-sm text-muted-foreground">
                Monitor duty status and active assigned requests per staff account.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    'cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                    statusFilter === filter.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-white text-muted-foreground hover:bg-slate-50 hover:text-foreground'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="relative w-full xl:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search staff..."
                className="bg-white pl-9"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-b bg-white px-5 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {filteredStaff.length} of {staffWorkload.length} staff accounts
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
            Live sync
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed">
            <colgroup>
              <col className="w-[48%]" />
              <col className="w-[14%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[16%]" />
            </colgroup>

            <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Staff account</th>
                <th className="px-5 py-3 text-center">Shift</th>
                <th className="px-5 py-3 text-center">Tickets</th>
                <th className="px-5 py-3 text-center">Appts</th>
                <th className="px-5 py-3 text-center">Load</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-sm text-muted-foreground">
                    Loading staff...
                  </td>
                </tr>
              ) : filteredStaff.length ? (
                filteredStaff.map((staff) => <StaffRow key={staff.id} staff={staff} />)
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Users className="mx-auto size-9 text-muted-foreground" />
                    <h3 className="mt-3 font-semibold">No staff found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try another search term or status filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  description: string
  icon: LucideIcon
  tone: 'slate' | 'emerald' | 'sky' | 'violet'
}) {
  const styles = {
    slate: 'border-slate-200 bg-white text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
  }

  return (
    <article className={cn('rounded-lg border p-5 shadow-sm', styles[tone])}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="mt-7 text-3xl font-semibold text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/80">
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  )
}

function StaffRow({ staff }: { staff: StaffWorkloadItem }) {
  return (
    <tr className="border-b last:border-b-0 hover:bg-slate-50">
      <td className="px-5 py-5 align-middle">
        <div className="flex min-w-0 gap-3">
          <Avatar className="size-11">
            <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium">{staff.name}</p>

              <Badge variant="secondary" className="border-0 bg-slate-100 text-slate-700">
                {formatRole(staff.role)}
              </Badge>
            </div>

            <p className="mt-1 truncate text-sm text-muted-foreground">{staff.email}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" />
              {formatShiftTime(staff.shift_started_at)}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-5 text-center align-middle">
        <Badge
          variant="secondary"
          className={cn(
            'inline-flex h-8 w-32 justify-center border-0',
            staff.is_on_duty ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
          )}
        >
          {staff.is_on_duty ? 'On duty' : 'Off duty'}
        </Badge>
      </td>

      <td className="px-5 py-5 text-center align-middle">
        <MetricBox value={staff.active_tickets} tone="sky" />
      </td>

      <td className="px-5 py-5 text-center align-middle">
        <MetricBox value={staff.active_appointments} tone="emerald" />
      </td>

      <td className="px-5 py-5 text-center align-middle">
        <Badge
          variant="secondary"
          className={cn(
            'inline-flex h-8 w-36 justify-center border-0',
            getWorkloadTone(staff.active_total)
          )}
        >
          {getWorkloadLabel(staff.active_total)}
        </Badge>
      </td>
    </tr>
  )
}

function MetricBox({ value, tone }: { value: number; tone: 'sky' | 'emerald' }) {
  const styles = {
    sky: 'bg-sky-50 text-sky-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }

  return (
    <div
      className={cn(
        'mx-auto flex h-10 w-20 items-center justify-center rounded-lg border font-semibold',
        styles[tone]
      )}
    >
      {value}
    </div>
  )
}