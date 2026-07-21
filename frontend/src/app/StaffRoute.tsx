import { Navigate, Outlet } from 'react-router-dom'

import { getDashboardPath } from '@/lib/auth-redirect'
import { getStoredUser } from '@/lib/auth-storage'

export function StaffRoute() {
  const user = getStoredUser()
  const canAccessStaffArea = user?.role === 'staff' || user?.role === 'super_admin'

  return canAccessStaffArea ? <Outlet /> : <Navigate to={getDashboardPath(user)} replace />
}