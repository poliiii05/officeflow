import { StaffRecordsPanel } from '@/features/staff/records/StaffRecordsPanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function StaffRecordsPage() {
  return (
    <DashboardLayout
      title="Records"
      description="Search and review ticket and appointment history."
      badge="Staff records"
    >
      <StaffRecordsPanel />
    </DashboardLayout>
  )
}