import { api } from '@/lib/api'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export type Requester = {
  id: number
  name: string
  email: string
  requester_type: 'employee' | 'visitor' | null
}

export type AssignedStaff = {
  id: number
  name: string
  email: string
}

export type Ticket = {
  id: number
  requester_id: number
  assigned_to_id: number | null
  requester?: Requester
  assigned_to?: AssignedStaff | null
  ticket_number: string
  subject: string
  description: string
  department: string
  category: string
  priority: TicketPriority
  status: TicketStatus
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export type TicketListParams = {
  queue?: 'unassigned' | 'mine' | 'resolved_today' | 'all'
  status?: string
  priority?: string
  department?: string
  search?: string
  page?: number
  per_page?: number
}

export type CreateTicketPayload = {
  subject: string
  description: string
  department: string
  category: string
  priority: TicketPriority
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export async function getTickets(params: TicketListParams = {}) {
  const response = await api.get<PaginatedResponse<Ticket>>('/tickets', { params })
  return response.data
}

export async function createTicket(payload: CreateTicketPayload) {
  const response = await api.post<{ data: Ticket; message: string }>('/tickets', payload)
  return response.data
}

export async function updateTicketStatus(ticketId: number, status: TicketStatus) {
  const response = await api.patch<{ data: Ticket; message: string }>(
    `/tickets/${ticketId}/status`,
    { status }
  )

  return response.data
}

export async function assignTicket(ticketId: number, assignedToId: number | null) {
  const response = await api.patch<{ data: Ticket; message: string }>(
    `/tickets/${ticketId}/assign`,
    { assigned_to_id: assignedToId }
  )

  return response.data
}