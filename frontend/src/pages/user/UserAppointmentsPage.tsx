import { UserAppointmentsPanel } from '@/features/user/appointments/UserAppointmentsPanel'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function UserAppointmentsPage() {
  return (
    <DashboardLayout
      title="Appointments"
      description="Review your office appointment requests and schedule updates."
      badge="Appointment history"
    >
      <UserAppointmentsPanel />
    </DashboardLayout>
  )
}