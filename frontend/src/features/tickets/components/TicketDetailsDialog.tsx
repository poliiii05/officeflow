import { CalendarClock, Eye, FileText, Hash, Layers, Tag, type LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Ticket } from '@/features/tickets/ticket-api'
import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  open: 'bg-sky-500/10 text-sky-700',
  in_progress: 'bg-amber-500/10 text-amber-700',
  resolved: 'bg-emerald-500/10 text-emerald-700',
  closed: 'bg-slate-500/10 text-slate-700',
}

const priorityStyles: Record<string, string> = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-sky-200 bg-sky-50 text-sky-700',
  high: 'border-amber-200 bg-amber-50 text-amber-700',
  urgent: 'border-red-200 bg-red-50 text-red-700',
}

type TicketDetailsDialogProps = {
  ticket: Ticket
}

export function TicketDetailsDialog({ ticket }: TicketDetailsDialogProps) {
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
                <FileText className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <DialogTitle className="break-words text-2xl leading-tight">
                  {ticket.subject}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Ticket details and current request status.
                </DialogDescription>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className={cn('border-0 capitalize', statusStyles[ticket.status])}
                  >
                    {ticket.status.replace('_', ' ')}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={cn('capitalize', priorityStyles[ticket.priority])}
                  >
                    {ticket.priority} priority
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 text-sm sm:grid-cols-2">
            <InfoItem icon={Hash} label="Ticket number" value={ticket.ticket_number} />
            <InfoItem icon={CalendarClock} label="Created" value={new Date(ticket.created_at).toLocaleString()} />
            <InfoItem icon={Layers} label="Department" value={ticket.department} />
            <InfoItem icon={Tag} label="Category" value={ticket.category} />
          </div>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <p className="font-medium">Description</p>
            </div>

            <p className="max-h-56 overflow-y-auto rounded-xl border bg-background p-4 text-sm leading-6 text-muted-foreground">
              {ticket.description}
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