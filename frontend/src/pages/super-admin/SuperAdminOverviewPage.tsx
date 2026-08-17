import { SuperAdminOverviewPanel } from '@/features/super-admin/overview/SuperAdminOverviewPanel'
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'

export function SuperAdminOverviewPage() {
  return (
    <SuperAdminLayout
      title="Dashboard"
      description="Monitor queue pressure, staff coverage, system records, and operational controls."
      badge="Super admin operations"
    >
      <SuperAdminOverviewPanel />
    </SuperAdminLayout>
  )
}