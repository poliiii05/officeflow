import { useState, type FormEvent } from 'react'
import { CalendarCheck } from 'lucide-react'

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
    } catch {
      setError('Unable to book appointment. Please check your schedule and try again.')
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

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book appointment</DialogTitle>
          <DialogDescription>
            Request a schedule with the office team.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="appointmentPurpose">Purpose</Label>
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
              <Label htmlFor="appointmentDepartment">Department</Label>
              <select
                id="appointmentDepartment"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option>Front Desk</option>
                <option>Admin Office</option>
                <option>HR Office</option>
                <option>IT Support</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointmentSchedule">Schedule</Label>
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
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button className="w-full cursor-pointer" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Booking...' : 'Book appointment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}