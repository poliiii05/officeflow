import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'

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
    } catch {
      setError('Unable to create ticket. Please check your details and try again.')
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

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new ticket</DialogTitle>
          <DialogDescription>
            Send a request to the office team and track its progress.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
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
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ticketDepartment">Department</Label>
              <select
                id="ticketDepartment"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option>IT Support</option>
                <option>Front Desk</option>
                <option>Admin Office</option>
                <option>HR Office</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketCategory">Category</Label>
              <select
                id="ticketCategory"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
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
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button className="w-full cursor-pointer" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create ticket'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}