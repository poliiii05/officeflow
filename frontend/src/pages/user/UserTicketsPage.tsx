import { useState } from 'react'

import { NewTicketDialog } from '@/features/tickets/components/NewTicketDialog'
import { UserTicketsPanel } from '@/features/user/tickets/UserTicketsPanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function UserTicketsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <DashboardLayout
      title="My requests"
      description="Track submitted service requests, status changes, and office replies."
      badge="Requester portal"
      actions={
        <NewTicketDialog
          onCreated={() => setRefreshKey((current) => current + 1)}
        />
      }
    >
      <UserTicketsPanel refreshKey={refreshKey} />
    </DashboardLayout>
  )
}
