import { api } from '@/lib/api'

export type OfficeFlowNotification = {
  id: string
  type: string
  notifiable_type: string
  notifiable_id: number
  data: {
    title?: string
    message?: string
    ticket_id?: number
    ticket_number?: string
    ticket_subject?: string
    activity_id?: number
  }
  read_at: string | null
  created_at: string
  updated_at: string
}

export type NotificationResponse = {
  data: OfficeFlowNotification[]
  meta: {
    unread_count: number
  }
}

export async function getNotifications() {
  const response = await api.get<NotificationResponse>('/notifications')
  return response.data
}

export async function markNotificationsAsRead() {
  const response = await api.post<{ message: string }>('/notifications/read')
  return response.data
}