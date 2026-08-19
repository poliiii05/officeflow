import type { Appointment } from '@/features/appointments/appointment-api'
import type { Ticket } from '@/features/tickets/ticket-api'
import { api } from '@/lib/api'

export type StaffQueueScope = 'all' | 'today' | 'overdue'

export type StaffQueueItem =
  | {
      kind: 'ticket'
      data: Ticket
    }
  | {
      kind: 'appointment'
      data: Appointment
    }

export type StaffQueueMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

type StaffQueueResponse = {
  data: StaffQueueItem[]
  meta: StaffQueueMeta
}

export async function getStaffQueue(params: {
  scope?: StaffQueueScope
  search?: string
  page?: number
  per_page?: number
} = {}) {
  const response = await api.get<StaffQueueResponse>('/staff/queue', { params })
  return response.data
}