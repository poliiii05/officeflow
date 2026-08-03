import {
  CalendarCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Search,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getAppointment,
  getAppointments,
  type Appointment,
} from '@/features/appointments/appointment-api'
import { AppointmentDetailsDialog } from '@/features/appointments/components/AppointmentDetailsDialog'
import { cn } from '@/lib/utils'

type UserAppointmentsPanelProps = {
  refreshKey?: number
}

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

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-sky-100 text-sky-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-200 text-slate-700',
}

const statusTabs = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
] as const

function formatStatus(status: string) {
  return status.replaceAll('_', ' ')
}

function formatSchedule(value: string) {
  const date = new Date(value)

  return {
    date: date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }),
  }
}

export function UserAppointmentsPanel({
  refreshKey = 0,
}: UserAppointmentsPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const openAppointmentId = Number(searchParams.get('open'))

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [openedAppointment, setOpenedAppointment] = useState<Appointment | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const selectedAppointment = useMemo(
    () =>
      appointments.find((appointment) => appointment.id === openAppointmentId) ??
      openedAppointment,
    [appointments, openAppointmentId, openedAppointment]
  )

  useEffect(() => {
    let cancelled = false

    const timeout = window.setTimeout(
      () => {
        async function loadAppointments() {
          setIsLoading(true)
          setError('')

          try {
            const response = await getAppointments({
              queue: 'all',
              status,
              search: search.trim(),
              page,
              per_page: 10,
            })

            if (cancelled) return

            setAppointments(response.data)
            setMeta(response.meta)
          } catch {
            if (!cancelled) setError('Unable to load your appointment requests.')
          } finally {
            if (!cancelled) setIsLoading(false)
          }
        }

        void loadAppointments()
      },
      search ? 250 : 0
    )

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [page, refreshKey, search, status])

  useEffect(() => {
    let cancelled = false

    if (!openAppointmentId) {
      setOpenedAppointment(null)
      return
    }

    if (appointments.some((appointment) => appointment.id === openAppointmentId)) {
      setOpenedAppointment(null)
      return
    }

    async function loadOpenedAppointment() {
      try {
        const response = await getAppointment(openAppointmentId)
        if (!cancelled) setOpenedAppointment(response.data)
      } catch {
        if (!cancelled) setError('Unable to open the selected appointment.')
      }
    }

    void loadOpenedAppointment()

    return () => {
      cancelled = true
    }
  }, [appointments, openAppointmentId])

  function closeSelectedAppointment() {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('open')
    setSearchParams(nextParams, { replace: true })
    setOpenedAppointment(null)
  }

  return (
    <section className="mx-auto max-w-7xl overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="flex flex-col gap-5 border-b bg-slate-50/70 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <CalendarCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Appointment history</h2>
            <p className="text-sm text-muted-foreground">
              Review requested schedules, confirmations, and office updates.
            </p>
          </div>
        </div>

        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search appointment, number, office, or service..."
            className="bg-white pl-9"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b px-5 py-3 lg:px-6">
        {statusTabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => {
              setStatus(tab.value)
              setPage(1)
            }}
            className={cn(
              'h-9 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors',
              status === tab.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-white text-muted-foreground hover:bg-muted'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 lg:px-6">
          {error}
        </div>
      ) : null}

      <div className="hidden grid-cols-[minmax(0,1.25fr)_minmax(170px,0.7fr)_190px_130px_130px] gap-5 border-b bg-slate-50 px-6 py-3 text-xs font-semibold uppercase text-muted-foreground lg:grid">
        <span>Appointment</span>
        <span>Office</span>
        <span>Preferred schedule</span>
        <span>Status</span>
        <span>Action</span>
      </div>

      <div className="divide-y">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="grid animate-pulse gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(170px,0.7fr)_190px_130px_130px] lg:items-center lg:gap-5 lg:px-6"
            >
              <div className="h-11 rounded-md bg-slate-100" />
              <div className="h-9 rounded-md bg-slate-100" />
              <div className="h-9 rounded-md bg-slate-100" />
              <div className="h-7 rounded-full bg-slate-100" />
              <div className="h-9 rounded-md bg-slate-100" />
            </div>
          ))
        ) : appointments.length ? (
          appointments.map((appointment) => {
            const schedule = formatSchedule(appointment.scheduled_at)

            return (
              <article
                key={appointment.id}
                className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(170px,0.7fr)_190px_130px_130px] lg:items-center lg:gap-5 lg:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <CalendarCheck className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{appointment.purpose}</h3>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {appointment.appointment_number}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 text-sm">
                  <p className="truncate font-medium">{appointment.department}</p>
                  <p className="mt-0.5 text-muted-foreground">Requested office</p>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{schedule.date}</p>
                    <p className="text-muted-foreground">{schedule.time}</p>
                  </div>
                </div>

                <div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'border-0 capitalize',
                      statusStyles[appointment.status] ?? 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {formatStatus(appointment.status)}
                  </Badge>
                </div>

                <div className="lg:flex lg:justify-start">
                  <AppointmentDetailsDialog appointment={appointment} mode="activity" />
                </div>
              </article>
            )
          })
        ) : (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Inbox className="size-5" />
            </div>
            <p className="mt-4 font-medium">No appointments found</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Appointment requests that match this view will appear here.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p className="text-sm text-muted-foreground">
          Page {meta.current_page} of {meta.last_page} - {meta.total} appointment
          {meta.total === 1 ? '' : 's'}
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={page >= meta.last_page || isLoading}
            onClick={() => setPage((current) => Math.min(current + 1, meta.last_page))}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {selectedAppointment ? (
        <AppointmentDetailsDialog
          appointment={selectedAppointment}
          mode="activity"
          open={Boolean(selectedAppointment)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) closeSelectedAppointment()
          }}
          hideTrigger
        />
      ) : null}
    </section>
  )
}
