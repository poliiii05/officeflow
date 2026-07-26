import { api } from '@/lib/api'

export type SystemSettings = {
  maintenance_mode: boolean
  office_name: string
  support_email: string
  timezone: string
  office_note: string
  allow_user_cancellation: boolean
  cancellation_window: 'before_claim' | 'before_resolution' | 'disabled'
  appointment_lead_days: number
  default_ticket_priority: 'low' | 'medium' | 'high' | 'urgent'
  staff_shift_required: boolean
  audit_log_retention: '90' | '180' | '365'
}

export type PublicSystemStatus = Pick<
  SystemSettings,
  'maintenance_mode' | 'office_name' | 'support_email' | 'timezone' | 'office_note'
>

export async function getSystemStatus() {
  const response = await api.get<{ data: PublicSystemStatus }>('/system/status')
  return response.data.data
}

export async function getSuperAdminSettings() {
  const response = await api.get<{ data: SystemSettings }>('/super-admin/settings')
  return response.data.data
}

export async function updateSuperAdminSettings(settings: SystemSettings) {
  const response = await api.patch<{ data: SystemSettings; message: string }>(
    '/super-admin/settings',
    settings
  )

  return response.data.data
}