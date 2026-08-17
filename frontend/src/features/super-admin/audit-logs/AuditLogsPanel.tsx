import {
  Activity,
  ArrowRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  Search,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getAuditLogs,
  type AuditLog,
  type AuditLogsMeta,
} from '@/features/super-admin/audit-logs/audit-log-api'
import { cn } from '@/lib/utils'

const emptyMeta: AuditLogsMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
}

const moduleOptions = [
  { value: '', label: 'All modules' },
  { value: 'tickets', label: 'Tickets' },
  { value: 'appointments', label: 'Appointments' },
  { value: 'users', label: 'Users' },
  { value: 'staff_shifts', label: 'Staff shifts' },
]

const moduleStyles: Record<string, string> = {
  tickets: 'border-sky-200 bg-sky-50 text-sky-700',
  appointments: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  users: 'border-violet-200 bg-violet-50 text-violet-700',
  staff_shifts: 'border-amber-200 bg-amber-50 text-amber-700',
}

const moduleIcons: Record<string, LucideIcon> = {
  tickets: ClipboardList,
  appointments: CalendarClock,
  users: Users,
  staff_shifts: Activity,
}

const roleStyles: Record<string, string> = {
  user: 'bg-sky-100 text-sky-700',
  staff: 'bg-emerald-100 text-emerald-700',
  super_admin: 'bg-violet-100 text-violet-700',
}

export function AuditLogsPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [meta, setMeta] = useState<AuditLogsMeta>(emptyMeta)
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadLogs = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await getAuditLogs({
        search: search.trim() || undefined,
        module: moduleFilter || undefined,
        page,
        per_page: 15,
      })

      setLogs(response.data)
      setMeta(response.meta)
    } catch {
      setError('Unable to load audit logs.')
    } finally {
      setIsLoading(false)
    }
  }, [moduleFilter, page, search])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadLogs()
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [loadLogs])

  const summary = useMemo(() => {
    const modules = new Set(logs.map((log) => log.module))

    return {
      visible: logs.length,
      total: meta.total,
      modules: modules.size,
    }
  }, [logs, meta.total])

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleModuleChange(value: string) {
    setModuleFilter(value)
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Total records"
          value={summary.total}
          description="All tracked system actions"
          icon={ClipboardList}
          className="border-violet-200 bg-violet-50/70 text-violet-700"
        />
        <SummaryCard
          label="Visible logs"
          value={summary.visible}
          description="Records shown on this page"
          icon={Activity}
          className="border-sky-200 bg-sky-50/70 text-sky-700"
        />
        <SummaryCard
          label="Modules"
          value={summary.modules}
          description="Modules represented in current view"
          icon={ShieldCheck}
          className="border-emerald-200 bg-emerald-50/70 text-emerald-700"
        />
      </section>

      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b bg-slate-50 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold">System activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review role changes, shift records, queue actions, and request updates.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-2xl">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search actor, module, action..."
                className="bg-white pl-9"
              />
            </div>

            <div className="relative sm:w-52">
              <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={moduleFilter}
                onChange={(event) => handleModuleChange(event.target.value)}
                className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/20"
              >
                {moduleOptions.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] table-fixed">
            <colgroup>
              <col className="w-[150px]" />
              <col className="w-[240px]" />
              <col className="w-[190px]" />
              <col className="w-[150px]" />
              <col className="w-[330px]" />
            </colgroup>

            <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Time</th>
                <th className="px-5 py-3 text-left">Actor</th>
                <th className="px-5 py-3 text-left">Module</th>
                <th className="px-5 py-3 text-left">Action</th>
                <th className="py-3 pl-8 pr-5 text-left">Details</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-sm text-muted-foreground">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length ? (
                logs.map((log) => <AuditLogRow key={log.id} log={log} />)
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <ClipboardList className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-3 font-medium">No audit logs found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Matching system activity will appear here once actions are recorded.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.last_page}
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="cursor-pointer gap-2"
              disabled={meta.current_page <= 1 || isLoading}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <Button
              variant="outline"
              className="cursor-pointer gap-2"
              disabled={meta.current_page >= meta.last_page || isLoading}
              onClick={() => setPage((current) => Math.min(current + 1, meta.last_page))}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function AuditLogRow({ log }: { log: AuditLog }) {
  const Icon = moduleIcons[log.module] ?? Activity
  const roleChange = getRoleChange(log)
  const statusChange = getStatusChange(log)
  // Only render the activity pill when it says something the title above it
  // doesn't already say (e.g. "On Duty"/"Off Duty" status). For the generic
  // fallback case, the pill was just restating the title in different
  // words ("...updated ticket assignment." + "Assignment Updated"), so we
  // skip it there instead of showing duplicate text.
  const showActivitySummary = !roleChange && !statusChange && hasDistinctActivityLabel(log)

  return (
    <tr className="transition-colors hover:bg-slate-50/70">
      <td className="px-5 py-4 align-middle">
        <p className="text-sm font-medium">{formatDate(log.created_at)}</p>
        <p className="text-xs text-muted-foreground">{formatTime(log.created_at)}</p>
      </td>

      <td className="px-5 py-4 align-middle">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border bg-slate-50 text-sm font-medium">
            {getInitials(log.actor?.name ?? 'System')}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{log.actor?.name ?? 'System'}</p>
            <p className="truncate text-xs text-muted-foreground">
              {formatLabel(log.actor?.role ?? 'system')}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 align-middle">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            <Icon className="size-4" />
          </div>

          <Badge
            variant="outline"
            className={cn(
              'capitalize',
              moduleStyles[log.module] ?? 'border-slate-200 bg-slate-50'
            )}
          >
            {formatLabel(log.module)}
          </Badge>
        </div>
      </td>

      <td className="px-5 py-4 align-middle">
       <Badge variant="secondary" className="inline-flex w-fit whitespace-nowrap border-0 capitalize">
          {formatAction(log.action)}
        </Badge>
      </td>

      <td className="py-4 pl-8 pr-5 align-middle">
        <div className="w-full">
          <p className="font-medium">{getAuditTitle(log)}</p>

          {roleChange || statusChange || showActivitySummary ? (
            <div className="mt-2 flex justify-start">
              {roleChange ? (
                <ChangeSummary oldValue={roleChange.oldRole} newValue={roleChange.newRole} />
              ) : statusChange ? (
                <ChangeSummary
                  oldValue={statusChange.oldStatus}
                  newValue={statusChange.newStatus}
                />
              ) : (
                <ActivitySummary log={log} />
              )}
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  )
}

function ChangeSummary({
  oldValue,
  newValue,
}: {
  oldValue: string
  newValue: string
}) {
  return (
    <div className="flex items-center gap-3">
      <ValuePill value={oldValue} />
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
      <ValuePill value={newValue} />
    </div>
  )
}

function ActivitySummary({ log }: { log: AuditLog }) {
  return (
    <div className="flex min-w-[12rem] items-center">
      <span
        className={cn(
          'inline-flex min-w-[11.5rem] items-center justify-center whitespace-nowrap rounded-full px-4 py-1 text-xs font-medium',
          getActivityStyle(log)
        )}
      >
        {getActivityLabel(log)}
      </span>
    </div>
  )
}

function ValuePill({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-36 items-center justify-center rounded-full px-3 py-1 text-xs font-medium',
        roleStyles[value] ?? getStatusStyle(value),
        className
      )}
    >
      {formatLabel(value)}
    </span>
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
  className?: string
}) {
  return (
    <article className={cn('rounded-lg border p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-slate-700">{label}</p>
          <p className="mt-6 text-3xl font-semibold text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  )
}

function getAuditTitle(log: AuditLog) {
  if (getRoleChange(log)) {
    return 'Role access updated'
  }

  if (getStatusChange(log)) {
    return log.module === 'appointments' ? 'Appointment status updated' : 'Ticket status updated'
  }

  if (log.module === 'tickets' && log.action === 'created') {
    return 'Ticket created'
  }

  if (log.module === 'appointments' && ['created', 'scheduled'].includes(log.action)) {
    return log.action === 'scheduled' ? 'Appointment scheduled' : 'Appointment created'
  }

  if (log.module === 'staff_shifts') {
    return log.action === 'started' ? 'Shift started' : 'Shift ended'
  }

  return cleanDescription(log.description)
}

// Cases where the pill in the Details column adds information the title
// doesn't already convey (a duty status, a "new record" flag). Everything
// else falls back to formatAction(log.action), which just repeats the
// title in Title Case - that fallback case is intentionally not covered
// here, see `showActivitySummary` in AuditLogRow.
function hasDistinctActivityLabel(log: AuditLog) {
  if (log.module === 'staff_shifts') {
    return true
  }

  if (log.module === 'tickets' && log.action === 'created') {
    return true
  }

  if (log.module === 'appointments' && ['created', 'scheduled'].includes(log.action)) {
    return true
  }

  return false
}

function getActivityLabel(log: AuditLog) {
  if (log.module === 'staff_shifts') {
    return log.action === 'started' ? 'On Duty' : 'Off Duty'
  }

  if (log.module === 'tickets' && log.action === 'created') {
    return 'New Ticket'
  }

  if (log.module === 'appointments') {
    if (log.action === 'scheduled') {
      return 'Scheduled'
    }

    if (log.action === 'created') {
      return 'New Appointment'
    }
  }

  return formatAction(log.action)
}

function getRoleChange(log: AuditLog) {
  const oldRole = readMetadataString(log.metadata, 'old_role')
  const newRole = readMetadataString(log.metadata, 'new_role')

  if (!oldRole || !newRole) {
    return null
  }

  return { oldRole, newRole }
}

function getStatusChange(log: AuditLog) {
  const oldStatus = readMetadataString(log.metadata, 'old_status')
  const newStatus = readMetadataString(log.metadata, 'new_status')

  if (!oldStatus || !newStatus) {
    return null
  }

  return { oldStatus, newStatus }
}

function readMetadataString(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key]

  return typeof value === 'string' ? value : null
}

function getActivityStyle(log: AuditLog) {
  if (log.module === 'staff_shifts') {
    return log.action === 'started'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-slate-100 text-slate-700'
  }

  if (log.module === 'tickets') {
    return 'bg-sky-100 text-sky-700'
  }

  if (log.module === 'appointments') {
    return 'bg-emerald-100 text-emerald-700'
  }

  return 'bg-slate-100 text-slate-700'
}

function getStatusStyle(value: string) {
  const styles: Record<string, string> = {
    open: 'bg-sky-100 text-sky-700',
    pending: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-amber-100 text-amber-700',
    scheduled: 'bg-sky-100 text-sky-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-slate-100 text-slate-700',
    cancelled: 'bg-slate-100 text-slate-700',
  }

  return styles[value] ?? 'bg-slate-100 text-slate-700'
}

function cleanDescription(description: string) {
  return description
    .replaceAll('super_admin', 'Super Admin')
    .replaceAll('in_progress', 'In Progress')
}

function formatAction(value: string) {
  return formatLabel(value).replace('Status Updated', 'Status')
}

function formatLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}