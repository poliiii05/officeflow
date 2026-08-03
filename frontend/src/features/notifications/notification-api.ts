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
    appointment_id?: number
    appointment_number?: string
    appointment_purpose?: string
    activity_id?: number
  }
  read_at: string | null
  created_at: string
  updated_at: string
}

export type NotificationFilter = 'all' | 'unread'

export type NotificationListParams = {
  filter?: NotificationFilter
  page?: number
  per_page?: number
}

export type NotificationResponse = {
  data: OfficeFlowNotification[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    unread_count: number
  }
}

export async function getNotifications(params: NotificationListParams = {}) {
  const response = await api.get<NotificationResponse>('/notifications', { params })
  return response.data
}

export async function markNotificationAsRead(notificationId: string) {
  const response = await api.patch<{
    data: OfficeFlowNotification
    message: string
  }>(`/notifications/${notificationId}/read`)

  return response.data
}

export async function markNotificationsAsRead() {
  const response = await api.post<{ message: string }>('/notifications/read')
  return response.data
}
