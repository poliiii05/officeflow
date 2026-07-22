import { api } from '@/lib/api'
import type { AssignedStaff, Requester } from '@/features/tickets/ticket-api'

export type AppointmentStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled'

export type Appointment = {
  id: number
  requester_id: number
  assigned_to_id: number | null
  requester?: Requester
  assigned_to?: AssignedStaff | null
  appointment_number: string
  purpose: string
  notes: string | null
  department: string
  scheduled_at: string
  status: AppointmentStatus
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export type AppointmentActivity = {
  id: number
  appointment_id: number
  user_id: number | null
  type: 'message' | 'staff_reply' | 'requester_reply' | string
  message: string
  is_internal: boolean
  created_at: string
  updated_at: string
  user?: {
    id: number
    name: string
    email: string
    role: 'user' | 'staff' | 'super_admin'
  } | null
}

export type AppointmentListParams = {
  queue?: 'pending' | 'scheduled' | 'completed_today' | 'all'
  status?: string
  department?: string
  search?: string
  page?: number
  per_page?: number
}

export type CreateAppointmentPayload = {
  purpose: string
  notes?: string
  department: string
  scheduled_at: string
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

export async function getAppointments(params: AppointmentListParams = {}) {
  const response = await api.get<PaginatedResponse<Appointment>>('/appointments', {
    params,
  })

  return response.data
}

export async function getAppointment(appointmentId: number) {
  const response = await api.get<{ data: Appointment }>(
    `/appointments/${appointmentId}`
  )

  return response.data
}

export async function createAppointment(payload: CreateAppointmentPayload) {
  const response = await api.post<{ data: Appointment; message: string }>(
    '/appointments',
    payload
  )

  return response.data
}

export async function updateAppointmentStatus(
  appointmentId: number,
  status: AppointmentStatus
) {
  const response = await api.patch<{ data: Appointment; message: string }>(
    `/appointments/${appointmentId}/status`,
    { status }
  )

  return response.data
}

export async function assignAppointment(appointmentId: number) {
  const response = await api.patch<{ data: Appointment; message: string }>(
    `/appointments/${appointmentId}/assign`
  )

  return response.data
}

export async function getAppointmentActivities(appointmentId: number) {
  const response = await api.get<{ data: AppointmentActivity[] }>(
    `/appointments/${appointmentId}/activities`
  )

  return response.data
}

export async function createAppointmentActivity(
  appointmentId: number,
  message: string
) {
  const response = await api.post<{ data: AppointmentActivity; message: string }>(
    `/appointments/${appointmentId}/activities`,
    { message }
  )

  return response.data
}

