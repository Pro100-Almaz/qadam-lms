import axios from 'axios'

/** Backwards-compatible name used by existing mutation screens: every 403 is authoritative. */
export function isTeachingPeriodPermissionError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403
}

export function isForbiddenError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403
}
