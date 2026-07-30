import { CalendarClock, FileText, Search, TicketCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TicketDetailsDialog } from '@/features/tickets/components/TicketDetailsDialog'
import { getTicket, getTickets, type Ticket } from '@/features/tickets/ticket-api'
import { cn } from '@/lib/utils'

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

const statusTabs = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
]

function formatStatus(status: string) {
  return status.replace('_', ' ')
}

export function UserTicketsPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const openTicketId = Number(searchParams.get('open'))

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [openedTicket, setOpenedTicket] = useState<Ticket | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === openTicketId) ?? openedTicket,
    [openTicketId, openedTicket, tickets]
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      async function loadTickets() {
        setIsLoading(true)
        setError('')

        try {
          const response = await getTickets({
            queue: 'all',
            status,
            search,
            page,
            per_page: 10,
          })

          setTickets(response.data)
          setMeta(response.meta)
        } catch {
          setError('Unable to load tickets.')
        } finally {
          setIsLoading(false)
        }
      }

      void loadTickets()
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [page, search, status])

  useEffect(() => {
    if (!openTicketId) {
      setOpenedTicket(null)
      return
    }

    if (tickets.some((ticket) => ticket.id === openTicketId)) {
      setOpenedTicket(null)
      return
    }

    async function loadOpenedTicket() {
      try {
        const response = await getTicket(openTicketId)
        setOpenedTicket(response.data)
      } catch {
        setError('Unable to open the selected ticket.')
      }
    }

    void loadOpenedTicket()
  }, [openTicketId, tickets])

  function closeSelectedTicket() {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('open')
    setSearchParams(nextParams, { replace: true })
    setOpenedTicket(null)
  }

  return (
    <section className="mx-auto max-w-7xl overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b bg-sky-50/50 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <TicketCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Ticket requests</h2>
            <p className="text-sm text-muted-foreground">
              Track open, active, resolved, and closed tickets.
            </p>
          </div>
        </div>

        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search subject, number, department..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b px-6 py-4">
        {statusTabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => {
              setStatus(tab.value)
              setPage(1)
            }}
            className={cn(
              'h-9 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors',
              status === tab.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-white text-muted-foreground hover:bg-muted'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="divide-y">
        {isLoading ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">Loading tickets...</div>
        ) : tickets.length ? (
          tickets.map((ticket) => (
            <article
              key={ticket.id}
              className="grid gap-4 px-6 py-5 lg:grid-cols-[1fr_auto] lg:items-center"
            >
              <div className="flex min-w-0 gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <FileText className="size-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{ticket.subject}</h3>
                    <Badge className={cn('border-0 capitalize', statusStyles[ticket.status])}>
                      {formatStatus(ticket.status)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('capitalize', priorityStyles[ticket.priority])}
                    >
                      {ticket.priority}
                    </Badge>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {ticket.ticket_number} - {ticket.department} - {ticket.category}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    Created {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <TicketDetailsDialog ticket={ticket} mode="activity" />
            </article>
          ))
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="font-medium">No tickets found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your submitted tickets will appear here.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t bg-slate-50 px-6 py-4">
        <p className="text-sm text-muted-foreground">
          Page {meta.current_page} of {meta.last_page} - {meta.total} tickets
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={page >= meta.last_page}
            onClick={() => setPage((current) => Math.min(current + 1, meta.last_page))}
          >
            Next
          </Button>
        </div>
      </div>

      {selectedTicket ? (
        <TicketDetailsDialog
          ticket={selectedTicket}
          mode="activity"
          open={Boolean(selectedTicket)}
          onOpenChange={(open) => {
            if (!open) closeSelectedTicket()
          }}
          hideTrigger
        />
      ) : null}
    </section>
  )
}