import { useState, type FormEvent } from 'react'
import { AlertCircle, FileText, Layers, Plus, Send, Tag } from 'lucide-react'
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
import { createTicket, type TicketPriority } from '@/features/tickets/ticket-api'

type NewTicketDialogProps = {
  onCreated?: () => void
}

export function NewTicketDialog({ onCreated }: NewTicketDialogProps) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [department, setDepartment] = useState('IT Support')
  const [category, setCategory] = useState('Technical Support')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await createTicket({
        subject,
        description,
        department,
        category,
        priority,
      })

      onCreated?.()

      setSubject('')
      setDescription('')
      setDepartment('IT Support')
      setCategory('Technical Support')
      setPriority('medium')
      setOpen(false)
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to create ticket. Please check your details and try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90">
        <Plus className="size-4" />
        New ticket
      </DialogTrigger>

      <DialogContent className="!max-w-2xl overflow-hidden rounded-2xl p-0">
        <div className="border-b bg-muted/30 px-6 py-5">
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <DialogTitle className="text-xl">Create new ticket</DialogTitle>
            <DialogDescription>
              Send a request to the office team and track its progress.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5 px-6 py-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="ticketSubject">Subject</Label>
            <Input
              id="ticketSubject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Printer offline - 3rd floor"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticketDescription">Description</Label>
            <Textarea
              id="ticketDescription"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the issue or request..."
              className="min-h-28 resize-none"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ticketDepartment" className="flex items-center gap-2">
                <Layers className="size-4 text-muted-foreground" />
                Department
              </Label>
              <select
                id="ticketDepartment"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="h-10 w-full cursor-pointer rounded-md border bg-background px-3 text-sm"
              >
                <option>IT Support</option>
                <option>Front Desk</option>
                <option>Admin Office</option>
                <option>HR Office</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketCategory" className="flex items-center gap-2">
                <Tag className="size-4 text-muted-foreground" />
                Category
              </Label>
              <select
                id="ticketCategory"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-10 w-full cursor-pointer rounded-md border bg-background px-3 text-sm"
              >
                <option>Technical Support</option>
                <option>Document Request</option>
                <option>Facility Request</option>
                <option>General Request</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketPriority">Priority</Label>
              <select
                id="ticketPriority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as TicketPriority)}
                className="h-10 w-full cursor-pointer rounded-md border bg-background px-3 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {error ? (
            <div className="flex gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          <Button className="h-11 w-full cursor-pointer" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating ticket...' : 'Create ticket'}
            <Send className="size-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}