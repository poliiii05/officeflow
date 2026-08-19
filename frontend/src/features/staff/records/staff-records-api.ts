import type { Appointment } from '@/features/appointments/appointment-api'
import type { Ticket } from '@/features/tickets/ticket-api'
import { api } from '@/lib/api'

export type StaffRecordKind = 'all' | 'tickets' | 'appointments'

export type StaffRecord =
  | {
      kind: 'ticket'
      item: Ticket
    }
  | {
      kind: 'appointment'
      item: Appointment
    }

export type StaffRecordsParams = {
  kind?: StaffRecordKind
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export type StaffRecordsMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type StaffRecordsSummary = {
  all: number
  tickets: number
  appointments: number
}

type StaffRecordsResponse = {
  data: StaffRecord[]
  meta: StaffRecordsMeta
  summary: StaffRecordsSummary
}

export async function getStaffRecords(params: StaffRecordsParams = {}) {
  const response = await api.get<StaffRecordsResponse>('/staff/records', { params })

  return response.data
}