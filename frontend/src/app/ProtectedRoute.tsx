import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { fetchCurrentUser } from '@/features/auth/auth-api'
import {
  clearAuthSession,
  getStoredToken,
  saveAuthSession,
  saveAuthToken,
  saveStoredUser,
} from '@/lib/auth-storage'

export function ProtectedRoute() {
  const location = useLocation()
  const [status, setStatus] = useState<'checking' | 'allowed' | 'blocked'>('checking')

  useEffect(() => {
    let cancelled = false

    async function verifyAuth() {
      setStatus('checking')

      const params = new URLSearchParams(location.search)
      const googleToken = params.get('google_token')

      if (googleToken) {
        try {
          saveAuthToken(googleToken)

          const user = await fetchCurrentUser()
          saveAuthSession(googleToken, user)

          window.history.replaceState(null, '', location.pathname)
          if (!cancelled) setStatus('allowed')
        } catch {
          clearAuthSession()
          window.history.replaceState(null, '', '/login?google_error=failed')
          if (!cancelled) setStatus('blocked')
        }

        return
      }

      const storedToken = getStoredToken()

      if (!storedToken) {
        if (!cancelled) setStatus('blocked')
        return
      }

      try {
        const user = await fetchCurrentUser()
        saveStoredUser(user)
        if (!cancelled) setStatus('allowed')
      } catch {
        clearAuthSession()
        if (!cancelled) setStatus('blocked')
      }
    }

    void verifyAuth()

    return () => {
      cancelled = true
    }
  }, [location.search])

  if (status === 'checking') {
    return <main className="min-h-screen bg-background" />
  }

  if (status === 'blocked') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
