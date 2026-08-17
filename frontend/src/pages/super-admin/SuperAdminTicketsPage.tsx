import { TicketManagementPanel } from '@/features/super-admin/tickets/TicketManagementPanel'
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'

export function SuperAdminTicketsPage() {
  return (
    <SuperAdminLayout
      title="Ticket management"
      description="Review every service request, update its status, and assign work to staff."
      badge="Support desk"
    >
      <TicketManagementPanel />
    </SuperAdminLayout>
  )
}