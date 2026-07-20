import axios from 'axios'

import { api } from '@/lib/api'
import { clearAuthSession, type AuthUser, saveAuthSession } from '@/lib/auth-storage'

type AuthResponse = {
  data: {
    user: AuthUser
    token: string
    token_type: 'Bearer'
  }
  message: string
}

type ApiErrorResponse = {
  message?: string
  errors?: Record<string, string[]>
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

export async function registerUser(payload: RegisterPayload, remember = true) {
  const response = await api.post<AuthResponse>('/auth/register', payload)
  saveAuthSession(response.data.data.token, response.data.data.user, remember)
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
  } finally {
    clearAuthSession()
  }
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data
    const firstValidationError = data?.errors
      ? Object.values(data.errors).flat()[0]
      : undefined

    return firstValidationError ?? data?.message ?? fallback
  }

  return fallback
}