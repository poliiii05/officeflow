import {
  CalendarClock,
  Eye,
  FileText,
  Hash,
  Layers,
  Mail,
  Tag,
  UserCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Ticket, TicketStatus } from '@/features/tickets/ticket-api'
import { cn } from '@/lib/utils'

const ticketStatusOptions: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

const statusStyles: Record<string, string> = {
  open: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-200 text-slate-700',
}

const priorityStyles: Record<string, string> = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-sky-200 bg-sky-50 text-sky-700',
  high: 'border-amber-200 bg-amber-50 text-amber-700',
  urgent: 'border-red-200 bg-red-50 text-red-700',
}

type TicketDetailsDialogProps = {
  ticket: Ticket
  isUpdating?: boolean
  onClaimTicket?: (ticketId: number) => void
  onStatusChange?: (ticketId: number, status: TicketStatus) => void
}

function formatStatus(status: string) {
  return status.replace('_', ' ')
}

export function TicketDetailsDialog({
  ticket,
  isUpdating = false,
  onClaimTicket,
  onStatusChange,
}: TicketDetailsDialogProps) {
  const isUnassigned = ticket.assigned_to_id === null

  return (
    <Dialog>
      <DialogTrigger className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground">
        <Eye className="size-4" />
        View details
      </DialogTrigger>

      <DialogContent className="!max-w-2xl overflow-hidden rounded-lg p-0">
        <div className="border-b bg-gradient-to-r from-sky-50 via-white to-emerald-50 px-6 py-5">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <FileText className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <DialogTitle className="break-words text-2xl leading-tight">
                  {ticket.subject}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Ticket details, requester information, and staff controls.
                </DialogDescription>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary" className={cn('border-0 capitalize', statusStyles[ticket.status])}>
                    {formatStatus(ticket.status)}
                  </Badge>

                  <Badge variant="outline" className={cn('capitalize', priorityStyles[ticket.priority])}>
                    {ticket.priority} priority
                  </Badge>

                  {isUnassigned ? (
                    <Badge variant="secondary" className="border-0 bg-violet-100 text-violet-700">
                      Unassigned
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          <section className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Staff control</p>
                <p className="text-sm text-muted-foreground">
                  Claim the ticket or update its status as work progresses.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {isUnassigned && onClaimTicket ? (
                  <Button
                    type="button"
                    className="cursor-pointer"
                    disabled={isUpdating}
                    onClick={() => onClaimTicket(ticket.id)}
                  >
                    <UserCheck className="size-4" />
                    Claim ticket
                  </Button>
                ) : null}

                <select
                  value={ticket.status}
                  disabled={!onStatusChange || isUpdating}
                  onChange={(event) => onStatusChange?.(ticket.id, event.target.value as TicketStatus)}
                  className="h-10 min-w-44 cursor-pointer rounded-md border bg-background px-3 text-sm capitalize disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ticketStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm sm:grid-cols-2">
            <InfoItem icon={Hash} label="Ticket number" value={ticket.ticket_number} />
            <InfoItem icon={CalendarClock} label="Created" value={new Date(ticket.created_at).toLocaleString()} />
            <InfoItem icon={Layers} label="Department" value={ticket.department} />
            <InfoItem icon={Tag} label="Category" value={ticket.category} />
            <InfoItem icon={UserRound} label="Requester" value={ticket.requester?.name ?? 'Unknown requester'} />
            <InfoItem icon={Mail} label="Requester email" value={ticket.requester?.email ?? 'No email available'} />
            <InfoItem icon={UserCheck} label="Assigned staff" value={ticket.assigned_to?.name ?? 'Unassigned'} />
          </div>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <p className="font-medium">Description</p>
            </div>

            <p className="max-h-56 overflow-y-auto rounded-lg border bg-background p-4 text-sm leading-6 text-muted-foreground">
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
      <div className="min-w-0">
        <p className="text-muted-foreground">{label}</p>
        <p className="break-words font-medium">{value}</p>
      </div>
    </div>
  )
}