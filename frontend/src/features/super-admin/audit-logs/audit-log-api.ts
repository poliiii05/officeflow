import { api } from '@/lib/api'

export type AuditActor = {
  id: number
  name: string
  email: string
  role: 'user' | 'staff' | 'super_admin'
} | null

export type AuditLog = {
  id: number
  actor_id: number | null
  actor?: AuditActor
  module: string
  action: string
  auditable_type: string | null
  auditable_id: number | null
  description: string
  metadata: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
}

export type AuditLogsMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type AuditLogListParams = {
  search?: string
  module?: string
  action?: string
  page?: number
  per_page?: number
}

export async function getAuditLogs(params: AuditLogListParams = {}) {
  const response = await api.get<{ data: AuditLog[]; meta: AuditLogsMeta }>(
    '/super-admin/audit-logs',
    { params }
  )

  return response.data
}