import axios from 'axios'
import type { AuthTokens } from '@/types/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post<AuthTokens>(
            `${api.defaults.baseURL}/auth/token/refresh/`,
            { refresh },
          )
          setAccessToken(data.access)
          localStorage.setItem('refresh_token', data.refresh)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          setAccessToken(null)
          localStorage.removeItem('refresh_token')
          window.location.href = '/signin'
        }
      } else {
        window.location.href = '/signin'
      }
    }
    return Promise.reject(error)
  },
)

export default api
