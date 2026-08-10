import { api } from '@/lib/api'
import type { AuthUser } from '@/lib/auth-storage'

export type UpdateProfilePayload = {
  name: string
  nickname: string | null
}

export type UpdatePasswordPayload = {
  current_password: string
  password: string
  password_confirmation: string
}

export async function getAccount() {
  const response = await api.get<{ data: AuthUser }>('/account')
  return response.data.data
}

export async function updateAccountProfile(payload: UpdateProfilePayload) {
  const response = await api.patch<{ data: AuthUser; message: string }>(
    '/account/profile',
    payload
  )

  return response.data
}

export async function updateAccountPassword(payload: UpdatePasswordPayload) {
  const response = await api.patch<{ message: string }>('/account/password', payload)
  return response.data
}