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

const savedLocale = (localStorage.getItem('locale') as Locale) || 'ru'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'ru',
  messages: { ru, kz, en },
})

export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
  document.documentElement.lang = locale
}

export default i18n
