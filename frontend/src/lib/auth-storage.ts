export const AUTH_TOKEN_KEY = 'officeflow.auth.token'
export const AUTH_USER_KEY = 'officeflow.auth.user'

export type AuthUser = {
  id: number
  name: string
  nickname: string | null
  email: string
  email_verified_at: string | null
  google_id?: string | null
  avatar_url?: string | null
  role: 'user' | 'staff' | 'super_admin'
  requester_type: 'employee' | 'visitor' | null
  terms_accepted_at: string | null
  onboarding_completed_at: string | null
}

function getActiveStorage() {
  if (localStorage.getItem(AUTH_TOKEN_KEY)) return localStorage
  if (sessionStorage.getItem(AUTH_TOKEN_KEY)) return sessionStorage

  return localStorage
}

export function saveAuthSession(token: string, user: AuthUser, remember = true) {
  clearAuthSession()

  const storage = remember ? localStorage : sessionStorage
  storage.setItem(AUTH_TOKEN_KEY, token)
  storage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY)
}

export function getStoredUser() {
  const user = localStorage.getItem(AUTH_USER_KEY) ?? sessionStorage.getItem(AUTH_USER_KEY)
  return user ? (JSON.parse(user) as AuthUser) : null
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
  sessionStorage.removeItem(AUTH_USER_KEY)
}

export function saveAuthToken(token: string, remember = true) {
  clearAuthSession()

  const storage = remember ? localStorage : sessionStorage
  storage.setItem(AUTH_TOKEN_KEY, token)
}

export function saveStoredUser(user: AuthUser) {
  getActiveStorage().setItem(AUTH_USER_KEY, JSON.stringify(user))
}