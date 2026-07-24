import type { AuthUser } from '@/lib/auth-storage'

export function getDashboardPath(user: AuthUser | null) {
  if (!user) return '/'

  if (user.role === 'super_admin') {
    return '/super-admin/dashboard'
  }

  if (user.role === 'staff') {
    return '/staff/dashboard'
  }

  return '/dashboard'
}