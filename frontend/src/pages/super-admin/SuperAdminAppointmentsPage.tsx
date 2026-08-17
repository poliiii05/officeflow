import { AppointmentManagementPanel } from '@/features/super-admin/appointments/AppointmentManagementPanel'
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'

export function SuperAdminAppointmentsPage() {
  return (
    <SuperAdminLayout
      title="Appointment management"
      description="Review appointment requests, manage schedules, and assign staff coverage."
      badge="Appointments"
    >
      <AppointmentManagementPanel />
    </SuperAdminLayout>
  )
}