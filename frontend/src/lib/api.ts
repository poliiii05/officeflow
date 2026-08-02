import axios from 'axios'

import { clearAuthSession, getStoredToken } from '@/lib/auth-storage'

type ApiErrorResponse = {
  message?: string
  errors?: Record<string, string[]>
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearAuthSession()

      const path = window.location.pathname
      const isGuestPage = path === '/login' || path === '/register'
      const isPublicPage = path === '/' || path === '/maintenance'

      if (!isGuestPage && !isPublicPage) {
        window.location.replace('/login')
      }
    }

    return Promise.reject(error)
  }
)

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallback
  }

  if (!error.response) {
    return 'Unable to reach OfficeFlow API. Make sure the backend server is running.'
  }

  const status = error.response.status
  const data = error.response.data

  const firstValidationError = data?.errors
    ? Object.values(data.errors).flat()[0]
    : undefined

  if (firstValidationError) return firstValidationError
  if (status === 429) return 'Too many attempts. Please wait a minute before trying again.'
  if (status === 401) return 'Your session expired. Please login again.'
  if (status === 403) return 'You do not have permission to do that.'
  if (status >= 500) return 'OfficeFlow server error. Please try again later.'

  return data?.message ?? fallback
}