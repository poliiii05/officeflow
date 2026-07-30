import { UserTicketsPanel } from '@/features/user/tickets/UserTicketsPanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function UserTicketsPage() {
  return (
    <DashboardLayout
      title="My tickets"
      description="Review your submitted service requests and staff replies."
      badge="Ticket history"
    >
      <UserTicketsPanel />
    </DashboardLayout>
  )
}