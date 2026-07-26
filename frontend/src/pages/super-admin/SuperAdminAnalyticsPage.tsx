import { AnalyticsPanel } from '@/features/super-admin/analytics/AnalyticsPanel'
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'

export function SuperAdminAnalyticsPage() {
  return (
    <SuperAdminLayout
      title="Analytics"
      description="Review service volume, completion trends, and staff performance."
      badge="Reports"
    >
      <AnalyticsPanel />
    </SuperAdminLayout>
  )
}