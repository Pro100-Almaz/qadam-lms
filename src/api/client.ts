import axios from 'axios'
import type { AuthTokens } from '@/types/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// ─── In-memory access token (never stored in localStorage) ────────────────────

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

// ─── Generic list response helpers ────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type ListResponse<T> = T[] | PaginatedResponse<T>

export function unwrapList<T>(data: ListResponse<T>): T[] {
  return Array.isArray(data) ? data : data.results ?? []
}

export function unwrapPaginated<T>(data: ListResponse<T>): PaginatedResponse<T> {
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data }
  }
  return data as PaginatedResponse<T>
}

// ─── Request interceptor ──────────────────────────────────────────────────────

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ─── Refresh-in-flight dedupe ─────────────────────────────────────────────────
// Simple JWT rotates the refresh token on every successful /auth/token/refresh/
// call and blacklists the previous one. If multiple callers race (App init,
// router guard, 401 interceptor) they all send the same refresh and all but the
// first get a 401 because the token was just blacklisted. The failing branches
// then wipe the *rotated* token from localStorage, logging the user out.
// Funnel every refresh through a single in-flight promise so concurrent callers
// await the same network call.

let refreshInFlight: Promise<string> | null = null

export function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) return refreshInFlight

  const refresh = localStorage.getItem('refresh_token')
  if (!refresh) {
    return Promise.reject(new Error('No refresh token'))
  }

  refreshInFlight = axios
    .post<AuthTokens>(`${api.defaults.baseURL}/auth/token/refresh/`, { refresh })
    .then(({ data }) => {
      setAccessToken(data.access)
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh)
      }
      return data.access
    })
    .finally(() => {
      refreshInFlight = null
    })

  return refreshInFlight
}

// ─── Response interceptor (401 refresh) ───────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const access = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${access}`
        return api(original)
      } catch {
        setAccessToken(null)
        localStorage.removeItem('refresh_token')
        window.dispatchEvent(new Event('auth:logout'))
      }
    }
    return Promise.reject(error)
  },
)

// ─── Response interceptor (global error toasts) ──────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Lazy import to avoid circular dependency at module load time
    import('@/composables/useToast').then(({ useToast }) => {
      const { error: showError } = useToast()

      if (error.response) {
        const status = error.response.status

        if (status === 401) return
        if (status === 429) {
          showError('Too many requests', 'Please wait and try again')
        } else if (status === 403) {
          showError('Access denied')
        } else if (status >= 500) {
          showError('Server error', 'Please try again later')
        }
      } else if (error.code === 'ERR_NETWORK') {
        showError('Connection lost', 'Check your internet connection')
      }
    })

    return Promise.reject(error)
  },
)

export default api
