import { api } from '@/lib/api'

type ApiResponse<T> = {
  data: T
  message?: string
}

type PaginatedResponse<T> = {
  data: T[]
  meta: StaffShiftHistoryMeta
}

export type StaffShiftEndReason = 'early_out' | 'end_shift'

export type StaffShift = {
  id: number
  user_id: number
  started_at: string
  ended_at: string | null
  end_reason: StaffShiftEndReason | null
  status: 'active' | 'ended'
  completed_tickets: number
  completed_appointments: number
  completed_total: number
  duration_minutes: number
  created_at: string
  updated_at: string
}

export type StaffShiftSummary = {
  completed_tickets: number
  completed_appointments: number
  completed_total: number
  duration_minutes: number
}

export type StaffShiftState = {
  is_on_duty: boolean
  can_start_shift: boolean
  has_shift_today: boolean
  shift: StaffShift | null
  today_shift: StaffShift | null
  today_summary: StaffShiftSummary | null
}

export type StaffShiftHistoryItem = StaffShift

export type StaffShiftHistoryMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type StaffShiftHistoryParams = {
  page?: number
  per_page?: number
  date_from?: string
  date_to?: string
}

export async function getStaffShiftHistory(params: StaffShiftHistoryParams = {}) {
  const response = await api.get<PaginatedResponse<StaffShiftHistoryItem>>('/staff/shifts', {
    params,
  })

  return response.data
}

export async function getStaffShifts(params: StaffShiftHistoryParams = {}) {
  return getStaffShiftHistory(params)
}

export async function getCurrentStaffShift() {
  const response = await api.get<ApiResponse<StaffShiftState>>('/staff/shifts/current')

  return response.data
}

export async function startStaffShift() {
  const response = await api.post<ApiResponse<StaffShiftState>>('/staff/shifts/start')

  return response.data
}

export async function endStaffShift(reason: StaffShiftEndReason) {
  const response = await api.post<ApiResponse<StaffShiftState>>('/staff/shifts/end', {
    end_reason: reason,
  })

  return response.data
}