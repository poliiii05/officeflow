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

type StaffShiftResponse = {
  data: StaffShiftState
  message?: string
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