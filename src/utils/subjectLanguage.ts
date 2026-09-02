import type { LanguageGroup } from '@/types/subject'

/**
 * Translated label for a subject's language group. The value arrives in mixed
 * case from some endpoints, so it is normalised before building the i18n key;
 * a missing group renders as a dash rather than throwing.
 */
export function formatLanguageGroup(
  lang: LanguageGroup | string | null | undefined,
  t: (key: string) => string,
): string {
  if (!lang) return '—'
  return t(`subjects.languages.${String(lang).toLowerCase()}`)
}
