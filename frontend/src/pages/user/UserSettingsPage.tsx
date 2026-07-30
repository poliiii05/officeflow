import { UserSettingsPanel } from '@/features/user/settings/UserSettingsPanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function UserSettingsPage() {
  return (
    <DashboardLayout
      title="Settings"
      description="Manage your profile, email, password, and requester preferences."
      badge="Account settings"
    >
      <UserSettingsPanel />
    </DashboardLayout>
  )
}