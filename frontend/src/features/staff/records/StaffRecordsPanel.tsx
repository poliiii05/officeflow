import { Database, RefreshCw, Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import type { Appointment } from '@/features/appointments/appointment-api'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import {
  AppointmentRequestList,
  TicketRequestList,
  type PaginationMeta,
} from '@/features/staff/components/StaffRequestList'
import { getStaffOverview, type StaffDashboardTotals } from '@/features/staff/staff-dashboard-api'
import type { Ticket } from '@/features/tickets/ticket-api'
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

export function StaffRecordsPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [ticketMeta, setTicketMeta] = useState<PaginationMeta>(emptyMeta)
  const [appointmentMeta, setAppointmentMeta] = useState<PaginationMeta>(emptyMeta)
  const [totals, setTotals] = useState<StaffDashboardTotals>(emptyTotals)
  const [ticketPage, setTicketPage] = useState(1)
  const [appointmentPage, setAppointmentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadRecords = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      silent ? setIsRefreshing(true) : setIsLoading(true)

      try {
        const response = await getStaffOverview({
          view: 'all',
          ticket_page: ticketPage,
          appointment_page: appointmentPage,
          per_page: 10,
          search: debouncedSearch || undefined,
        })

        setTickets(response.data.tickets.data)
        setTicketMeta(response.data.tickets.meta)
        setAppointments(response.data.appointments.data)
        setAppointmentMeta(response.data.appointments.meta)
        setTotals(response.data.totals)
        setError('')
        setHasLoadedOnce(true)
      } catch (error) {
        setError(getApiErrorMessage(error, 'Unable to load staff records.'))
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [appointmentPage, debouncedSearch, ticketPage]
  )

  const loadRecordsRef = useRef(loadRecords)

  useEffect(() => {
    loadRecordsRef.current = loadRecords
  }, [loadRecords])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTicketPage(1)
      setAppointmentPage(1)
      setDebouncedSearch(search.trim())
    }, 250)

    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  useEffect(() => {
    const channel = echo.channel('officeflow.staff')

    channel.listen('.ticket.changed', () => void loadRecordsRef.current({ silent: true }))
    channel.listen('.appointment.changed', () => void loadRecordsRef.current({ silent: true }))

    return () => {
      channel.stopListening('.ticket.changed')
      channel.stopListening('.appointment.changed')
      echo.leaveChannel('officeflow.staff')
    }
  }, [])

  const showInitialLoading = isLoading && !hasLoadedOnce

  return (
    <section className="mx-auto max-w-7xl space-y-5">
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-950">All records</p>
              <p className="mt-7 text-4xl font-semibold">{totals.allRecords}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ticket and appointment history for search and review.
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Database className="size-5" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-lg font-semibold">Search request history</h2>
              <p className="text-sm text-muted-foreground">
                Review existing tickets and appointments without changing their status.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records..." className="pl-9" />
              </div>

              <div className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-muted-foreground">
                <RefreshCw className={cn('size-4', isRefreshing && 'animate-spin')} />
                Live sync
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TicketRequestList
          title="Ticket records"
          description={`${ticketMeta.total} ticket${ticketMeta.total === 1 ? '' : 's'} found`}
          tickets={tickets}
          meta={ticketMeta}
          emptyMessage="No tickets found."
          isLoading={showInitialLoading}
          onPrevious={() => setTicketPage((page) => Math.max(page - 1, 1))}
          onNext={() => setTicketPage((page) => Math.min(page + 1, ticketMeta.last_page))}
        />

        <AppointmentRequestList
          title="Appointment records"
          description={`${appointmentMeta.total} appointment${appointmentMeta.total === 1 ? '' : 's'} found`}
          appointments={appointments}
          meta={appointmentMeta}
          emptyMessage="No appointments found."
          isLoading={showInitialLoading}
          onPrevious={() => setAppointmentPage((page) => Math.max(page - 1, 1))}
          onNext={() => setAppointmentPage((page) => Math.min(page + 1, appointmentMeta.last_page))}
        />
      </div>
    </section>
  )
}