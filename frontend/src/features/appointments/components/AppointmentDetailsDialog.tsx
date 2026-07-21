import { CalendarClock, Eye, Hash, Layers, NotebookText, type LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Appointment } from '@/features/appointments/appointment-api'
import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-700',
  scheduled: 'bg-emerald-500/10 text-emerald-700',
  completed: 'bg-violet-500/10 text-violet-700',
  cancelled: 'bg-slate-500/10 text-slate-700',
}

type AppointmentDetailsDialogProps = {
  appointment: Appointment
}

export function AppointmentDetailsDialog({ appointment }: AppointmentDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground">
        <Eye className="size-4" />
        View details
      </DialogTrigger>

      <DialogContent className="!max-w-2xl overflow-hidden rounded-2xl p-0">
        <div className="border-b bg-muted/30 px-6 py-5">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarClock className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <DialogTitle className="break-words text-2xl leading-tight">
                  {appointment.purpose}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Appointment request details and schedule.
                </DialogDescription>

                <div className="mt-4">
                  <Badge
                    variant="secondary"
                    className={cn('border-0 capitalize', statusStyles[appointment.status])}
                  >
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 text-sm sm:grid-cols-2">
            <InfoItem icon={Hash} label="Appointment number" value={appointment.appointment_number} />
            <InfoItem icon={CalendarClock} label="Schedule" value={new Date(appointment.scheduled_at).toLocaleString()} />
            <InfoItem icon={Layers} label="Department" value={appointment.department} />
          </div>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <NotebookText className="size-4 text-muted-foreground" />
              <p className="font-medium">Notes</p>
            </div>

            <p className="max-h-56 overflow-y-auto rounded-xl border bg-background p-4 text-sm leading-6 text-muted-foreground">
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
      <div>
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}