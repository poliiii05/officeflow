import { ClipboardList, Eye, Search, TicketCheck } from 'lucide-react'
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
import {
  assignTicket,
  getTickets,
  updateTicketStatus,
  type Ticket,
  type TicketStatus,
} from '@/features/tickets/ticket-api'
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

const statusOptions: TicketStatus[] = [
  'open',
  'in_progress',
  'resolved',
  'closed',
]

const statusStyles: Record<TicketStatus, string> = {
  open: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-200 text-slate-700',
}

// Tickets can sit open far longer than an appointment stays unscheduled,
// so "This month" earns a slot here even though it doesn't for Appointments.
const TICKET_DATE_PRESETS: DatePreset[] = [
  'all',
  'today',
  'this_week',
  'this_month',
  'overdue',
]

function formatStatus(status: string) {
  return status.replace('_', ' ')
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export function TicketManagementPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [staff, setStaff] = useState<AssignableStaff[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | TicketStatus>('all')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStaff, setIsLoadingStaff] = useState(false)
  const [error, setError] = useState('')
  const [staffError, setStaffError] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [draftStatus, setDraftStatus] = useState<TicketStatus>('open')
  const [draftAssignee, setDraftAssignee] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [datePreset, setDatePreset] = useState<DatePreset | 'custom'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const loadTickets = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await getTickets({
        queue: 'all',
        page,
        per_page: 10,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: search || undefined,
        status: status === 'all' ? undefined : status,
      })

      setTickets(response.data)
      setMeta(response.meta)
    } catch {
      setError('Unable to load tickets right now.')
    } finally {
      setIsLoading(false)
    }
    // NOTE: dateFrom/dateTo were missing from this list before - tickets
    // never actually refetched when the date filter changed. Fixed here.
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
    // NOTE: this call doesn't depend on any filter state, so the deps
    // list is just [] now instead of pulling in date/search/status.
  }, [])

  useEffect(() => {
    void loadTickets()
  }, [loadTickets])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [searchInput])

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

  function openManagement(ticket: Ticket) {
    setSelectedTicket(ticket)
    setDraftStatus(ticket.status)
    setDraftAssignee(ticket.assigned_to_id?.toString() ?? '')
    void loadAssignableStaff()
  }

  async function saveChanges() {
    if (!selectedTicket) return

    setIsSaving(true)
    setError('')

    try {
      const nextAssignee = draftAssignee ? Number(draftAssignee) : null
      const assignmentChanged = nextAssignee !== selectedTicket.assigned_to_id
      const statusChanged = draftStatus !== selectedTicket.status

      if (assignmentChanged) {
        await assignTicket(selectedTicket.id, nextAssignee)
      }

      if (statusChanged) {
        await updateTicketStatus(selectedTicket.id, draftStatus)
      }

      setSelectedTicket(null)
      await Promise.all([loadTickets(), loadAssignableStaff()])
    } catch {
      setError('Unable to save the ticket changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b bg-slate-50 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <TicketCheck className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">All tickets</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Assign requests, update statuses, and review requester details.
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 lg:items-end">
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:justify-end">
              <div className="relative min-w-0 sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search number, requester, subject..."
                  className="pl-9"
                />
              </div>

              <Select
                value={status}
                onValueChange={(value) => {
                  setPage(1)
                  setStatus(value as 'all' | TicketStatus)
                }}
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
              presets={TICKET_DATE_PRESETS}
              activePreset={datePreset}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onPresetChange={handlePresetChange}
              onDateFromChange={handleDateFromChange}
              onDateToChange={handleDateToChange}
              onClear={clearDateFilter}
              overdueHint="Created before today and still open or in progress"
            />
          </div>
        </div>

        {error ? (
          <div className="mx-5 mt-5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="hidden grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_120px_120px] gap-4 border-b bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-muted-foreground lg:grid">
          <span>Ticket</span>
          <span>Requester</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {isLoading ? (
          <div className="px-5 py-12 text-sm text-muted-foreground">
            Loading tickets...
          </div>
        ) : tickets.length ? (
          tickets.map((ticket) => (
            <article
              key={ticket.id}
              className="grid gap-4 border-b px-5 py-4 last:border-b-0 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_120px_120px] lg:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{ticket.subject}</p>
                  <Badge variant="outline" className="capitalize">
                    {ticket.priority}
                  </Badge>
                </div>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {ticket.ticket_number} - {ticket.department} - {ticket.category}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {ticket.requester?.name ?? 'Unknown requester'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ticket.assigned_to?.name
                    ? `Assigned to ${ticket.assigned_to.name}`
                    : 'Shared queue'}
                </p>
              </div>

              <div>
                <Badge
                  className={cn(
                    'w-fit border-0 capitalize',
                    statusStyles[ticket.status]
                  )}
                >
                  {formatStatus(ticket.status)}
                </Badge>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-fit cursor-pointer gap-2"
                onClick={() => openManagement(ticket)}
              >
                <Eye className="size-4" />
                Manage
              </Button>
            </article>
          ))
        ) : (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No tickets match this view.
          </div>
        )}

        <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {meta.current_page} of {meta.last_page} - {meta.total} tickets
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
        open={Boolean(selectedTicket)}
        onOpenChange={(open) => {
          if (!open && !isSaving) setSelectedTicket(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          {selectedTicket ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTicket.subject}</DialogTitle>
                <DialogDescription>
                  Review the request, update its workflow, and assign available staff.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="grid gap-3 rounded-lg border bg-slate-50 p-4 text-sm sm:grid-cols-2">
                  <Info label="Ticket number" value={selectedTicket.ticket_number} />
                  <Info label="Created" value={formatDate(selectedTicket.created_at)} />
                  <Info label="Office" value={selectedTicket.department} />
                  <Info label="Service" value={selectedTicket.category} />
                  <Info label="Requester" value={selectedTicket.requester?.name ?? 'Unknown requester'} />
                  <Info label="Requester email" value={selectedTicket.requester?.email ?? 'Not available'} />
                </div>

                <section>
                  <p className="mb-2 text-sm font-medium">Description</p>
                  <p className="rounded-lg border bg-slate-50 p-4 text-sm leading-6 text-muted-foreground">
                    {selectedTicket.description}
                  </p>
                </section>

                <section className="rounded-lg border border-sky-100 bg-sky-50/60 p-4">
                  <label className="block">
                    <span className="text-sm font-medium">Ticket workflow status</span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Update the request stage after reviewing the current work.
                    </p>

                    <select
                      value={draftStatus}
                      onChange={(event) =>
                        setDraftStatus(event.target.value as TicketStatus)
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
                  resourceLabel="ticket"
                  currentAssigneeId={selectedTicket.assigned_to_id}
                  currentAssigneeName={selectedTicket.assigned_to?.name}
                  accent="sky"
                />

                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => setSelectedTicket(null)}
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