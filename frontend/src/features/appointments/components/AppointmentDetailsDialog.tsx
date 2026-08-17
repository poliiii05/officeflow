import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  CalendarCheck,
  CalendarClock,
  Hash,
  Layers,
  Mail,
  MessageSquareText,
  NotebookText,
  Send,
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
import {
  createAppointmentActivity,
  getAppointmentActivities,
  type Appointment,
  type AppointmentActivity,
  type AppointmentStatus,
} from '@/features/appointments/appointment-api'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import { echo } from '@/lib/echo'
import { cn } from '@/lib/utils'

const appointmentStatusOptions: AppointmentStatus[] = [
  'pending',
  'scheduled',
  'completed',
  'cancelled',
]

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-sky-100 text-sky-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-200 text-slate-700',
}

type AppointmentDetailsMode = 'queue' | 'work' | 'readonly' | 'activity'

type AppointmentDetailsDialogProps = {
  appointment: Appointment
  mode?: AppointmentDetailsMode
  footerAction?: ReactNode
  isUpdating?: boolean
  onStatusChange?: (appointmentId: number, status: AppointmentStatus) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

function formatStatus(status: string) {
  return status.replace('_', ' ')
}

export function AppointmentDetailsDialog({
  appointment,
  mode = 'readonly',
  footerAction,
  isUpdating = false,
  onStatusChange,
  open,
  onOpenChange,
  hideTrigger = false,
}: AppointmentDetailsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen

  const [activities, setActivities] = useState<AppointmentActivity[]>([])
  const [reply, setReply] = useState('')
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [activityError, setActivityError] = useState('')

  const isUnassigned = appointment.assigned_to_id === null
  const showStaffControls = mode === 'work'
  const showActivity = mode === 'work' || mode === 'activity'

  useEffect(() => {
    if (!isOpen || !showActivity) return

    async function loadActivities() {
      setIsLoadingActivities(true)
      setActivityError('')

      try {
        const response = await getAppointmentActivities(appointment.id)
        setActivities(response.data)
      } catch (error) {
        setActivityError(getApiErrorMessage(error, 'Unable to load appointment activity.'))
      } finally {
        setIsLoadingActivities(false)
      }
    }

    void loadActivities()
  }, [isOpen, showActivity, appointment.id])

  useEffect(() => {
    if (!isOpen || !showActivity) return

    const channel = echo.channel(`officeflow.appointment.${appointment.id}`)

    channel.listen('.appointment.activity.created', (event: { data: AppointmentActivity }) => {
      setActivities((current) =>
        current.some((activity) => activity.id === event.data.id)
          ? current
          : [...current, event.data]
      )
    })

    return () => {
      channel.stopListening('.appointment.activity.created')
      echo.leaveChannel(`officeflow.appointment.${appointment.id}`)
    }
  }, [isOpen, showActivity, appointment.id])

  async function handleReplySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const message = reply.trim()
    if (!message) return

    setIsSendingReply(true)
    setActivityError('')

    try {
      const response = await createAppointmentActivity(appointment.id, message)

      setActivities((current) =>
        current.some((activity) => activity.id === response.data.id)
          ? current
          : [...current, response.data]
      )

      setReply('')
    } catch (error) {
      setActivityError(getApiErrorMessage(error, 'Unable to add appointment update.'))
    } finally {
      setIsSendingReply(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!hideTrigger ? (
        <DialogTrigger className="inline-flex h-9 min-w-[9rem] shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground">
          View details
        </DialogTrigger>
      ) : null}

      <DialogContent className="flex !max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-lg p-0">
        <div className="shrink-0 border-b bg-gradient-to-r from-emerald-50 via-white to-amber-50 px-6 py-5">
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
                  Appointment request details and requester information.
                </DialogDescription>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary" className={cn('border-0 capitalize', statusStyles[appointment.status])}>
                    {formatStatus(appointment.status)}
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
            <section className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-medium">Status control</p>
                  <p className="text-sm text-muted-foreground">
                    Update the appointment request after review.
                  </p>
                </div>

                <select
                  value={appointment.status}
                  disabled={!onStatusChange || isUpdating}
                  onChange={(event) =>
                    onStatusChange?.(appointment.id, event.target.value as AppointmentStatus)
                  }
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
          ) : null}

          <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm sm:grid-cols-2">
            <InfoItem icon={Hash} label="Appointment number" value={appointment.appointment_number} />
            <InfoItem icon={CalendarClock} label="Schedule" value={new Date(appointment.scheduled_at).toLocaleString()} />
            <InfoItem icon={Layers} label="Department" value={appointment.department} />
            <InfoItem icon={UserRound} label="Requester" value={appointment.requester?.name ?? 'Unknown requester'} />
            <InfoItem icon={Mail} label="Requester email" value={appointment.requester?.email ?? 'No email available'} />
            <InfoItem
              icon={UserCheck}
              label="Assigned staff"
              value={appointment.assigned_to?.name ?? 'Unassigned'}
              className="sm:col-span-2"
            />
          </div>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <NotebookText className="size-4 text-muted-foreground" />
              <p className="font-medium">Notes</p>
            </div>

            <p className="max-h-40 overflow-y-auto rounded-lg border bg-background p-4 text-sm leading-6 text-muted-foreground">
              {appointment.notes || 'No notes added.'}
            </p>
          </section>

          {showActivity ? (
            <section className="rounded-lg border bg-emerald-50/50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquareText className="size-4 text-emerald-700" />
                <div>
                  <p className="font-medium">Appointment activity</p>
                  <p className="text-sm text-muted-foreground">
                    Staff replies and requester updates for this appointment.
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
                    No activity yet. Add the first update for this appointment.
                  </p>
                )}
              </div>

              <form onSubmit={handleReplySubmit} className="mt-4 space-y-3">
                <Textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Write an appointment update..."
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