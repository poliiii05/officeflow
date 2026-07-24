import { UserManagementPanel } from '@/features/super-admin/users/UserManagementPanel'
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'

export function SuperAdminUsersPage() {
  return (
    <SuperAdminLayout
      title="Manage users and roles"
      description="Search accounts, review requester types, and control system access."
      badge="Access control"
    >
      <UserManagementPanel />
    </SuperAdminLayout>
  )
}