export interface AttendanceWeek {
  /** ISO date of the Monday, also used as the option value. */
  id: string
  start: string
  end: string
  /** ISO dates Monday → Sunday. */
  days: string[]
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const weekdayFromMonday = (result.getDay() + 6) % 7
  result.setDate(result.getDate() - weekdayFromMonday)
  return result
}

function buildWeek(monday: Date): AttendanceWeek {
  const days: string[] = []
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    days.push(toIsoDate(day))
  }
  return { id: days[0], start: days[0], end: days[6], days }
}

/** Every Monday→Sunday week that overlaps the given month (`period` = `YYYY-MM`). */
export function weeksOfMonth(period: string): AttendanceWeek[] {
  const [year, month] = period.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const weeks: AttendanceWeek[] = []
  const cursor = startOfWeek(firstDay)
  while (cursor <= lastDay) {
    weeks.push(buildWeek(new Date(cursor)))
    cursor.setDate(cursor.getDate() + 7)
  }
  return weeks
}

export function currentPeriod(date = new Date()): string {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`
}

/** App locale codes — `kz` is the project's code for Kazakh (BCP 47 `kk`). */
export type CalendarLocale = 'ru' | 'kz' | 'en'


const MONTHS_SHORT: Record<CalendarLocale, string[]> = {
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Мая', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  kz: ['Қаң', 'Ақп', 'Нау', 'Сәу', 'Мам', 'Мау', 'Шіл', 'Там', 'Қыр', 'Қаз', 'Қар', 'Жел'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

/** Indexed by `Date.getDay()` — Sunday first. */
const WEEKDAYS_SHORT: Record<CalendarLocale, string[]> = {
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  kz: ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}

export function toCalendarLocale(locale: string): CalendarLocale {
  return locale === 'kz' || locale === 'en' ? locale : 'ru'
}

/** `DD.MM` — numeric, so it reads the same in every language. */
export function formatDayMonth(iso: string): string {
  const date = parseIsoDate(iso)
  return `${`${date.getDate()}`.padStart(2, '0')}.${`${date.getMonth() + 1}`.padStart(2, '0')}`
}

export function formatWeekday(iso: string, locale: CalendarLocale): string {
  return WEEKDAYS_SHORT[locale][parseIsoDate(iso).getDay()]
}

function formatDayWithMonth(iso: string, locale: CalendarLocale): string {
  const date = parseIsoDate(iso)
  return `${date.getDate()} ${MONTHS_SHORT[locale][date.getMonth()]}`
}

export function formatWeekRange(week: AttendanceWeek, locale: CalendarLocale): string {
  return `${formatDayWithMonth(week.start, locale)} — ${formatDayWithMonth(week.end, locale)}`
}
