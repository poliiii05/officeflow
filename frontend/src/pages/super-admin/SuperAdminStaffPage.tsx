import { StaffManagementPanel } from '@/features/super-admin/staff/StaffManagementPanel'
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'

export function SuperAdminStaffPage() {
  return (
    <SuperAdminLayout
      title="Manage staff operations"
      description="Review staff availability, active workload, and shift coverage."
      badge="Staff management"
    >
      <StaffManagementPanel />
    </SuperAdminLayout>
  )
}