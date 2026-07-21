import type { AuthUser } from '@/lib/auth-storage'

export function getDashboardPath(user: AuthUser | null) {
  if (!user) {
    return '/login'
  }

  return '/dashboard'
}