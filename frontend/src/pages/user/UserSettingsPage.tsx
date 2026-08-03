import { UserSettingsPanel } from '@/features/user/settings/UserSettingsPanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function UserSettingsPage() {
  return (
    <DashboardLayout
      title="Settings"
      description="Manage your profile, verified email, and sign-in security."
      badge="Account settings"
    >
      <UserSettingsPanel />
    </DashboardLayout>
  )
}

