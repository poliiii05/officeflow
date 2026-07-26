import { AuditLogsPanel } from '@/features/super-admin/audit-logs/AuditLogsPanel'
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'

export function SuperAdminAuditLogsPage() {
  return (
    <SuperAdminLayout
      title="Audit logs"
      description="Review system actions, role changes, staff shifts, and service request updates."
      badge="System activity"
    >
      <AuditLogsPanel />
    </SuperAdminLayout>
  )
}