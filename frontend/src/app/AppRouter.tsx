import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { GuestRoute } from '@/app/GuestRoute'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { StaffRoute } from '@/app/StaffRoute'
import { SuperAdminRoute } from '@/app/SuperAdminRoute'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { LandingPage } from '@/pages/public/LandingPage'
import { StaffDashboardPage } from '@/pages/staff/StaffDashboardPage'
import { SuperAdminAnalyticsPage } from '@/pages/super-admin/SuperAdminAnalyticsPage'
import { SuperAdminAuditLogsPage } from '@/pages/super-admin/SuperAdminAuditLogsPage'
import { SuperAdminOverviewPage } from '@/pages/super-admin/SuperAdminOverviewPage'
import { SuperAdminQueuePage } from '@/pages/super-admin/SuperAdminQueuePage'
import { SuperAdminStaffPage } from '@/pages/super-admin/SuperAdminStaffPage'
import { SuperAdminUsersPage } from '@/pages/super-admin/SuperAdminUsersPage'
import { UserDashboardPage } from '@/pages/user/UserDashboardPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: <LoginPage />,
          },
          {
            path: '/register',
            element: <RegisterPage />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <UserDashboardPage />,
      },
      {
        element: <StaffRoute />,
        children: [
          {
            path: '/staff/dashboard',
            element: <StaffDashboardPage />,
          },
        ],
      },
      {
        element: <SuperAdminRoute />,
        children: [
          {
            path: '/super-admin/dashboard',
            element: <SuperAdminOverviewPage />,
          },
          {
            path: '/super-admin/users',
            element: <SuperAdminUsersPage />,
          },
          {
            path: '/super-admin/staff',
            element: <SuperAdminStaffPage />,
          },
          {
            path: '/super-admin/queue',
            element: <SuperAdminQueuePage />,
          },
          {
            path: '/super-admin/audit-logs',
            element: <SuperAdminAuditLogsPage />,
          },
          {
            path: '/super-admin/analytics',
            element: <SuperAdminAnalyticsPage />,
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}