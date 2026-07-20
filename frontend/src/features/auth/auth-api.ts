import { api } from '@/lib/api'
import { type AuthUser, saveAuthSession } from '@/lib/auth-storage'

type AuthResponse = {
  data: {
    user: AuthUser
    token: string
    token_type: 'Bearer'
  }
  message: string
}

export type RegisterPayload = {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirmation: string
  requester_type: 'employee' | 'visitor'
}

export type LoginPayload = {
  email: string
  password: string
}

export async function registerUser(payload: RegisterPayload) {
  const response = await api.post<AuthResponse>('/auth/register', payload)
  saveAuthSession(response.data.data.token, response.data.data.user)

  return response.data
}

export async function loginUser(payload: LoginPayload) {
  const response = await api.post<AuthResponse>('/auth/login', payload)
  saveAuthSession(response.data.data.token, response.data.data.user)

  return response.data
}