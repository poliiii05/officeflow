import { Navigate, Outlet } from 'react-router-dom'

import { getStoredUser } from '@/lib/auth-storage'

export function SuperAdminRoute() {
  const user = getStoredUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}