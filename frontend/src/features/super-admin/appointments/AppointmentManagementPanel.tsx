import { CalendarCheck, ClipboardList, Eye, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  assignAppointment,
  getAppointments,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentStatus,
} from '@/features/appointments/appointment-api'
import { StaffAssignmentPicker } from '@/features/super-admin/components/StaffAssignmentPicker'
import {
  getPresetRange,
  SubmittedDateFilter,
  type DatePreset,
} from '@/features/super-admin/components/SubmittedDateFilter'
import {
  getAssignableStaff,
  type AssignableStaff,
} from '@/features/super-admin/super-admin-api'
import { cn } from '@/lib/utils'

type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
}

const statusOptions: AppointmentStatus[] = [
  'pending',
  'scheduled',
  'completed',
  'cancelled',
]

const statusStyles: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-sky-100 text-sky-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-200 text-slate-700',
}

// Appointments live on a short, fixed horizon (booked days out, rarely
// months), so the quick filters only cover the windows admins actually
// check day to day. "This month" is deliberately left out here - see
// TicketManagementPanel for a resource where it earns its place.
const APPOINTMENT_DATE_PRESETS: DatePreset[] = ['all', 'today', 'this_week', 'overdue']

function formatStatus(status: string) {
  return status.replace('_', ' ')
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export function AppointmentManagementPanel() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [staff, setStaff] = useState<AssignableStaff[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | AppointmentStatus>('all')
  const [datePreset, setDatePreset] = useState<DatePreset | 'custom'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStaff, setIsLoadingStaff] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [error, setError] = useState('')
  const [staffError, setStaffError] = useState('')

  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)
  const [draftStatus, setDraftStatus] =
    useState<AppointmentStatus>('pending')
  const [draftAssignee, setDraftAssignee] = useState('')

  const loadAppointments = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await getAppointments({
        queue: 'all',
        page,
        per_page: 10,
        search: search || undefined,
        status: status === 'all' ? undefined : status,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })

      setAppointments(response.data)
      setMeta(response.meta)
    } catch {
      setError('Unable to load appointments right now.')
    } finally {
      setIsLoading(false)
    }
  }, [dateFrom, dateTo, page, search, status])

  const loadAssignableStaff = useCallback(async () => {
    setIsLoadingStaff(true)
    setStaffError('')

    try {
      setStaff(await getAssignableStaff())
    } catch {
      setStaff([])
      setStaffError('Unable to load staff currently on duty.')
    } finally {
      setIsLoadingStaff(false)
    }
  }, [])

  useEffect(() => {
    void loadAppointments()
  }, [loadAppointments])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [searchInput])

  function handleStatusChange(nextStatus: 'all' | AppointmentStatus) {
    setPage(1)
    setStatus(nextStatus)
  }

  function handlePresetChange(preset: DatePreset) {
    const range = getPresetRange(preset)

    setPage(1)
    setDatePreset(preset)
    setDateFrom(range.from)
    setDateTo(range.to)
  }

  function handleDateFromChange(value: string) {
    setPage(1)
    setDatePreset('custom')
    setDateFrom(value)

    if (dateTo && value && value > dateTo) {
      setDateTo('')
    }
  }

  function handleDateToChange(value: string) {
    setPage(1)
    setDatePreset('custom')
    setDateTo(value)
  }

  function clearDateFilter() {
    setPage(1)
    setDatePreset('all')
    setDateFrom('')
    setDateTo('')
  }

  function openManagement(appointment: Appointment) {
    setSelectedAppointment(appointment)
    setDraftStatus(appointment.status)
    setDraftAssignee(appointment.assigned_to_id?.toString() ?? '')
    void loadAssignableStaff()
  }

  async function saveChanges() {
    if (!selectedAppointment) return

    setIsSaving(true)
    setError('')

    try {
      const nextAssignee = draftAssignee ? Number(draftAssignee) : null
      const assignmentChanged =
        nextAssignee !== selectedAppointment.assigned_to_id
      const statusChanged = draftStatus !== selectedAppointment.status

      if (assignmentChanged) {
        await assignAppointment(selectedAppointment.id, nextAssignee)
      }

      if (statusChanged) {
        await updateAppointmentStatus(selectedAppointment.id, draftStatus)
      }

      setSelectedAppointment(null)
      await Promise.all([loadAppointments(), loadAssignableStaff()])
    } catch {
      setError('Unable to save the appointment changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="border-b bg-slate-50 px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <CalendarCheck className="size-5" />
              </div>

              <div>
                <h2 className="font-semibold">All appointments</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage schedules, appointment progress, and staff coverage.
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 xl:w-auto xl:items-end">
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1 sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search number, requester, purpose..."
                    className="pl-9"
                  />
                </div>

                <Select
                  value={status}
                  onValueChange={(value) =>
                    handleStatusChange(value as 'all' | AppointmentStatus)
                  }
                >
                  <SelectTrigger className="h-9 sm:w-44">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option} value={option} className="capitalize">
                        {formatStatus(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <SubmittedDateFilter
                presets={APPOINTMENT_DATE_PRESETS}
                activePreset={datePreset}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onPresetChange={handlePresetChange}
                onDateFromChange={handleDateFromChange}
                onDateToChange={handleDateToChange}
                onClear={clearDateFilter}
                overdueHint="Scheduled before today and still pending or scheduled"
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="mx-5 mt-5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="hidden grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_120px_120px] gap-4 border-b bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-muted-foreground lg:grid">
          <span>Appointment</span>
          <span>Requester</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {isLoading ? (
          <div className="px-5 py-12 text-sm text-muted-foreground">
            Loading appointments...
          </div>
        ) : appointments.length ? (
          appointments.map((appointment) => (
            <article
              key={appointment.id}
              className="grid gap-4 border-b px-5 py-4 last:border-b-0 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_120px_120px] lg:items-center"
            >
              <div className="min-w-0">
                <p className="font-medium">{appointment.purpose}</p>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {appointment.appointment_number} - {appointment.department}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Scheduled: {formatDate(appointment.scheduled_at)}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {appointment.requester?.name ?? 'Unknown requester'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {appointment.assigned_to?.name
                    ? `Assigned to ${appointment.assigned_to.name}`
                    : 'Unassigned queue'}
                </p>
              </div>

              <div>
                <Badge
                  className={cn(
                    'w-fit border-0 capitalize',
                    statusStyles[appointment.status]
                  )}
                >
                  {formatStatus(appointment.status)}
                </Badge>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-fit cursor-pointer gap-2"
                onClick={() => openManagement(appointment)}
              >
                <Eye className="size-4" />
                Manage
              </Button>
            </article>
          ))
        ) : (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No appointments match this view.
          </div>
        )}

        <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {meta.current_page} of {meta.last_page} - {meta.total}{' '}
            appointments
          </span>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.current_page <= 1}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
            >
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.current_page >= meta.last_page}
              onClick={() =>
                setPage((current) => Math.min(current + 1, meta.last_page))
              }
            >
              Next
            </Button>
          </div>
        </div>
      </section>

      <Dialog
        open={Boolean(selectedAppointment)}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setSelectedAppointment(null)
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          {selectedAppointment ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedAppointment.purpose}</DialogTitle>
                <DialogDescription>
                  Review scheduling details, update the workflow, and assign
                  available staff.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="grid gap-3 rounded-lg border bg-slate-50 p-4 text-sm sm:grid-cols-2">
                  <Info
                    label="Appointment number"
                    value={selectedAppointment.appointment_number}
                  />
                  <Info
                    label="Scheduled for"
                    value={formatDate(selectedAppointment.scheduled_at)}
                  />
                  <Info label="Office" value={selectedAppointment.department} />
                  <Info
                    label="Requester"
                    value={
                      selectedAppointment.requester?.name ?? 'Unknown requester'
                    }
                  />
                  <Info
                    label="Requester email"
                    value={
                      selectedAppointment.requester?.email ?? 'Not available'
                    }
                  />
                  <Info
                    label="Current assignment"
                    value={
                      selectedAppointment.assigned_to?.name ?? 'Unassigned queue'
                    }
                  />
                </div>

                <section>
                  <p className="mb-2 text-sm font-medium">Additional details</p>
                  <p className="rounded-lg border bg-slate-50 p-4 text-sm leading-6 text-muted-foreground">
                    {selectedAppointment.notes ||
                      'No additional details supplied.'}
                  </p>
                </section>

                <section className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
                  <label className="block">
                    <span className="text-sm font-medium">
                      Appointment workflow status
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Confirm the current appointment stage before saving.
                    </p>

                    <select
                      value={draftStatus}
                      onChange={(event) =>
                        setDraftStatus(
                          event.target.value as AppointmentStatus
                        )
                      }
                      className="mt-3 h-10 w-full rounded-md border bg-white px-3 text-sm"
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {formatStatus(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                </section>

                <StaffAssignmentPicker
                  staff={staff}
                  value={draftAssignee}
                  onChange={setDraftAssignee}
                  isLoading={isLoadingStaff}
                  error={staffError}
                  resourceLabel="appointment"
                  currentAssigneeId={selectedAppointment.assigned_to_id}
                  currentAssigneeName={selectedAppointment.assigned_to?.name}
                  accent="emerald"
                />

                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => setSelectedAppointment(null)}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    className="cursor-pointer"
                    disabled={isSaving}
                    onClick={() => void saveChanges()}
                  >
                    <ClipboardList className="size-4" />
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  )
}