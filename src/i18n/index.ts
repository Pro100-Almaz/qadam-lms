import { createI18n } from 'vue-i18n'
import ru from '@/locales/ru.json'
import kz from '@/locales/kz.json'
import en from '@/locales/en.json'

export type Locale = 'ru' | 'kz' | 'en'

export const SUPPORTED_LOCALES: { code: Locale; label: string }[] = [
  { code: 'ru', label: 'Русский' },
  { code: 'kz', label: 'Қазақша' },
  { code: 'en', label: 'English' },
]

/**
 * `'kz'` is this app's internal locale code — used for i18n messages, the
 * saved preference and API values such as `ReportLanguage` — but it is not a
 * valid BCP-47 language tag (Kazakh is `kk`). `document.documentElement.lang`
 * and anything handed to `Intl` needs the real tag, so every internal code is
 * mapped to one here rather than assigned directly.
 */
const BCP47_TAGS: Record<Locale, string> = { ru: 'ru', kz: 'kk', en: 'en' }

/** The BCP-47 tag for the active locale — for `Intl.*` and `<html lang>`. */
export function currentIntlLocale(): string {
  return BCP47_TAGS[i18n.global.locale.value as Locale] ?? 'ru'
}

function applyDocumentLang(locale: Locale) {
  document.documentElement.lang = BCP47_TAGS[locale] ?? 'ru'
}

const savedLocale = (localStorage.getItem('locale') as Locale) || 'ru'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'ru',
  messages: { ru, kz, en },
})

// `setLocale()` keeps `<html lang>` current, but the very first paint (before
// anyone switches languages) needs it too — otherwise the tab loads with
// `lang=""` regardless of what was saved last session.
applyDocumentLang(savedLocale)

export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
  applyDocumentLang(locale)
  // Dynamic import avoids a static cycle with the router, which imports this
  // module to resolve page titles — the router is already loaded by the time
  // a user can reach the language switcher, so this resolves immediately.
  import('@/router').then(({ refreshDocumentTitle }) => refreshDocumentTitle())
}

export default i18n
