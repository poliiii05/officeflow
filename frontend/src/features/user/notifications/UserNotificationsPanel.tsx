import {
  Bell,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MailOpen,
  TicketCheck,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getNotifications,
  markNotificationAsRead,
  markNotificationsAsRead,
  type NotificationFilter,
  type OfficeFlowNotification,
} from '@/features/notifications/notification-api'
import { getStoredUser } from '@/lib/auth-storage'
import { echo } from '@/lib/echo'
import { cn } from '@/lib/utils'

const filters: Array<{ value: NotificationFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
]

const emptyMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
}

export function UserNotificationsPanel() {
  const navigate = useNavigate()
  const user = getStoredUser()

  const [notifications, setNotifications] = useState<OfficeFlowNotification[]>([])
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(emptyMeta)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarking, setIsMarking] = useState(false)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const loadNotifications = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) setIsLoading(true)
      setError('')

      try {
        const response = await getNotifications({ filter, page, per_page: 10 })
        setNotifications(response.data)
        setMeta({
          current_page: response.meta.current_page,
          last_page: response.meta.last_page,
          per_page: response.meta.per_page,
          total: response.meta.total,
        })
        setUnreadCount(response.meta.unread_count)

        if (page > response.meta.last_page) {
          setPage(response.meta.last_page)
        }
      } catch {
        setError('Unable to load notifications. Please try again.')
      } finally {
        if (!silent) setIsLoading(false)
      }
    },
    [filter, page]
  )

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (!user?.id) return

    const channelName = `officeflow.user.${user.id}`
    const channel = echo.channel(channelName)
    const refreshSilently = () => void loadNotifications({ silent: true })

    channel.listen('.notification.changed', refreshSilently)

    return () => {
      channel.stopListening('.notification.changed', refreshSilently)
      echo.leaveChannel(channelName)
    }
  }, [loadNotifications, user?.id])

  function handleFilterChange(nextFilter: NotificationFilter) {
    setFilter(nextFilter)
    setPage(1)
  }

  async function handleMarkAllRead() {
    setIsMarking(true)
    setError('')

    try {
      await markNotificationsAsRead()
      setUnreadCount(0)

      if (filter === 'unread') {
        setPage(1)
        await loadNotifications({ silent: true })
      } else {
        const readAt = new Date().toISOString()
        setNotifications((current) =>
          current.map((notification) => ({
            ...notification,
            read_at: notification.read_at ?? readAt,
          }))
        )
      }
    } catch {
      setError('Unable to mark notifications as read.')
    } finally {
      setIsMarking(false)
    }
  }

  async function openNotification(notification: OfficeFlowNotification) {
    setOpeningId(notification.id)
    setError('')

    try {
      if (!notification.read_at) {
        await markNotificationAsRead(notification.id)
        setUnreadCount((count) => Math.max(0, count - 1))
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, read_at: new Date().toISOString() }
              : item
          )
        )
      }

      if (notification.data.ticket_id) {
        navigate(`/tickets?open=${notification.data.ticket_id}`)
        return
      }

      if (notification.data.appointment_id) {
        navigate(`/appointments?open=${notification.data.appointment_id}`)
      }
    } catch {
      setError('Unable to open this notification.')
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <section className="mx-auto max-w-6xl overflow-hidden rounded-lg border bg-white shadow-sm">
      <header className="border-b bg-violet-50/50 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <Bell className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Notification center</h2>
              <p className="text-sm text-muted-foreground">
                Open staff replies and status updates from one inbox.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              {isMarking ? 'Updating...' : 'Mark all read'}
            </Button>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2" aria-label="Notification filters">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => handleFilterChange(item.value)}
              className={cn(
                'cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                filter === item.value
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="divide-y">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <NotificationSkeleton key={index} />
          ))
        ) : notifications.length ? (
          notifications.map((notification) => {
            const isTicket = Boolean(notification.data.ticket_id)
            const canOpen = Boolean(
              notification.data.ticket_id || notification.data.appointment_id
            )

            return (
              <button
                key={notification.id}
                type="button"
                disabled={openingId === notification.id}
                onClick={() => void openNotification(notification)}
                className={cn(
                  'grid w-full gap-4 px-5 py-5 text-left transition-colors sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-6',
                  canOpen ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default',
                  !notification.read_at && 'bg-sky-50/35'
                )}
              >
                <div
                  className={cn(
                    'flex size-11 items-center justify-center rounded-lg',
                    isTicket
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-emerald-100 text-emerald-700'
                  )}
                >
                  {isTicket ? (
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
                      <span className="size-2 rounded-full bg-sky-500" aria-label="Unread" />
                    ) : (
                      <Check className="size-4 text-muted-foreground" aria-label="Read" />
                    )}
                  </div>

                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {notification.data.message ?? 'You have a new account notification.'}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className={isTicket ? 'text-sky-700' : 'text-emerald-700'}>
                      {notification.data.ticket_number ??
                        notification.data.appointment_number ??
                        'Account notification'}
                    </span>
                    <span>{formatNotificationTime(notification.created_at)}</span>
                  </div>
                </div>

                <span className="text-sm font-medium text-slate-700">
                  {openingId === notification.id
                    ? 'Opening...'
                    : canOpen
                      ? 'View details'
                      : 'Read'}
                </span>
              </button>
            )
          })
        ) : (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <CheckCircle2 className="size-6" />
            </div>
            <p className="mt-4 font-medium">
              {filter === 'unread' ? 'You are all caught up' : 'No notifications yet'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === 'unread'
                ? 'New request updates will appear here.'
                : 'Staff replies and request updates will appear here.'}
            </p>
          </div>
        )}
      </div>

      <footer className="flex flex-col gap-3 border-t bg-slate-50/70 px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Page {meta.current_page} of {meta.last_page} - {meta.total}{' '}
          {meta.total === 1 ? 'notification' : 'notifications'}
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer bg-white"
            disabled={isLoading || meta.current_page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer bg-white"
            disabled={isLoading || meta.current_page >= meta.last_page}
            onClick={() =>
              setPage((current) => Math.min(meta.last_page, current + 1))
            }
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </footer>
    </section>
  )
}

function NotificationSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 px-5 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-6">
      <div className="size-11 rounded-lg bg-slate-200" />
      <div className="space-y-2">
        <div className="h-4 w-44 rounded bg-slate-200" />
        <div className="h-3 w-full max-w-xl rounded bg-slate-100" />
        <div className="h-3 w-28 rounded bg-slate-100" />
      </div>
      <div className="h-4 w-20 rounded bg-slate-100" />
    </div>
  )
}

function formatNotificationTime(value: string) {
  const date = new Date(value)
  const differenceInSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (Math.abs(differenceInSeconds) < 60) return relativeTime.format(differenceInSeconds, 'second')

  const differenceInMinutes = Math.round(differenceInSeconds / 60)
  if (Math.abs(differenceInMinutes) < 60) return relativeTime.format(differenceInMinutes, 'minute')

  const differenceInHours = Math.round(differenceInMinutes / 60)
  if (Math.abs(differenceInHours) < 24) return relativeTime.format(differenceInHours, 'hour')

  const differenceInDays = Math.round(differenceInHours / 24)
  if (Math.abs(differenceInDays) < 7) return relativeTime.format(differenceInDays, 'day')

  return date.toLocaleString()
}