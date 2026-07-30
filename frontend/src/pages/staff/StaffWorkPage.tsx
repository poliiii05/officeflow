import { StaffWorkPanel } from '@/features/staff/work/StaffWorkPanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function StaffWorkPage() {
  return (
    <DashboardLayout
      title="My work"
      description="Manage tickets and appointments assigned to you."
      badge="Assigned work"
    >
      <StaffWorkPanel />
    </DashboardLayout>
  )
}