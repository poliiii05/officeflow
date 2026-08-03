import { useState, type FormEvent } from 'react'
import {
  AlertCircle,
  ClipboardList,
  Info,
  Layers,
  Plus,
  Send,
  Tag,
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
import { createTicket } from '@/features/tickets/ticket-api'
import { getApiErrorMessage } from '@/lib/api'

const otherOption = 'Others'

const serviceRequestCatalog = {
  'General Services': [
    'General Inquiry',
    'Service Follow-up',
    'Service Concern',
    otherOption,
  ],
  'Records Office': [
    'Document Request',
    'Document Correction',
    'Records Verification',
    otherOption,
  ],
  'Treasury Office': [
    'Payment Concern',
    'Billing Inquiry',
    'Receipt Request',
    otherOption,
  ],
  'Permits Office': [
    'Application Follow-up',
    'Permit Correction',
    'Requirements Assistance',
    otherOption,
  ],
  'Online Services': [
    'Portal Access',
    'Account Concern',
    'Online Service Issue',
    otherOption,
  ],
  [otherOption]: [otherOption],
} as const

type Department = keyof typeof serviceRequestCatalog

const defaultDepartment: Department = 'General Services'
const defaultCategory = serviceRequestCatalog[defaultDepartment][0]

type NewTicketDialogProps = {
  onCreated?: () => void
}

export function NewTicketDialog({ onCreated }: NewTicketDialogProps) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [department, setDepartment] = useState<Department>(defaultDepartment)
  const [category, setCategory] = useState<string>(defaultCategory)
  const [customDepartment, setCustomDepartment] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  function resetForm() {
    setSubject('')
    setDescription('')
    setDepartment(defaultDepartment)
    setCategory(defaultCategory)
    setCustomDepartment('')
    setCustomCategory('')
    setError('')
  }

  function handleDepartmentChange(nextDepartment: Department) {
    setDepartment(nextDepartment)
    setCategory(serviceRequestCatalog[nextDepartment][0])
    setCustomDepartment('')
    setCustomCategory('')
  }

  const resolvedDepartment =
    department === otherOption ? customDepartment.trim() : department
  const resolvedCategory = category === otherOption ? customCategory.trim() : category
  const hasCompleteRouting = Boolean(resolvedDepartment && resolvedCategory)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        department: resolvedDepartment,
        category: resolvedCategory,
        // Receiving staff performs the actual priority triage.
        priority: 'medium',
      })

      resetForm()
      setOpen(false)
      onCreated?.()
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          'Unable to submit your service request. Please review the details and try again.'
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
      <DialogTrigger className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90">
        <Plus className="size-4" />
        New request
      </DialogTrigger>

      <DialogContent className="!max-w-2xl max-h-[calc(100vh-2rem)] justify-items-stretch gap-0 overflow-y-auto rounded-xl p-0">
        <div className="w-full border-b bg-sky-50/70 px-6 py-5 pr-14">
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <ClipboardList className="size-5" />
            </div>
            <DialogTitle className="text-xl">New service request</DialogTitle>
            <DialogDescription>
              Send a concern or document request to the appropriate office team.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="grid w-full gap-5 px-6 py-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="requestDepartment" className="flex items-center gap-2">
                <Layers className="size-4 text-muted-foreground" />
                Office
              </Label>
              <select
                id="requestDepartment"
                value={department}
                onChange={(event) =>
                  handleDepartmentChange(event.target.value as Department)
                }
                className="h-10 w-full cursor-pointer rounded-md border bg-background px-3 text-sm"
              >
                {Object.keys(serviceRequestCatalog).map((office) => (
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
                  aria-label="Other office name"
                  maxLength={100}
                  required
                />
              ) : null}
            </div>

            <div className="min-w-0 space-y-2">
              <Label htmlFor="requestCategory" className="flex items-center gap-2">
                <Tag className="size-4 text-muted-foreground" />
                Service type
              </Label>
              <select
                id="requestCategory"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value)
                  setCustomCategory('')
                }}
                className="h-10 w-full cursor-pointer rounded-md border bg-background px-3 text-sm"
              >
                {serviceRequestCatalog[department].map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>

              {category === otherOption ? (
                <Input
                  value={customCategory}
                  onChange={(event) => setCustomCategory(event.target.value)}
                  placeholder="Enter service type"
                  aria-label="Other service type"
                  maxLength={100}
                  required
                />
              ) : null}
            </div>
          </div>

          {category === otherOption || department === otherOption ? (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p className="leading-5">
                Describe the service you need and your expected outcome below.
                Staff will route the request to the correct office.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="requestSubject">Request summary</Label>
            <Input
              id="requestSubject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Example: Follow up on submitted document"
              maxLength={255}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestDescription">Details</Label>
            <Textarea
              id="requestDescription"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Explain what happened, what you need, and include any relevant date or reference number."
              className="min-h-32 resize-none"
              maxLength={5000}
              required
            />
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p className="leading-5">
              The receiving office will assess the request priority after review.
            </p>
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
            disabled={
              isSubmitting ||
              !subject.trim() ||
              !description.trim() ||
              !hasCompleteRouting
            }
          >
            {isSubmitting ? 'Submitting request...' : 'Submit request'}
            <Send className="size-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
