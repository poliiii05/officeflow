import { api } from '@/lib/api'

export type SuperAdminTotals = {
  users: number
  staff: number
  on_duty_staff: number
  queue_total: number
  unassigned_tickets: number
  pending_appointments: number
  resolved_today: number
  all_tickets: number
  all_appointments: number
}

export type StaffWorkloadItem = {
  id: number
  name: string
  email: string
  role: 'staff' | 'super_admin'
  is_on_duty: boolean
  shift_started_at: string | null
  active_tickets: number
  active_appointments: number
  active_total: number
}

export type SuperAdminOverviewResponse = {
  data: {
    totals: SuperAdminTotals
    staff_workload: StaffWorkloadItem[]
  }
}

export async function getSuperAdminOverview() {
  const response = await api.get<SuperAdminOverviewResponse>('/super-admin/overview')
  return response.data
}

export type ManagedUserRole = 'user' | 'staff' | 'super_admin'

export type ManagedUser = {
  id: number
  name: string
  email: string
  role: ManagedUserRole
  requester_type: 'employee' | 'visitor' | null
  email_verified_at: string | null
  terms_accepted_at: string | null
  created_at: string
  updated_at: string
}

export type ManagedUsersMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type ManagedUsersResponse = {
  data: ManagedUser[]
  meta: ManagedUsersMeta
}

export type ManagedUsersParams = {
  search?: string
  role?: ManagedUserRole
  page?: number
  per_page?: number
}

export async function getManagedUsers(params: ManagedUsersParams = {}) {
  const response = await api.get<ManagedUsersResponse>('/super-admin/users', {
    params,
  })

  return response.data
}

export async function updateManagedUserRole(userId: number, role: ManagedUserRole) {
  const response = await api.patch<{ data: ManagedUser; message: string }>(
    `/super-admin/users/${userId}/role`,
    { role }
  )

  return response.data
}

export type AssignableStaff = {
  id: number
  name: string
  email: string
  active_tickets: number
  active_appointments: number
  active_total: number
}

export async function getAssignableStaff() {
  const response = await api.get<{ data: AssignableStaff[] }>(
    '/super-admin/assignable-staff'
  )

  return response.data.data
}

export type AnalyticsTrendItem = {
  date: string
  label: string
  tickets: number
  appointments: number
  completed: number
}

export type AnalyticsStatusItem = {
  status: string
  label: string
  count: number
}

export type AnalyticsStaffLoadItem = {
  id: number
  name: string
  role: 'staff' | 'super_admin'
  is_on_duty: boolean
  tickets: number
  appointments: number
  total: number
}

export type SuperAdminAnalytics = {
  totals: {
    tickets: number
    appointments: number
    queue_waiting: number
    active_assigned: number
    completed_today: number
    staff_accounts: number
    on_duty_staff: number
  }
  trends: AnalyticsTrendItem[]
  ticket_statuses: AnalyticsStatusItem[]
  appointment_statuses: AnalyticsStatusItem[]
  staff_load: AnalyticsStaffLoadItem[]
}

export async function getSuperAdminAnalytics(days = 7) {
  const response = await api.get<{ data: SuperAdminAnalytics }>(
    '/super-admin/analytics',
    {
      params: { days },
    }
  )

  return response.data.data
}