import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { getSystemStatus, type PublicSystemStatus } from '@/features/super-admin/settings/settings-api'
import { getDashboardPath } from '@/lib/auth-redirect'
import { getStoredUser } from '@/lib/auth-storage'

export function MaintenanceGate() {
  const location = useLocation()
  const user = getStoredUser()
  const [status, setStatus] = useState<PublicSystemStatus | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let isActive = true

    async function checkSystemStatus() {
      try {
        const data = await getSystemStatus()

        if (isActive) {
          setStatus(data)
        }
      } catch {
        if (isActive) {
          setStatus(null)
        }
      } finally {
        if (isActive) {
          setIsChecking(false)
        }
      }
    }

    void checkSystemStatus()

    return () => {
      isActive = false
    }
  }, [])

  if (isChecking) {
    return <main className="min-h-screen bg-background" />
  }

  const maintenanceMode = status?.maintenance_mode ?? false
  const isMaintenancePage = location.pathname === '/maintenance'
  const isLoginPage = location.pathname === '/login'
  const canBypassMaintenance =
    user?.role === 'staff' || user?.role === 'super_admin' || (!user && isLoginPage)

  if (maintenanceMode && !canBypassMaintenance && !isMaintenancePage) {
    return <Navigate to="/maintenance" replace />
  }

  if (isMaintenancePage && (!maintenanceMode || canBypassMaintenance)) {
    return <Navigate to={user ? getDashboardPath(user) : '/'} replace />
  }

  return <Outlet />
}