import { Navigate, Outlet } from 'react-router-dom'

import { getStoredToken } from '@/lib/auth-storage'

export function GuestRoute() {
  return getStoredToken() ? <Navigate to="/dashboard" replace /> : <Outlet />
}