import {
  CalendarCheck,
  CalendarClock,
  Eye,
  Hash,
  Layers,
  Mail,
  NotebookText,
  UserCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Appointment, AppointmentStatus } from '@/features/appointments/appointment-api'
import { cn } from '@/lib/utils'

const appointmentStatusOptions: AppointmentStatus[] = ['pending', 'scheduled', 'completed', 'cancelled']

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-sky-100 text-sky-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-200 text-slate-700',
}

type AppointmentDetailsDialogProps = {
  appointment: Appointment
  isUpdating?: boolean
  onStatusChange?: (appointmentId: number, status: AppointmentStatus) => void
}

function formatStatus(status: string) {
  return status.replace('_', ' ')
}

export function AppointmentDetailsDialog({
  appointment,
  isUpdating = false,
  onStatusChange,
}: AppointmentDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground">
        <Eye className="size-4" />
        View details
      </DialogTrigger>

      <DialogContent className="!max-w-2xl overflow-hidden rounded-lg p-0">
        <div className="border-b bg-gradient-to-r from-emerald-50 via-white to-amber-50 px-6 py-5">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <CalendarCheck className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <DialogTitle className="break-words text-2xl leading-tight">
                  {appointment.purpose}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Appointment request details, requester information, and staff controls.
                </DialogDescription>

                <div className="mt-4">
                  <Badge variant="secondary" className={cn('border-0 capitalize', statusStyles[appointment.status])}>
                    {formatStatus(appointment.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          <section className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Status control</p>
                <p className="text-sm text-muted-foreground">
                  Update the appointment request after review.
                </p>
              </div>

              <select
                value={appointment.status}
                disabled={!onStatusChange || isUpdating}
                onChange={(event) => onStatusChange?.(appointment.id, event.target.value as AppointmentStatus)}
                className="h-10 min-w-44 cursor-pointer rounded-md border bg-background px-3 text-sm capitalize disabled:cursor-not-allowed disabled:opacity-60"
              >
                {appointmentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm sm:grid-cols-2">
            <InfoItem icon={Hash} label="Appointment number" value={appointment.appointment_number} />
            <InfoItem icon={CalendarClock} label="Schedule" value={new Date(appointment.scheduled_at).toLocaleString()} />
            <InfoItem icon={Layers} label="Department" value={appointment.department} />
            <InfoItem icon={UserRound} label="Requester" value={appointment.requester?.name ?? 'Unknown requester'} />
            <InfoItem icon={Mail} label="Requester email" value={appointment.requester?.email ?? 'No email available'} />
            <InfoItem icon={UserCheck} label="Assigned staff" value={appointment.assigned_to?.name ?? 'Unassigned'} />
          </div>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <NotebookText className="size-4 text-muted-foreground" />
              <p className="font-medium">Notes</p>
            </div>

            <p className="max-h-56 overflow-y-auto rounded-lg border bg-background p-4 text-sm leading-6 text-muted-foreground">
              {appointment.notes || 'No notes added.'}
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3 rounded-lg bg-background p-3">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-muted-foreground">{label}</p>
        <p className="break-words font-medium">{value}</p>
      </div>
    </div>
  )
}