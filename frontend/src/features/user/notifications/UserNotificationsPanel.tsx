import { Bell, CalendarCheck, CheckCircle2, MailOpen, TicketCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getNotifications,
  markNotificationsAsRead,
  type OfficeFlowNotification,
} from '@/features/notifications/notification-api'
import { cn } from '@/lib/utils'

export function UserNotificationsPanel() {
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<OfficeFlowNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isMarking, setIsMarking] = useState(false)
  const [error, setError] = useState('')

  async function loadNotifications() {
    setIsLoading(true)
    setError('')

    try {
      const response = await getNotifications()
      setNotifications(response.data)
      setUnreadCount(response.meta.unread_count)
    } catch {
      setError('Unable to load notifications.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadNotifications()
  }, [])

  async function handleMarkAllRead() {
    setIsMarking(true)

    try {
      await markNotificationsAsRead()
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read_at: notification.read_at ?? new Date().toISOString(),
        }))
      )
      setUnreadCount(0)
    } finally {
      setIsMarking(false)
    }
  }

  function openNotification(notification: OfficeFlowNotification) {
    if (notification.data.ticket_id) {
      navigate(`/tickets?open=${notification.data.ticket_id}`)
      return
    }

    if (notification.data.appointment_id) {
      navigate(`/appointments?open=${notification.data.appointment_id}`)
    }
  }

  return (
    <section className="mx-auto max-w-5xl overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b bg-violet-50/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
            <Bell className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Notification center</h2>
            <p className="text-sm text-muted-foreground">
              Click a notification to open the related ticket or appointment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="border-0 bg-violet-100 text-violet-700">
            {unreadCount} unread
          </Badge>

          <Button
            type="button"
            variant="outline"
            className="cursor-pointer bg-white"
            disabled={isMarking || unreadCount === 0}
            onClick={handleMarkAllRead}
          >
            <MailOpen className="size-4" />
            Mark all read
          </Button>
        </div>
      </div>

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="divide-y">
        {isLoading ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length ? (
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => openNotification(notification)}
              className="grid w-full cursor-pointer gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-50 sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <div
                className={cn(
                  'flex size-11 items-center justify-center rounded-lg',
                  notification.data.ticket_id
                    ? 'bg-sky-100 text-sky-700'
                    : 'bg-emerald-100 text-emerald-700'
                )}
              >
                {notification.data.ticket_id ? (
                  <TicketCheck className="size-5" />
                ) : (
                  <CalendarCheck className="size-5" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">
                    {notification.data.title ?? 'OfficeFlow update'}
                  </p>
                  {!notification.read_at ? (
                    <Badge className="border-0 bg-sky-100 text-sky-700">New</Badge>
                  ) : null}
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  {notification.data.message ?? 'You have a new account notification.'}
                </p>

                {notification.data.ticket_number ? (
                  <p className="mt-2 text-sm font-medium text-sky-700">
                    {notification.data.ticket_number}
                  </p>
                ) : null}

                {notification.data.appointment_number ? (
                  <p className="mt-2 text-sm font-medium text-emerald-700">
                    {notification.data.appointment_number}
                  </p>
                ) : null}
              </div>

              <div className="text-sm text-muted-foreground">
                {new Date(notification.created_at).toLocaleString()}
              </div>
            </button>
          ))
        ) : (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <CheckCircle2 className="size-6" />
            </div>
            <p className="mt-4 font-medium">No notifications yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Staff replies and request updates will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}