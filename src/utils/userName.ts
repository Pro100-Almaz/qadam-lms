import type { User } from '@/types/auth'

/**
 * Display name for a user reference that the API may return as `null`
 * (e.g. `Subject.added_by` on rows imported without an author).
 * Falls back to the username, then to a dash.
 */
export function formatUserName(user: Partial<User> | null | undefined): string {
  if (!user) return '—'
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ')
  return full || user.username || '—'
}
