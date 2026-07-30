import { api } from '@/lib/api'

export type StaffProductivityRange = 7 | 14 | 30

export type StaffProductivity = {
  days: StaffProductivityRange
  labels: string[]
  tickets_resolved: number[]
  appointments_completed: number[]
  totals: {
    tickets_resolved: number
    appointments_completed: number
    completed: number
  }
}

export async function getStaffProductivity(days: StaffProductivityRange = 7) {
  const response = await api.get<{ data: StaffProductivity }>(
    '/staff/analytics/productivity',
    { params: { days } }
  )

  return response.data.data
}