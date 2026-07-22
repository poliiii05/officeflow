import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  CalendarClock,
  Eye,
  FileText,
  Hash,
  Layers,
  Mail,
  MessageSquareText,
  Send,
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
import { Textarea } from '@/components/ui/textarea'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import {
  createTicketActivity,
  getTicketActivities,
  type Ticket,
  type TicketActivity,
  type TicketStatus,
} from '@/features/tickets/ticket-api'
import { echo } from '@/lib/echo'
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

type TicketDetailsMode = 'queue' | 'work' | 'readonly'

type TicketDetailsDialogProps = {
  ticket: Ticket
  mode?: TicketDetailsMode
  footerAction?: ReactNode
  isUpdating?: boolean
  onStatusChange?: (ticketId: number, status: TicketStatus) => void
}

function formatStatus(status: string) {
  return status.replace('_', ' ')
}

export function TicketDetailsDialog({
  ticket,
  mode = 'readonly',
  footerAction,
  isUpdating = false,
  onStatusChange,
}: TicketDetailsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activities, setActivities] = useState<TicketActivity[]>([])
  const [reply, setReply] = useState('')
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [activityError, setActivityError] = useState('')

  const isUnassigned = ticket.assigned_to_id === null
  const showStaffControls = mode === 'work'
  const showActivity = mode === 'work'

  useEffect(() => {
    if (!isOpen || !showActivity) return

    async function loadActivities() {
      setIsLoadingActivities(true)
      setActivityError('')

      try {
        const response = await getTicketActivities(ticket.id)
        setActivities(response.data)
      } catch (error) {
        setActivityError(getApiErrorMessage(error, 'Unable to load ticket activity.'))
      } finally {
        setIsLoadingActivities(false)
      }
    }

    void loadActivities()
  }, [isOpen, showActivity, ticket.id])

  useEffect(() => {
    if (!isOpen || !showActivity) return

    const channel = echo.channel(`officeflow.ticket.${ticket.id}`)

    channel.listen('.ticket.activity.created', (event: { data: TicketActivity }) => {
      setActivities((current) =>
        current.some((activity) => activity.id === event.data.id)
          ? current
          : [...current, event.data]
      )
    })

    return () => {
      channel.stopListening('.ticket.activity.created')
      echo.leaveChannel(`officeflow.ticket.${ticket.id}`)
    }
  }, [isOpen, showActivity, ticket.id])

  async function handleReplySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const message = reply.trim()
    if (!message) return

    setIsSendingReply(true)
    setActivityError('')

    try {
      const response = await createTicketActivity(ticket.id, message)
      setActivities((current) => [...current, response.data])
      setReply('')
    } catch (error) {
      setActivityError(getApiErrorMessage(error, 'Unable to add reply.'))
    } finally {
      setIsSendingReply(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground">
        <Eye className="size-4" />
        View details
      </DialogTrigger>

      <DialogContent className="flex !max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-lg p-0">
        <div className="shrink-0 border-b bg-gradient-to-r from-sky-50 via-white to-emerald-50 px-6 py-5">
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
                  Ticket details and requester information.
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

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {showStaffControls ? (
            <section className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-medium">Staff control</p>
                  <p className="text-sm text-muted-foreground">
                    Update the ticket status as work progresses.
                  </p>
                </div>

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
            </section>
          ) : null}

          <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm sm:grid-cols-2">
            <InfoItem icon={Hash} label="Ticket number" value={ticket.ticket_number} />
            <InfoItem icon={CalendarClock} label="Created" value={new Date(ticket.created_at).toLocaleString()} />
            <InfoItem icon={Layers} label="Department" value={ticket.department} />
            <InfoItem icon={Tag} label="Category" value={ticket.category} />
            <InfoItem icon={UserRound} label="Requester" value={ticket.requester?.name ?? 'Unknown requester'} />
            <InfoItem icon={Mail} label="Requester email" value={ticket.requester?.email ?? 'No email available'} />
            <InfoItem
              icon={UserCheck}
              label="Assigned staff"
              value={ticket.assigned_to?.name ?? 'Unassigned'}
              className="sm:col-span-2"
            />
          </div>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <p className="font-medium">Description</p>
            </div>
            <p className="max-h-40 overflow-y-auto rounded-lg border bg-background p-4 text-sm leading-6 text-muted-foreground">
              {ticket.description}
            </p>
          </section>

          {showActivity ? (
            <section className="rounded-lg border bg-slate-50/70 p-4">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquareText className="size-4 text-slate-600" />
                <div>
                  <p className="font-medium">Request activity</p>
                  <p className="text-sm text-muted-foreground">
                    Staff replies and requester updates for this ticket.
                  </p>
                </div>
              </div>

              {activityError ? (
                <div className="mb-3 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {activityError}
                </div>
              ) : null}

              <div className="max-h-44 space-y-3 overflow-y-auto rounded-lg border bg-background p-3">
                {isLoadingActivities ? (
                  <p className="text-sm text-muted-foreground">Loading activity...</p>
                ) : activities.length ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="rounded-lg border bg-muted/30 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{activity.user?.name ?? 'OfficeFlow'}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {activity.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No activity yet. Add the first update for this ticket.
                  </p>
                )}
              </div>

              <form onSubmit={handleReplySubmit} className="mt-4 space-y-3">
                <Textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Write a reply or status update..."
                  className="min-h-20 resize-none bg-background"
                />

                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isSendingReply || !reply.trim()}
                >
                  Send update
                  <Send className="size-4" />
                </Button>
              </form>
            </section>
          ) : null}
        </div>

        {footerAction ? (
          <div className="shrink-0 border-t bg-background px-6 py-4">
            {footerAction}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn('flex gap-3 rounded-lg bg-background p-3', className)}>
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-muted-foreground">{label}</p>
        <p className="break-words font-medium">{value}</p>
      </div>
    </div>
  )
}