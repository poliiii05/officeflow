import { useState } from 'react'

import { BookAppointmentDialog } from '@/features/appointments/components/BookAppointmentDialog'
import { UserAppointmentsPanel } from '@/features/user/appointments/UserAppointmentsPanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function UserAppointmentsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <DashboardLayout
      title="Appointments"
      description="Track requested schedules, confirmations, and office updates."
      badge="Requester portal"
      actions={
        <BookAppointmentDialog
          onCreated={() => setRefreshKey((current) => current + 1)}
        />
      }
    >
      <UserAppointmentsPanel refreshKey={refreshKey} />
    </DashboardLayout>
  )
}
