export const AUTH_TOKEN_KEY = 'officeflow.auth.token'
export const AUTH_USER_KEY = 'officeflow.auth.user'

export type AuthUser = {
  id: number
  name: string
  email: string
  role: 'user' | 'staff' | 'super_admin'
  requester_type: 'employee' | 'visitor' | null
}

export function saveAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function getStoredUser() {
  const user = localStorage.getItem(AUTH_USER_KEY)
  return user ? (JSON.parse(user) as AuthUser) : null
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}