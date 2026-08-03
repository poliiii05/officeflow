import { UserNotificationsPanel } from '@/features/user/notifications/UserNotificationsPanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function UserNotificationsPage() {
  return (
    <DashboardLayout
      title="Notifications"
      description="Review staff replies and updates to your service requests and appointments."
      badge="Requester inbox"
    >
      <UserNotificationsPanel />
    </DashboardLayout>
  )
}