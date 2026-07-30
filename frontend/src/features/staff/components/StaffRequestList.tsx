import { CalendarCheck, ChevronLeft, ChevronRight, FileText } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Appointment } from '@/features/appointments/appointment-api'
import { AppointmentDetailsDialog } from '@/features/appointments/components/AppointmentDetailsDialog'
import type { Ticket } from '@/features/tickets/ticket-api'
import { TicketDetailsDialog } from '@/features/tickets/components/TicketDetailsDialog'
import { cn } from '@/lib/utils'

export type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const statusStyles: Record<string, string> = {
  open: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-200 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-sky-100 text-sky-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-200 text-slate-700',
}

function formatStatus(status: string) {
  return status.replace('_', ' ')
}

export function TicketRequestList({
  title,
  description,
  tickets,
  meta,
  emptyMessage,
  isLoading,
  canManage,
  updatingKey,
  onStatusChange,
  onPrevious,
  onNext,
}: {
  title: string
  description: string
  tickets: Ticket[]
  meta: PaginationMeta
  emptyMessage: string
  isLoading: boolean
  canManage?: boolean
  updatingKey?: string | null
  onStatusChange?: (ticketId: number, status: Ticket['status']) => void
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-sky-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b bg-sky-50/70 px-5 py-4">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <FileText className="size-5 text-sky-700" />
      </div>

      {isLoading ? (
        <div className="px-5 py-8 text-sm text-muted-foreground">Loading tickets...</div>
      ) : tickets.length ? (
        <div className="divide-y">
          {tickets.map((ticket) => (
            <article
              key={ticket.id}
              className="grid gap-4 px-5 py-4 transition-colors hover:bg-slate-50 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
            >
              <TicketSummary ticket={ticket} />

              <TicketDetailsDialog
                ticket={ticket}
                mode={canManage ? 'work' : 'readonly'}
                isUpdating={updatingKey === `ticket-${ticket.id}`}
                onStatusChange={canManage ? onStatusChange : undefined}
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-sm text-muted-foreground">{emptyMessage}</div>
      )}

      <PaginationFooter meta={meta} onPrevious={onPrevious} onNext={onNext} />
    </section>
  )
}

export function AppointmentRequestList({
  title,
  description,
  appointments,
  meta,
  emptyMessage,
  isLoading,
  canManage,
  updatingKey,
  onStatusChange,
  onPrevious,
  onNext,
}: {
  title: string
  description: string
  appointments: Appointment[]
  meta: PaginationMeta
  emptyMessage: string
  isLoading: boolean
  canManage?: boolean
  updatingKey?: string | null
  onStatusChange?: (appointmentId: number, status: Appointment['status']) => void
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b bg-emerald-50/70 px-5 py-4">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <CalendarCheck className="size-5 text-emerald-700" />
      </div>

      {isLoading ? (
        <div className="px-5 py-8 text-sm text-muted-foreground">Loading appointments...</div>
      ) : appointments.length ? (
        <div className="divide-y">
          {appointments.map((appointment) => (
            <article
              key={appointment.id}
              className="grid gap-4 px-5 py-4 transition-colors hover:bg-slate-50 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
            >
              <AppointmentSummary appointment={appointment} />

              <AppointmentDetailsDialog
                appointment={appointment}
                mode={canManage ? 'work' : 'readonly'}
                isUpdating={updatingKey === `appointment-${appointment.id}`}
                onStatusChange={canManage ? onStatusChange : undefined}
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-sm text-muted-foreground">{emptyMessage}</div>
      )}

      <PaginationFooter meta={meta} onPrevious={onPrevious} onNext={onNext} />
    </section>
  )
}

function TicketSummary({ ticket }: { ticket: Ticket }) {
  return (
    <div className="flex min-w-0 gap-3">
      <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
        <FileText className="size-4" />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{ticket.subject}</p>
          <Badge variant="secondary" className={cn('border-0 capitalize', statusStyles[ticket.status])}>
            {formatStatus(ticket.status)}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {ticket.priority}
          </Badge>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {ticket.ticket_number} - {ticket.department} - {ticket.category}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Requester: <span className="font-medium text-foreground">{ticket.requester?.name ?? 'Unknown'}</span>
        </p>
      </div>
    </div>
  )
}

function AppointmentSummary({ appointment }: { appointment: Appointment }) {
  return (
    <div className="flex min-w-0 gap-3">
      <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
        <CalendarCheck className="size-4" />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{appointment.purpose}</p>
          <Badge variant="secondary" className={cn('border-0 capitalize', statusStyles[appointment.status])}>
            {formatStatus(appointment.status)}
          </Badge>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {appointment.appointment_number} - {appointment.department} - {new Date(appointment.scheduled_at).toLocaleString()}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Requester: <span className="font-medium text-foreground">{appointment.requester?.name ?? 'Unknown'}</span>
        </p>
      </div>
    </div>
  )
}

function PaginationFooter({
  meta,
  onPrevious,
  onNext,
}: {
  meta: PaginationMeta
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between border-t bg-slate-50/70 px-5 py-4">
      <p className="text-sm text-muted-foreground">
        Page {meta.current_page} of {meta.last_page}
      </p>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="cursor-pointer bg-white" disabled={meta.current_page <= 1} onClick={onPrevious}>
          <ChevronLeft className="size-4" />
          Previous
        </Button>

        <Button variant="outline" size="sm" className="cursor-pointer bg-white" disabled={meta.current_page >= meta.last_page} onClick={onNext}>
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}