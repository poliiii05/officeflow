import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { GuestRoute } from '@/app/GuestRoute'
import { MaintenanceGate } from '@/app/MaintenanceGate'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { StaffRoute } from '@/app/StaffRoute'
import { SuperAdminRoute } from '@/app/SuperAdminRoute'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { LandingPage } from '@/pages/auth/public/LandingPage'
import { MaintenancePage } from '@/pages/auth/public/MaintenancePage'
import { StaffDashboardPage } from '@/pages/staff/StaffDashboardPage'
import { StaffQueuePage } from '@/pages/staff/StaffQueuePage'
import { StaffRecordsPage } from '@/pages/staff/StaffRecordsPage'
import { StaffSettingsPage } from '@/pages/staff/StaffSettingsPage'
import { StaffShiftsPage } from '@/pages/staff/StaffShiftsPage'
import { StaffWorkPage } from '@/pages/staff/StaffWorkPage'
import { SuperAdminAccountSettingsPage } from '@/pages/super-admin/SuperAdminAccountSettingsPage'
import { SuperAdminAnalyticsPage } from '@/pages/super-admin/SuperAdminAnalyticsPage'
import { SuperAdminAuditLogsPage } from '@/pages/super-admin/SuperAdminAuditLogsPage'
import { SuperAdminOverviewPage } from '@/pages/super-admin/SuperAdminOverviewPage'
import { SuperAdminQueuePage } from '@/pages/super-admin/SuperAdminQueuePage'
import { SuperAdminSettingsPage } from '@/pages/super-admin/SuperAdminSettingsPage'
import { SuperAdminStaffPage } from '@/pages/super-admin/SuperAdminStaffPage'
import { SuperAdminUsersPage } from '@/pages/super-admin/SuperAdminUsersPage'
import { UserAppointmentsPage } from '@/pages/user/UserAppointmentsPage'
import { UserDashboardPage } from '@/pages/user/UserDashboardPage'
import { UserNotificationsPage } from '@/pages/user/UserNotificationsPage'
import { UserSettingsPage } from '@/pages/user/UserSettingsPage'
import { UserTicketsPage } from '@/pages/user/UserTicketsPage'

const router = createBrowserRouter([
  {
    element: <MaintenanceGate />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/maintenance', element: <MaintenancePage /> },
      {
        element: <GuestRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: '/login', element: <LoginPage /> },
              { path: '/register', element: <RegisterPage /> },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <UserDashboardPage /> },
          { path: '/tickets', element: <UserTicketsPage /> },
          { path: '/appointments', element: <UserAppointmentsPage /> },
          { path: '/notifications', element: <UserNotificationsPage /> },
          { path: '/settings', element: <UserSettingsPage /> },
          {
            element: <StaffRoute />,
            children: [
              { path: '/staff/dashboard', element: <StaffDashboardPage /> },
              { path: '/staff/queue', element: <StaffQueuePage /> },
              { path: '/staff/work', element: <StaffWorkPage /> },
              { path: '/staff/records', element: <StaffRecordsPage /> },
              { path: '/staff/shifts', element: <StaffShiftsPage /> },
              { path: '/staff/settings', element: <StaffSettingsPage /> },
            ],
          },
          {
            element: <SuperAdminRoute />,
            children: [
              { path: '/super-admin/dashboard', element: <SuperAdminOverviewPage /> },
              { path: '/super-admin/users', element: <SuperAdminUsersPage /> },
              { path: '/super-admin/staff', element: <SuperAdminStaffPage /> },
              { path: '/super-admin/queue', element: <SuperAdminQueuePage /> },
              { path: '/super-admin/audit-logs', element: <SuperAdminAuditLogsPage /> },
              { path: '/super-admin/analytics', element: <SuperAdminAnalyticsPage /> },
              { path: '/super-admin/settings', element: <SuperAdminSettingsPage /> },
              { path: '/super-admin/account-settings', element: <SuperAdminAccountSettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}