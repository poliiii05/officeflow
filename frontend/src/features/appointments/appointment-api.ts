import { api } from '@/lib/api'

export type AppointmentStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled'

export type Appointment = {
  id: number
  requester_id: number
  assigned_to_id: number | null
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

export type AppointmentListParams = {
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