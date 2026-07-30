import { StaffShiftsPanel } from '@/features/staff/shifts/StaffShiftsPanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function StaffShiftsPage() {
  return (
    <DashboardLayout
      title="Shift history"
      description="Track your duty status and work session."
      badge="Staff shift"
    >
      <StaffShiftsPanel />
    </DashboardLayout>
  )
}