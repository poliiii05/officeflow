import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Inbox,
  Search,
  TicketCheck,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TicketDetailsDialog } from '@/features/tickets/components/TicketDetailsDialog'
import { getTicket, getTickets, type Ticket } from '@/features/tickets/ticket-api'
import { cn } from '@/lib/utils'

type UserTicketsPanelProps = {
  refreshKey?: number
}

type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
}

const statusStyles: Record<string, string> = {
  open: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-200 text-slate-700',
}

const statusTabs = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
] as const

function formatStatus(status: string) {
  return status.replaceAll('_', ' ')
}

function formatSubmittedAt(value: string) {
  const date = new Date(value)

  return {
    date: date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }),
  }
}

export function UserTicketsPanel({ refreshKey = 0 }: UserTicketsPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const openTicketId = Number(searchParams.get('open'))

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [openedTicket, setOpenedTicket] = useState<Ticket | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === openTicketId) ?? openedTicket,
    [openTicketId, openedTicket, tickets]
  )

  useEffect(() => {
    let cancelled = false

    const timeout = window.setTimeout(
      () => {
        async function loadTickets() {
          setIsLoading(true)
          setError('')

          try {
            const response = await getTickets({
              queue: 'all',
              status,
              search: search.trim(),
              page,
              per_page: 10,
            })

            if (cancelled) return

            setTickets(response.data)
            setMeta(response.meta)
          } catch {
            if (!cancelled) setError('Unable to load your service requests.')
          } finally {
            if (!cancelled) setIsLoading(false)
          }
        }

        void loadTickets()
      },
      search ? 250 : 0
    )

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [page, refreshKey, search, status])

  useEffect(() => {
    let cancelled = false

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
        if (!cancelled) setOpenedTicket(response.data)
      } catch {
        if (!cancelled) setError('Unable to open the selected service request.')
      }
    }

    void loadOpenedTicket()

    return () => {
      cancelled = true
    }
  }, [openTicketId, tickets])

  function closeSelectedTicket() {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('open')
    setSearchParams(nextParams, { replace: true })
    setOpenedTicket(null)
  }

  return (
    <section className="mx-auto max-w-7xl overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="flex flex-col gap-5 border-b bg-slate-50/70 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <TicketCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Service request history</h2>
            <p className="text-sm text-muted-foreground">
              Follow each request from submission through completion.
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
            placeholder="Search request, number, office, or service..."
            className="bg-white pl-9"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b px-5 py-3 lg:px-6">
        {statusTabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => {
              setStatus(tab.value)
              setPage(1)
            }}
            className={cn(
              'h-9 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors',
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
        <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 lg:px-6">
          {error}
        </div>
      ) : null}

      <div className="hidden grid-cols-[minmax(0,1.35fr)_minmax(180px,0.85fr)_170px_130px_130px] gap-5 border-b bg-slate-50 px-6 py-3 text-xs font-semibold uppercase text-muted-foreground lg:grid">
        <span>Request</span>
        <span>Office and service</span>
        <span>Submitted</span>
        <span>Status</span>
        <span>Action</span>
      </div>

      <div className="divide-y">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="grid animate-pulse gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(180px,0.85fr)_170px_130px_130px] lg:items-center lg:gap-5 lg:px-6"
            >
              <div className="h-11 rounded-md bg-slate-100" />
              <div className="h-9 rounded-md bg-slate-100" />
              <div className="h-9 rounded-md bg-slate-100" />
              <div className="h-7 rounded-full bg-slate-100" />
              <div className="h-9 rounded-md bg-slate-100" />
            </div>
          ))
        ) : tickets.length ? (
          tickets.map((ticket) => {
            const submittedAt = formatSubmittedAt(ticket.created_at)

            return (
              <article
                key={ticket.id}
                className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(180px,0.85fr)_170px_130px_130px] lg:items-center lg:gap-5 lg:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{ticket.subject}</h3>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {ticket.ticket_number}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 text-sm">
                  <p className="truncate font-medium">{ticket.department}</p>
                  <p className="mt-0.5 truncate text-muted-foreground">{ticket.category}</p>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{submittedAt.date}</p>
                    <p className="text-muted-foreground">{submittedAt.time}</p>
                  </div>
                </div>

                <div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'border-0 capitalize',
                      statusStyles[ticket.status] ?? 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {formatStatus(ticket.status)}
                  </Badge>
                </div>

                <div className="lg:flex lg:justify-start">
                  <TicketDetailsDialog ticket={ticket} mode="activity" />
                </div>
              </article>
            )
          })
        ) : (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Inbox className="size-5" />
            </div>
            <p className="mt-4 font-medium">No service requests found</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Submitted requests that match this view will appear here.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p className="text-sm text-muted-foreground">
          Page {meta.current_page} of {meta.last_page} - {meta.total} request
          {meta.total === 1 ? '' : 's'}
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={page >= meta.last_page || isLoading}
            onClick={() => setPage((current) => Math.min(current + 1, meta.last_page))}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {selectedTicket ? (
        <TicketDetailsDialog
          ticket={selectedTicket}
          mode="activity"
          open={Boolean(selectedTicket)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) closeSelectedTicket()
          }}
          hideTrigger
        />
      ) : null}
    </section>
  )
}
