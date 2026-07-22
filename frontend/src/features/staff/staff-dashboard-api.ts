import { api } from '@/lib/api'
import type { Appointment } from '@/features/appointments/appointment-api'
import type { PaginatedResponse, Ticket } from '@/features/tickets/ticket-api'

export type StaffQueueView = 'unassigned' | 'mine' | 'resolved_today' | 'all'

export type StaffDashboardTotals = {
  myActiveTickets: number
  unassignedTickets: number
  pendingAppointments: number
  resolvedToday: number
}

export type StaffOverviewParams = {
  view: StaffQueueView
  search?: string
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