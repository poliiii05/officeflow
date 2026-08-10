import { ListChecks, Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  updateAppointmentStatus,
  type Appointment,
  type AppointmentStatus,
} from '@/features/appointments/appointment-api'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import {
  AppointmentRequestList,
  TicketRequestList,
  type PaginationMeta,
} from '@/features/staff/components/StaffRequestList'
import { getStaffOverview, type StaffDashboardTotals } from '@/features/staff/staff-dashboard-api'
import { getCurrentStaffShift, type StaffShiftState } from '@/features/staff/staff-shift-api'
import { updateTicketStatus, type Ticket, type TicketStatus } from '@/features/tickets/ticket-api'
import { echo } from '@/lib/echo'
import { cn } from '@/lib/utils'

const emptyMeta: PaginationMeta = { current_page: 1, last_page: 1, per_page: 10, total: 0 }

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

export function StaffWorkPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [ticketMeta, setTicketMeta] = useState<PaginationMeta>(emptyMeta)
  const [appointmentMeta, setAppointmentMeta] = useState<PaginationMeta>(emptyMeta)
  const [totals, setTotals] = useState<StaffDashboardTotals>(emptyTotals)
  const [ticketPage, setTicketPage] = useState(1)
  const [appointmentPage, setAppointmentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [shiftState, setShiftState] = useState<StaffShiftState>({
  is_on_duty: false,
  can_start_shift: true,
  has_shift_today: false,
  shift: null,
  today_shift: null,
})
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [updatingKey, setUpdatingKey] = useState<string | null>(null)
  const [error, setError] = useState('')
const loadWork = useCallback(
  async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setIsLoading(true)

    try {
      const response = await getStaffOverview({
        view: 'mine',
        ticket_page: ticketPage,
        appointment_page: appointmentPage,
        per_page: 10,
        search: debouncedSearch || undefined,
      })

      setTickets(response.data.tickets.data)
      setTicketMeta(response.data.tickets.meta)
      setAppointments(response.data.appointments.data)
      setAppointmentMeta(response.data.appointments.meta)
      setError('')
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to load assigned work.'))
    } finally {
      setIsLoading(false)
    }
  },
  [appointmentPage, debouncedSearch, ticketPage]
)

  const loadWorkRef = useRef(loadWork)

  useEffect(() => {
    loadWorkRef.current = loadWork
  }, [loadWork])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTicketPage(1)
      setAppointmentPage(1)
      setDebouncedSearch(search.trim())
    }, 250)

    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    async function loadShift() {
      const response = await getCurrentStaffShift()
      setShiftState(response.data)
    }

    void loadShift()
    void loadWork()
  }, [loadWork])

  useEffect(() => {
    const channel = echo.channel('officeflow.staff')

    channel.listen('.ticket.changed', () => void loadWorkRef.current({ silent: true }))
    channel.listen('.appointment.changed', () => void loadWorkRef.current({ silent: true }))

    return () => {
      channel.stopListening('.ticket.changed')
      channel.stopListening('.appointment.changed')
      echo.leaveChannel('officeflow.staff')
    }
  }, [])

  async function handleTicketStatusChange(ticketId: number, status: TicketStatus) {
    setUpdatingKey(`ticket-${ticketId}`)
    setError('')

    try {
      await updateTicketStatus(ticketId, status)
      await loadWork({ silent: true })
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to update ticket status.'))
    } finally {
      setUpdatingKey(null)
    }
  }

  async function handleAppointmentStatusChange(appointmentId: number, status: AppointmentStatus) {
    setUpdatingKey(`appointment-${appointmentId}`)
    setError('')

    try {
      await updateAppointmentStatus(appointmentId, status)
      await loadWork({ silent: true })
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to update appointment status.'))
    } finally {
      setUpdatingKey(null)
    }
  }

  const showInitialLoading = isLoading && !hasLoadedOnce

  return (
    <section className="mx-auto max-w-7xl space-y-5">
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-sky-950">My active work</p>
              <p className="mt-7 text-4xl font-semibold">{totals.myWorkTotal}</p>
              <p className="mt-2 text-sm text-sky-700">
                {totals.myActiveTickets} tickets, {totals.myActiveAppointments} appointments assigned to you.
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <ListChecks className="size-5" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">Assigned requests</h2>
                <Badge variant="secondary" className={cn('border-0', shiftState.is_on_duty ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700')}>
                  {shiftState.is_on_duty ? 'On duty' : 'Off duty'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Update statuses and send replies only while your shift is active.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search my work..." className="pl-9" />
              </div>
            </div>
          </div>

          {!shiftState.is_on_duty ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You can view assigned requests while off duty. Start a shift to update statuses or reply.
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TicketRequestList
          title="My active tickets"
          description={`${ticketMeta.total} ticket${ticketMeta.total === 1 ? '' : 's'} assigned to you`}
          tickets={tickets}
          meta={ticketMeta}
          emptyMessage="No active tickets assigned to you."
          isLoading={showInitialLoading}
          canManage={shiftState.is_on_duty}
          updatingKey={updatingKey}
          onStatusChange={handleTicketStatusChange}
          onPrevious={() => setTicketPage((page) => Math.max(page - 1, 1))}
          onNext={() => setTicketPage((page) => Math.min(page + 1, ticketMeta.last_page))}
        />

        <AppointmentRequestList
          title="Scheduled appointments"
          description={`${appointmentMeta.total} appointment${appointmentMeta.total === 1 ? '' : 's'} assigned to you`}
          appointments={appointments}
          meta={appointmentMeta}
          emptyMessage="No scheduled appointments assigned to you."
          isLoading={showInitialLoading}
          canManage={shiftState.is_on_duty}
          updatingKey={updatingKey}
          onStatusChange={handleAppointmentStatusChange}
          onPrevious={() => setAppointmentPage((page) => Math.max(page - 1, 1))}
          onNext={() => setAppointmentPage((page) => Math.min(page + 1, appointmentMeta.last_page))}
        />
      </div>
    </section>
  )
}