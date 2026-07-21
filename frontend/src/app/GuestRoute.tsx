import { Navigate, Outlet } from 'react-router-dom'

import { getDashboardPath } from '@/lib/auth-redirect'
import { getStoredToken, getStoredUser } from '@/lib/auth-storage'

export function GuestRoute() {
  const token = getStoredToken()
  const user = getStoredUser()

  return token && user ? <Navigate to={getDashboardPath(user)} replace /> : <Outlet />
}