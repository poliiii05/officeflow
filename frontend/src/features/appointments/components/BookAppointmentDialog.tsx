import { useState, type FormEvent } from 'react'
import { AlertCircle, CalendarCheck, Clock, Layers, NotebookText, Send } from 'lucide-react'
import { getApiErrorMessage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createAppointment } from '@/features/appointments/appointment-api'

type BookAppointmentDialogProps = {
  onCreated?: () => void
}

export function BookAppointmentDialog({ onCreated }: BookAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [purpose, setPurpose] = useState('')
  const [department, setDepartment] = useState('Front Desk')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await createAppointment({
        purpose,
        department,
        scheduled_at: scheduledAt,
        notes: notes || undefined,
      })

      onCreated?.()

      setPurpose('')
      setDepartment('Front Desk')
      setScheduledAt('')
      setNotes('')
      setOpen(false)
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to book appointment. Please check your details and try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground">
        <CalendarCheck className="size-4" />
        Book appointment
      </DialogTrigger>

      <DialogContent className="!max-w-2xl overflow-hidden rounded-2xl p-0">
        <div className="border-b bg-muted/30 px-6 py-5">
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarCheck className="size-5" />
            </div>
            <DialogTitle className="text-xl">Book appointment</DialogTitle>
            <DialogDescription>
              Request a schedule with the office team and track its approval.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5 px-6 py-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="appointmentPurpose" className="flex items-center gap-2">
              <NotebookText className="size-4 text-muted-foreground" />
              Purpose
            </Label>
            <Input
              id="appointmentPurpose"
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              placeholder="Document verification"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="appointmentDepartment" className="flex items-center gap-2">
                <Layers className="size-4 text-muted-foreground" />
                Department
              </Label>
              <select
                id="appointmentDepartment"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="h-10 w-full cursor-pointer rounded-md border bg-background px-3 text-sm"
              >
                <option>Front Desk</option>
                <option>Admin Office</option>
                <option>HR Office</option>
                <option>IT Support</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointmentSchedule" className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                Schedule
              </Label>
              <Input
                id="appointmentSchedule"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointmentNotes">Notes</Label>
            <Textarea
              id="appointmentNotes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add helpful details..."
              className="min-h-28 resize-none"
            />
          </div>

          {error ? (
            <div className="flex gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          <Button className="h-11 w-full cursor-pointer" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Booking appointment...' : 'Book appointment'}
            <Send className="size-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}