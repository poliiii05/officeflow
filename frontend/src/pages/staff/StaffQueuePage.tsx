import { StaffQueuePanel } from '@/features/staff/queue/StaffQueuePanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function StaffQueuePage() {
  return (
    <DashboardLayout
      title="Service queue"
      description="Review new unclaimed tickets and appointment requests."
      badge="Staff queue"
    >
      <StaffQueuePanel />
    </DashboardLayout>
  )
}