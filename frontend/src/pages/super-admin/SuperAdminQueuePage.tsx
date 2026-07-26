import { QueueMonitorPanel } from '@/features/super-admin/queue/QueueMonitorPanel'
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'

export function SuperAdminQueuePage() {
  return (
    <SuperAdminLayout
      title="Monitor service queue"
      description="Review unclaimed tickets and appointments across the service desk."
      badge="Queue monitor"
    >
      <QueueMonitorPanel />
    </SuperAdminLayout>
  )
}