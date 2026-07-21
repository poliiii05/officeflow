import type { AuthUser } from '@/lib/auth-storage'

export function getDashboardPath(user: AuthUser | null) {
  if (!user) return '/login'

  if (user.role === 'staff' || user.role === 'super_admin') {
    return '/staff/dashboard'
  }

  return '/dashboard'
}