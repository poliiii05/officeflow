import { api } from '@/lib/api'

export type StaffShiftEndReason = 'early_out' | 'end_shift'

export type StaffShift = {
  id: number
  user_id: number
  started_at: string
  ended_at: string | null
  status: 'active' | 'ended'
  end_reason: StaffShiftEndReason | null
  created_at: string
  updated_at: string
}

export type StaffShiftState = {
  is_on_duty: boolean
  can_start_shift: boolean
  has_shift_today: boolean
  shift: StaffShift | null
  today_shift: StaffShift | null
}

export type StaffShiftHistoryItem = StaffShift & {
  duration_minutes: number
  completed_tickets: number
  completed_appointments: number
  completed_total: number
}

export type StaffShiftHistoryMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

type StaffShiftResponse = {
  data: StaffShiftState
  message?: string
}

type StaffShiftHistoryResponse = {
  data: StaffShiftHistoryItem[]
  meta: StaffShiftHistoryMeta
}

export async function getCurrentStaffShift() {
  const response = await api.get<StaffShiftResponse>('/staff/shift/current')
  return response.data
}

export async function startStaffShift() {
  const response = await api.post<StaffShiftResponse>('/staff/shift/start')
  return response.data
}

export async function endStaffShift(endReason: StaffShiftEndReason = 'end_shift') {
  const response = await api.post<StaffShiftResponse>('/staff/shift/end', {
    end_reason: endReason,
  })

  return response.data
}

export async function getStaffShiftHistory(params?: {
  page?: number
  per_page?: number
  date_from?: string
  date_to?: string
}) {
  const response = await api.get<StaffShiftHistoryResponse>('/staff/shifts', {
    params,
  })

  return response.data
}