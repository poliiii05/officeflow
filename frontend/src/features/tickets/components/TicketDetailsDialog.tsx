import { CalendarClock, Eye, FileText, Hash } from 'lucide-react'

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

type TicketDetailsDialogProps = {
  ticket: Ticket
}

export function TicketDetailsDialog({ ticket }: TicketDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground">
        <Eye className="size-4" />
        View
      </DialogTrigger>

      <DialogContent className="!max-w-xl">
        <DialogHeader>
          <DialogTitle>{ticket.subject}</DialogTitle>
          <DialogDescription>
            Ticket details and current request status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className={cn('border-0 capitalize', statusStyles[ticket.status])}>
              {ticket.status.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {ticket.priority} priority
            </Badge>
          </div>

          <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-2">
            <div className="flex gap-3">
              <Hash className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Ticket number</p>
                <p className="font-medium">{ticket.ticket_number}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <CalendarClock className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{new Date(ticket.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground">Department</p>
              <p className="font-medium">{ticket.department}</p>
            </div>

            <div>
              <p className="text-muted-foreground">Category</p>
              <p className="font-medium">{ticket.category}</p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <p className="font-medium">Description</p>
            </div>
            <p className="rounded-lg border bg-background p-4 text-sm leading-6 text-muted-foreground">
              {ticket.description}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}