import { api } from '@/lib/api'
import type { Appointment } from '@/features/appointments/appointment-api'
import type { PaginatedResponse, Ticket } from '@/features/tickets/ticket-api'

export type StaffQueueView = 'unassigned' | 'mine' | 'resolved_today' | 'all'

export type StaffDashboardTotals = {
  queueTotal: number
  myWorkTotal: number
  resolvedToday: number
  allRecords: number
  myActiveTickets: number
  myActiveAppointments: number
  unassignedTickets: number
  pendingAppointments: number
}

export type StaffOverviewParams = {
  view: StaffQueueView
  search?: string
  date_from?: string
  date_to?: string
  ticket_page?: number
  appointment_page?: number
  per_page?: number
}

export type StaffOverviewResponse = {
  data: {
    tickets: PaginatedResponse<Ticket>
    appointments: PaginatedResponse<Appointment>
    totals: StaffDashboardTotals
  }
}

export async function getStaffOverview(params: StaffOverviewParams) {
  const response = await api.get<StaffOverviewResponse>('/staff/overview', { params })
  return response.data
}