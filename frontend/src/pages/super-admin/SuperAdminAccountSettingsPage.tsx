import { SuperAdminAccountSettingsPanel } from '@/features/super-admin/account-settings/SuperAdminAccountSettingsPanel'
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'

export function SuperAdminAccountSettingsPage() {
  return (
    <SuperAdminLayout
      title="Account settings"
      description="Manage your super admin profile, sign-in security, and account access."
      badge="Super admin account"
    >
      <SuperAdminAccountSettingsPanel />
    </SuperAdminLayout>
  )
}