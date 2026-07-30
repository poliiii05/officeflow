import { UserDashboardPanel } from '@/features/user/dashboard/UserDashboardPanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function UserDashboardPage() {
  return (
    <DashboardLayout
      title="My workspace"
      description="Track your tickets, appointments, and latest office updates."
      badge="Requester portal"
    >
      <UserDashboardPanel />
    </DashboardLayout>
  )
}