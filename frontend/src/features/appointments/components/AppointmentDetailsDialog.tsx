import { CalendarClock, Eye, Hash, NotebookText } from 'lucide-react'

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
        View
      </DialogTrigger>

      <DialogContent className="!max-w-xl">
        <DialogHeader>
          <DialogTitle>{appointment.purpose}</DialogTitle>
          <DialogDescription>
            Appointment request details and schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Badge variant="secondary" className={cn('border-0 capitalize', statusStyles[appointment.status])}>
            {appointment.status}
          </Badge>

          <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-2">
            <div className="flex gap-3">
              <Hash className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Appointment number</p>
                <p className="font-medium">{appointment.appointment_number}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <CalendarClock className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Schedule</p>
                <p className="font-medium">{new Date(appointment.scheduled_at).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground">Department</p>
              <p className="font-medium">{appointment.department}</p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <NotebookText className="size-4 text-muted-foreground" />
              <p className="font-medium">Notes</p>
            </div>
            <p className="rounded-lg border bg-background p-4 text-sm leading-6 text-muted-foreground">
              {appointment.notes || 'No notes added.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}