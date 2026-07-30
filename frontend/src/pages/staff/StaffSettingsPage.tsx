    import { StaffSettingsPanel } from '@/features/staff/settings/StaffSettingsPanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function StaffSettingsPage() {
  return (
    <DashboardLayout
      title="Staff settings"
      description="Manage your staff profile, sign-in security, and workspace access."
      badge="Staff account"
    >
      <StaffSettingsPanel />
    </DashboardLayout>
  )
}