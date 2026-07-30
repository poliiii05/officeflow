import { AccountSettingsPanel } from '@/features/account/AccountSettingsPanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function AccountSettingsPage() {
  return (
    <DashboardLayout
      title="Account settings"
      description="Manage your profile, password, and account access details."
      badge="Account"
    >
      <AccountSettingsPanel />
    </DashboardLayout>
  )
}