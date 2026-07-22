import { api } from '@/lib/api'

export type StaffShift = {
  id: number
  user_id: number
  started_at: string
  ended_at: string | null
  status: 'active' | 'ended'
  created_at: string
  updated_at: string
}

export type StaffShiftState = {
  is_on_duty: boolean
  shift: StaffShift | null
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

export async function endStaffShift() {
  const response = await api.post<StaffShiftResponse>('/staff/shift/end')
  return response.data
}