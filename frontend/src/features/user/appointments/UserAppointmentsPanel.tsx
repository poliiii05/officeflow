import { CalendarCheck, CalendarClock, Search } from 'lucide-react'
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
]

export function UserAppointmentsPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const openAppointmentId = Number(searchParams.get('open'))

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [openedAppointment, setOpenedAppointment] = useState<Appointment | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedAppointment = useMemo(
    () =>
      appointments.find((appointment) => appointment.id === openAppointmentId) ??
      openedAppointment,
    [appointments, openAppointmentId, openedAppointment]
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      async function loadAppointments() {
        setIsLoading(true)
        setError('')

        try {
          const response = await getAppointments({
            queue: 'all',
            status,
            search,
            page,
            per_page: 10,
          })

          setAppointments(response.data)
          setMeta(response.meta)
        } catch {
          setError('Unable to load appointments.')
        } finally {
          setIsLoading(false)
        }
      }

      void loadAppointments()
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [page, search, status])

  useEffect(() => {
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
        setOpenedAppointment(response.data)
      } catch {
        setError('Unable to open the selected appointment.')
      }
    }

    void loadOpenedAppointment()
  }, [appointments, openAppointmentId])

  function closeSelectedAppointment() {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('open')
    setSearchParams(nextParams, { replace: true })
    setOpenedAppointment(null)
  }

  return (
    <section className="mx-auto max-w-7xl overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b bg-emerald-50/50 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <CalendarCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Appointment requests</h2>
            <p className="text-sm text-muted-foreground">
              Track pending, scheduled, completed, and cancelled appointments.
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
            placeholder="Search purpose, number, department..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b px-6 py-4">
        {statusTabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => {
              setStatus(tab.value)
              setPage(1)
            }}
            className={cn(
              'h-9 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors',
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
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="divide-y">
        {isLoading ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">
            Loading appointments...
          </div>
        ) : appointments.length ? (
          appointments.map((appointment) => (
            <article
              key={appointment.id}
              className="grid gap-4 px-6 py-5 lg:grid-cols-[1fr_auto] lg:items-center"
            >
              <div className="flex min-w-0 gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <CalendarCheck className="size-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{appointment.purpose}</h3>
                    <Badge className={cn('border-0 capitalize', statusStyles[appointment.status])}>
                      {appointment.status}
                    </Badge>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {appointment.appointment_number} - {appointment.department}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    {new Date(appointment.scheduled_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <AppointmentDetailsDialog appointment={appointment} mode="activity" />
            </article>
          ))
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="font-medium">No appointments found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your appointment requests will appear here.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t bg-slate-50 px-6 py-4">
        <p className="text-sm text-muted-foreground">
          Page {meta.current_page} of {meta.last_page} - {meta.total} appointments
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={page >= meta.last_page}
            onClick={() => setPage((current) => Math.min(current + 1, meta.last_page))}
          >
            Next
          </Button>
        </div>
      </div>

      {selectedAppointment ? (
        <AppointmentDetailsDialog
          appointment={selectedAppointment}
          mode="activity"
          open={Boolean(selectedAppointment)}
          onOpenChange={(open) => {
            if (!open) closeSelectedAppointment()
          }}
          hideTrigger
        />
      ) : null}
    </section>
  )
}