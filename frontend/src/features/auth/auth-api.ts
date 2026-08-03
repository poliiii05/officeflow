import { api } from '@/lib/api'
import { clearAuthSession, type AuthUser, saveAuthSession } from '@/lib/auth-storage'

export { getApiErrorMessage } from '@/lib/api'

type AuthResponse = {
  data: {
    user: AuthUser
    token: string
    token_type: 'Bearer'
  }
  message: string
}

type RegisterResponse = {
  data: {
    user: AuthUser
  }
  message: string
}

export type RegisterPayload = {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirmation: string
  terms_accepted: boolean
}

export type LoginPayload = {
  email: string
  password: string
}

export async function registerUser(payload: RegisterPayload) {
  const response = await api.post<RegisterResponse>('/auth/register', payload)
  return response.data
}

export async function loginUser(payload: LoginPayload, remember = true) {
  const response = await api.post<AuthResponse>('/auth/login', payload)
  saveAuthSession(response.data.data.token, response.data.data.user, remember)
  return response.data
}

export async function logoutUser() {
  try {
    await api.post<{ message: string }>('/auth/logout')
  } catch {
    // Local sign-out must still finish if the API is temporarily unavailable.
  } finally {
    clearAuthSession()
  }
}

export async function fetchCurrentUser() {
  const response = await api.get<{ data: AuthUser }>('/me')
  return response.data.data
}

export async function acceptTerms() {
  const response = await api.post<{ data: { user: AuthUser } }>('/auth/accept-terms')
  return response.data.data.user
}

export async function completeOnboarding() {
  const response = await api.post<{ data: { user: AuthUser } }>('/auth/complete-onboarding')
  return response.data.data.user
}
