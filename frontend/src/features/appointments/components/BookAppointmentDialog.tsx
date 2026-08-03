import { useState, type FormEvent } from 'react'
import {
  AlertCircle,
  CalendarCheck,
  Clock,
  Layers,
  NotebookText,
  Send,
} from 'lucide-react'

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
import { getApiErrorMessage } from '@/lib/api'

const otherOption = 'Others'

const appointmentCatalog = {
  'Front Desk': ['General Assistance', 'Information and Guidance', otherOption],
  'Records Office': ['Document Verification', 'Document Pickup', otherOption],
  'Treasury Office': ['Payment Consultation', 'Billing Review', otherOption],
  'Permits Office': ['Application Assessment', 'Permit Consultation', otherOption],
  'Admin Office': ['Administrative Meeting', 'Document Submission', otherOption],
  [otherOption]: [otherOption],
} as const

type Department = keyof typeof appointmentCatalog

const defaultDepartment: Department = 'Front Desk'
const defaultPurpose = appointmentCatalog[defaultDepartment][0]

function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

type BookAppointmentDialogProps = {
  onCreated?: () => void
}

export function BookAppointmentDialog({ onCreated }: BookAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [purpose, setPurpose] = useState<string>(defaultPurpose)
  const [department, setDepartment] = useState<Department>(defaultDepartment)
  const [customDepartment, setCustomDepartment] = useState('')
  const [customPurpose, setCustomPurpose] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const minimumSchedule = toDateTimeLocalValue(new Date(Date.now() + 30 * 60_000))

  function resetForm() {
    setPurpose(defaultPurpose)
    setDepartment(defaultDepartment)
    setCustomDepartment('')
    setCustomPurpose('')
    setScheduledAt('')
    setNotes('')
    setError('')
  }

  function handleDepartmentChange(nextDepartment: Department) {
    setDepartment(nextDepartment)
    setPurpose(appointmentCatalog[nextDepartment][0])
    setCustomDepartment('')
    setCustomPurpose('')
  }

  const resolvedDepartment =
    department === otherOption ? customDepartment.trim() : department
  const resolvedPurpose = purpose === otherOption ? customPurpose.trim() : purpose
  const hasCompleteService = Boolean(resolvedDepartment && resolvedPurpose)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await createAppointment({
        purpose: resolvedPurpose,
        department: resolvedDepartment,
        scheduled_at: scheduledAt,
        notes: notes.trim() || undefined,
      })

      resetForm()
      setOpen(false)
      onCreated?.()
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          'Unable to request this appointment. Please review the details and try again.'
        )
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen && !isSubmitting) resetForm()
      }}
    >
      <DialogTrigger className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground">
        <CalendarCheck className="size-4" />
        Book appointment
      </DialogTrigger>

      <DialogContent className="!max-w-2xl max-h-[calc(100vh-2rem)] justify-items-stretch gap-0 overflow-y-auto rounded-xl p-0">
        <div className="w-full border-b bg-emerald-50/70 px-6 py-5 pr-14">
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CalendarCheck className="size-5" />
            </div>
            <DialogTitle className="text-xl">Request an appointment</DialogTitle>
            <DialogDescription>
              Choose an office service and your preferred visit schedule.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="grid w-full gap-5 px-6 py-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="appointmentDepartment" className="flex items-center gap-2">
                <Layers className="size-4 text-muted-foreground" />
                Office
              </Label>
              <select
                id="appointmentDepartment"
                value={department}
                onChange={(event) =>
                  handleDepartmentChange(event.target.value as Department)
                }
                className="h-10 w-full cursor-pointer rounded-md border bg-background px-3 text-sm"
              >
                {Object.keys(appointmentCatalog).map((office) => (
                  <option key={office} value={office}>
                    {office}
                  </option>
                ))}
              </select>

              {department === otherOption ? (
                <Input
                  value={customDepartment}
                  onChange={(event) => setCustomDepartment(event.target.value)}
                  placeholder="Enter office name"
                  aria-label="Other appointment office name"
                  maxLength={100}
                  required
                />
              ) : null}
            </div>

            <div className="min-w-0 space-y-2">
              <Label htmlFor="appointmentPurpose" className="flex items-center gap-2">
                <NotebookText className="size-4 text-muted-foreground" />
                Service
              </Label>
              <select
                id="appointmentPurpose"
                value={purpose}
                onChange={(event) => {
                  setPurpose(event.target.value)
                  setCustomPurpose('')
                }}
                className="h-10 w-full cursor-pointer rounded-md border bg-background px-3 text-sm"
              >
                {appointmentCatalog[department].map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>

              {purpose === otherOption ? (
                <Input
                  value={customPurpose}
                  onChange={(event) => setCustomPurpose(event.target.value)}
                  placeholder="Enter service type"
                  aria-label="Other appointment service type"
                  maxLength={255}
                  required
                />
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointmentSchedule" className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              Preferred schedule
            </Label>
            <Input
              id="appointmentSchedule"
              type="datetime-local"
              min={minimumSchedule}
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              The office may confirm or adjust the requested schedule.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointmentNotes">Additional details</Label>
            <Textarea
              id="appointmentNotes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add reference numbers, required documents, or other helpful context."
              className="min-h-24 resize-none"
              maxLength={3000}
            />
          </div>

          {error ? (
            <div className="flex gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          <Button
            className="h-11 w-full cursor-pointer"
            type="submit"
            disabled={isSubmitting || !scheduledAt || !hasCompleteService}
          >
            {isSubmitting ? 'Submitting appointment...' : 'Request appointment'}
            <Send className="size-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
