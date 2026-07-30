import { StaffDashboardPanel } from '@/features/staff/dashboard/StaffDashboardPanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function StaffDashboardPage() {
  return (
    <DashboardLayout
      title="Manage service queues"
      description="New requests, assigned work, and completed items update in real time."
      badge="Staff operations"
    >
      <StaffDashboardPanel />
    </DashboardLayout>
  )
}