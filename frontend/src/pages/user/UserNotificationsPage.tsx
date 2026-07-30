import { UserNotificationsPanel } from '@/features/user/notifications/UserNotificationsPanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function UserNotificationsPage() {
  return (
    <DashboardLayout
      title="Notifications"
      description="Review staff replies, ticket updates, and appointment updates."
      badge="Inbox"
    >
      <UserNotificationsPanel />
    </DashboardLayout>
  )
}