import { Navigate, Outlet } from 'react-router-dom'

import { getStoredToken } from '@/lib/auth-storage'

export function ProtectedRoute() {
  return getStoredToken() ? <Outlet /> : <Navigate to="/login" replace />
}