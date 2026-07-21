import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { fetchCurrentUser } from '@/features/auth/auth-api'
import {
  getStoredToken,
  getStoredUser,
  saveAuthSession,
  saveAuthToken,
  saveStoredUser,
} from '@/lib/auth-storage'

export function ProtectedRoute() {
  const location = useLocation()
  const [status, setStatus] = useState<'checking' | 'allowed' | 'blocked'>('checking')

  useEffect(() => {
    async function verifyAuth() {
      const params = new URLSearchParams(location.search)
      const googleToken = params.get('google_token')

      if (googleToken) {
        try {
          saveAuthToken(googleToken)

          const user = await fetchCurrentUser()
          saveAuthSession(googleToken, user)

          window.history.replaceState(null, '', location.pathname)
          setStatus('allowed')
        } catch {
          window.history.replaceState(null, '', '/login?google_error=failed')
          setStatus('blocked')
        }

        return
      }

      const storedToken = getStoredToken()
      const storedUser = getStoredUser()

      if (!storedToken) {
        setStatus('blocked')
        return
      }

      if (storedUser) {
        setStatus('allowed')
        return
      }

      try {
        const user = await fetchCurrentUser()
        saveStoredUser(user)
        setStatus('allowed')
      } catch {
        setStatus('blocked')
      }
    }

    void verifyAuth()
  }, [location.pathname, location.search])

  if (status === 'checking') {
    return <main className="min-h-screen bg-background" />
  }

  if (status === 'blocked') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}