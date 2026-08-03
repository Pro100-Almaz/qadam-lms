<template>
  <AdminLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <router-link :to="`/clubs/${clubId}`" class="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-brand-500 dark:text-gray-400">
        <ArrowLeft class="h-4 w-4" /> {{ t('clubs.backToClub') }}
      </router-link>

      <div v-if="pageLoading" class="flex min-h-72 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <Loader2 class="h-7 w-7 animate-spin text-brand-500" />
      </div>

      <template v-else-if="club">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">{{ t('clubs.attendanceTitle') }}</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ club.club_name }}</p>
        </div>

        <section class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label>
              <span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('clubs.attendanceDate') }}</span>
              <div class="relative">
                <flat-pickr v-model="selectedDate" :config="attendanceDatePickerConfig" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" @on-change="handleDateChange" />
                <CalendarDays class="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </label>
            <div>
              <span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('clubs.session') }}</span>
              <ClubSessionSelect
                :model-value="selectedSessionId"
                :sessions="sessionsForDate"
                :placeholder="t('clubs.selectSession')"
                :aria-label="t('clubs.session')"
                :disabled="!sessionsForDate.length"
                @update:model-value="selectSession"
              />
            </div>
          </div>
          <p v-if="selectedDate && !sessionsForDate.length" class="mt-3 flex items-center gap-2 text-sm text-warning-600 dark:text-warning-400"><CircleAlert class="h-4 w-4" />{{ t('clubs.noSessionForDate') }}</p>
          <p v-if="sessionError" class="mt-3 flex items-center gap-2 text-sm text-error-500"><CircleAlert class="h-4 w-4" />{{ sessionError }}</p>
        </section>

        <template v-if="sessionLoading">
          <div class="flex min-h-52 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"><Loader2 class="h-6 w-6 animate-spin text-brand-500" /></div>
        </template>

        <template v-else-if="attendance">
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"><p class="text-xs text-gray-500 dark:text-gray-400">{{ t('clubs.totalStudents') }}</p><p class="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">{{ attendance.total_students }}</p></div>
            <div class="rounded-xl border border-success-200 bg-success-50 p-4 dark:border-success-500/20 dark:bg-success-500/10"><p class="text-xs text-success-700 dark:text-success-400">{{ t('clubs.present') }}</p><p class="mt-1 text-xl font-semibold text-success-700 dark:text-success-400">{{ presentCount }}</p></div>
            <div class="rounded-xl border border-error-200 bg-error-50 p-4 dark:border-error-500/20 dark:bg-error-500/10"><p class="text-xs text-error-600 dark:text-error-400">{{ t('clubs.absent') }}</p><p class="mt-1 text-xl font-semibold text-error-600 dark:text-error-400">{{ absentCount }}</p></div>
            <div class="rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-500/20 dark:bg-warning-500/10"><p class="text-xs text-warning-700 dark:text-warning-400">{{ t('clubs.late') }}</p><p class="mt-1 text-xl font-semibold text-warning-700 dark:text-warning-400">{{ lateCount }}</p></div>
            <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60"><p class="text-xs text-gray-500 dark:text-gray-400">{{ t('clubs.unmarked') }}</p><p class="mt-1 text-xl font-semibold text-gray-700 dark:text-gray-300">{{ unmarkedCount }}</p></div>
          </div>

          <section class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clubs.studentAttendance') }}</h2>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ formatDisplayDate(attendance.date) }}</p>
            </div>
            <div v-if="attendance.records.length" class="divide-y divide-gray-100 dark:divide-gray-800">
              <div v-for="record in attendance.records" :key="record.student_id" class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">{{ initials(record.full_name) }}</span>
                  <div class="min-w-0"><p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">{{ record.full_name }}</p><p class="text-xs text-gray-500 dark:text-gray-400">{{ record.class_name }}</p></div>
                </div>
                <div class="grid grid-cols-3 gap-2 sm:w-80">
                  <button type="button" class="rounded-lg border px-2 py-2 text-xs font-medium transition" :class="statusButtonClass(record.student_id, 'present')" @click="setStatus(record.student_id, 'present')">{{ t('clubs.present') }}</button>
                  <button type="button" class="rounded-lg border px-2 py-2 text-xs font-medium transition" :class="statusButtonClass(record.student_id, 'absent')" @click="setStatus(record.student_id, 'absent')">{{ t('clubs.absent') }}</button>
                  <button type="button" class="rounded-lg border px-2 py-2 text-xs font-medium transition" :class="statusButtonClass(record.student_id, 'late')" @click="setStatus(record.student_id, 'late')">{{ t('clubs.late') }}</button>
                </div>
              </div>
            </div>
            <div v-else class="px-5 py-14 text-center"><Users class="mx-auto h-8 w-8 text-gray-400" /><p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.noMembersForAttendance') }}</p></div>
          </section>

          <div class="flex justify-end">
            <button type="button" :disabled="!attendance.records.length || attendanceSaving" class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50" @click="saveAttendance"><Loader2 v-if="attendanceSaving" class="h-4 w-4 animate-spin" /><Save v-else class="h-4 w-4" />{{ t('clubs.saveAttendance') }}</button>
          </div>
        </template>

        <section class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div class="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10"><History class="h-4 w-4 text-brand-500" /></div>
              <div><h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clubs.attendanceHistory') }}</h2><p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ t('clubs.attendanceHistoryHint') }}</p></div>
            </div>
            <div class="sm:w-72">
              <ClubMonthYearPicker
                :model-value="selectedHistoryPeriod"
                :min-date="club.start_date"
                :max-date="club.end_date"
                :label="`${t('clubs.month')} / ${t('clubs.year')}`"
                @update:model-value="handleHistoryPeriodChange"
              />
            </div>
          </div>
          <div v-if="historyLoading" class="flex min-h-40 items-center justify-center"><Loader2 class="h-6 w-6 animate-spin text-brand-500" /></div>
          <div v-else-if="history.length" class="divide-y divide-gray-100 dark:divide-gray-800">
            <button v-for="item in history" :key="`${item.date}-${item.session_id}`" type="button" class="grid w-full grid-cols-1 gap-3 px-5 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-white/5 sm:grid-cols-[1fr_auto] sm:items-center" @click="selectHistoryItem(item)">
              <div>
                <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ formatDisplayDate(item.date) }} · {{ dayName(item.weekday) }}</p>
                <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400"><span class="inline-flex items-center gap-1"><Clock3 class="h-3.5 w-3.5" />{{ item.start_time }}–{{ item.end_time }}</span><span class="inline-flex items-center gap-1"><MapPin class="h-3.5 w-3.5" />{{ item.location }}</span></p>
              </div>
              <div class="flex flex-wrap gap-2 text-xs"><span class="rounded-full bg-success-50 px-2 py-1 text-success-700 dark:bg-success-500/10 dark:text-success-400">{{ t('clubs.present') }}: {{ item.present_count }}</span><span class="rounded-full bg-error-50 px-2 py-1 text-error-600 dark:bg-error-500/10 dark:text-error-400">{{ t('clubs.absent') }}: {{ item.absent_count }}</span><span class="rounded-full bg-warning-50 px-2 py-1 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">{{ t('clubs.late') }}: {{ item.late_count }}</span><span v-if="item.unmarked_count" class="rounded-full bg-gray-100 px-2 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-300">{{ t('clubs.unmarked') }}: {{ item.unmarked_count }}</span></div>
            </button>
          </div>
          <p v-else-if="!historyError" class="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.noAttendanceHistory') }}</p>
          <div v-else class="px-5 py-10 text-center"><p class="text-sm text-error-500">{{ t('clubs.attendanceHistoryLoadError') }}</p><button type="button" class="mt-3 text-sm font-medium text-brand-500" @click="loadHistory">{{ t('clubs.tryAgain') }}</button></div>
          <div v-if="!historyLoading && !historyError && historyTotal > 0" class="border-t border-gray-200 px-5 py-4 dark:border-gray-800">
            <Pagination :total="historyTotal" :current-page="historyPage" :page-size="historyPageSize" :page-sizes="[10, 20, 50]" @update:current-page="changeHistoryPage" @update:page-size="changeHistoryPageSize" />
          </div>
        </section>
      </template>

      <div v-else class="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900"><CircleAlert class="mx-auto h-8 w-8 text-gray-400" /><p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ pageError || t('clubs.notFound') }}</p></div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import flatPickr from 'vue-flatpickr-component'
import { Kazakh } from 'flatpickr/dist/l10n/kz'
import { Russian } from 'flatpickr/dist/l10n/ru'
import { ArrowLeft, CalendarDays, CircleAlert, Clock3, History, Loader2, MapPin, Save, Users } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ClubMonthYearPicker from '@/components/clubs/ClubMonthYearPicker.vue'
import ClubSessionSelect from '@/components/clubs/ClubSessionSelect.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { getClubApi, getClubAttendanceHistoryApi, getClubSessionAttendanceApi, replaceClubSessionAttendanceApi, type ClubAttendanceHistoryItem, type ClubAttendanceStatus, type ClubDetail, type ClubSessionAttendance, type ClubWeekday } from '@/api/clubs'
import { useToast } from '@/composables/useToast'

const { t, locale } = useI18n()
const route = useRoute()
const { success } = useToast()
const clubId = String(route.params.id)
const club = ref<ClubDetail | null>(null)
const pageLoading = ref(true)
const pageError = ref('')
const selectedDate = ref('')
const selectedSessionId = ref<number | null>(null)
const attendance = ref<ClubSessionAttendance | null>(null)
const sessionLoading = ref(false)
const sessionError = ref('')
const attendanceSaving = ref(false)
const statuses = ref<Record<number, ClubAttendanceStatus | null>>({})
const history = ref<ClubAttendanceHistoryItem[]>([])
const historyError = ref(false)
const historyLoading = ref(false)
const historyTotal = ref(0)
const historyPage = ref(1)
const historyPageSize = ref(10)
const selectedHistoryPeriod = ref(formatLocalDate(new Date()).slice(0, 7))
const pickerLocale = computed(() => locale.value === 'kz' ? Kazakh : locale.value === 'ru' ? Russian : undefined)
const attendanceDatePickerConfig = computed(() => ({
  dateFormat: 'Y-m-d',
  altInput: true,
  altFormat: 'd.m.Y',
  allowInput: false,
  disableMobile: true,
  minDate: club.value?.start_date,
  maxDate: club.value?.end_date,
  locale: pickerLocale.value,
}))

const sessionsForDate = computed(() => {
  if (!club.value || !selectedDate.value) return []
  const weekday = weekdayForDate(selectedDate.value)
  return club.value.schedule.filter(session => session.weekday === weekday)
})
const presentCount = computed(() => attendance.value?.records.filter(record => statuses.value[record.student_id] === 'present').length ?? 0)
const absentCount = computed(() => attendance.value?.records.filter(record => statuses.value[record.student_id] === 'absent').length ?? 0)
const lateCount = computed(() => attendance.value?.records.filter(record => statuses.value[record.student_id] === 'late').length ?? 0)
const unmarkedCount = computed(() => attendance.value?.records.filter(record => !statuses.value[record.student_id]).length ?? 0)
const historyDateRange = computed(() => {
  if (!club.value) return { dateFrom: '', dateTo: '' }
  const [year, month] = selectedHistoryPeriod.value.split('-').map(Number)
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = monthLastDate(year, month)
  return {
    dateFrom: firstDay < club.value.start_date ? club.value.start_date : firstDay,
    dateTo: lastDay > club.value.end_date ? club.value.end_date : lastDay,
  }
})

onMounted(loadPage)

async function loadPage() {
  pageLoading.value = true
  pageError.value = ''
  try {
    const { data } = await getClubApi(clubId)
    club.value = data
    initializeHistoryPeriod(data)
    await loadHistory()

    const firstHistoryItem = history.value[0]
    if (firstHistoryItem) {
      selectedDate.value = firstHistoryItem.date
      selectedSessionId.value = firstHistoryItem.session_id
    } else {
      selectedDate.value = findFirstSessionDate(data)
      selectedSessionId.value = sessionsForDate.value[0]?.id ?? null
    }
    if (selectedSessionId.value) await loadSessionAttendance()
  } catch (error) {
    club.value = null
    pageError.value = errorDetail(error) || t('clubs.detailLoadError')
  } finally {
    pageLoading.value = false
  }
}

async function loadHistory() {
  if (!club.value) return
  historyLoading.value = true
  historyError.value = false
  try {
    const { data } = await getClubAttendanceHistoryApi(club.value.id, {
      date_from: historyDateRange.value.dateFrom,
      date_to: historyDateRange.value.dateTo,
      page: historyPage.value,
      page_size: historyPageSize.value,
    })
    history.value = data.results
    historyTotal.value = data.count
  } catch {
    history.value = []
    historyTotal.value = 0
    historyError.value = true
  } finally {
    historyLoading.value = false
  }
}

function initializeHistoryPeriod(currentClub: ClubDetail) {
  const today = formatLocalDate(new Date())
  const boundedDate = today < currentClub.start_date
    ? currentClub.start_date
    : today > currentClub.end_date
      ? currentClub.end_date
      : today
  selectedHistoryPeriod.value = boundedDate.slice(0, 7)
}

async function handleHistoryPeriodChange(period: string) {
  selectedHistoryPeriod.value = period
  await applyHistoryFilters()
}

async function applyHistoryFilters() {
  historyPage.value = 1
  await loadHistory()
}

async function changeHistoryPage(page: number) {
  historyPage.value = page
  await loadHistory()
}

async function changeHistoryPageSize(pageSize: number) {
  historyPageSize.value = pageSize
  historyPage.value = 1
  await loadHistory()
}

async function handleDateChange(_dates?: Date[], dateString?: string) {
  if (dateString !== undefined) selectedDate.value = dateString
  attendance.value = null
  statuses.value = {}
  sessionError.value = ''
  selectedSessionId.value = sessionsForDate.value[0]?.id ?? null
  if (selectedSessionId.value) await loadSessionAttendance()
}

async function loadSessionAttendance() {
  if (!selectedDate.value || !selectedSessionId.value) return
  sessionLoading.value = true
  sessionError.value = ''
  try {
    const { data } = await getClubSessionAttendanceApi(clubId, selectedDate.value, selectedSessionId.value)
    setAttendance(data)
  } catch (error) {
    attendance.value = null
    statuses.value = {}
    sessionError.value = errorDetail(error) || t('clubs.attendanceLoadError')
  } finally {
    sessionLoading.value = false
  }
}

async function selectSession(sessionId: number) {
  selectedSessionId.value = sessionId
  await loadSessionAttendance()
}

function setAttendance(data: ClubSessionAttendance) {
  attendance.value = data
  statuses.value = Object.fromEntries(data.records.map(record => [record.student_id, record.status]))
}

function setStatus(studentId: number, status: ClubAttendanceStatus) {
  statuses.value = { ...statuses.value, [studentId]: status }
  sessionError.value = ''
}

async function saveAttendance() {
  if (!attendance.value || !selectedDate.value || !selectedSessionId.value) return
  const hasUnmarkedStudents = attendance.value.records.some(record => !statuses.value[record.student_id])
  if (hasUnmarkedStudents) {
    sessionError.value = t('clubs.completeAttendance')
    return
  }

  attendanceSaving.value = true
  sessionError.value = ''
  try {
    const { data } = await replaceClubSessionAttendanceApi(clubId, selectedDate.value, selectedSessionId.value, {
      records: attendance.value.records.map(record => ({
        attendance_id: record.attendance_id,
        student_id: record.student_id,
        status: statuses.value[record.student_id] as ClubAttendanceStatus,
      })),
    })
    setAttendance(data)
    await loadHistory()
    success(t('clubs.attendanceSaved'), club.value?.club_name)
  } catch (error) {
    sessionError.value = attendanceError(error) || t('clubs.attendanceSaveFailed')
  } finally {
    attendanceSaving.value = false
  }
}

async function selectHistoryItem(item: ClubAttendanceHistoryItem) {
  selectedDate.value = item.date
  selectedSessionId.value = item.session_id
  await loadSessionAttendance()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function weekdayForDate(date: string): ClubWeekday {
  const weekdays: ClubWeekday[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return weekdays[new Date(`${date}T00:00:00Z`).getUTCDay()]
}

function findFirstSessionDate(currentClub: ClubDetail): string {
  const start = new Date(`${currentClub.start_date}T00:00:00Z`)
  const end = new Date(`${currentClub.end_date}T00:00:00Z`)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const cursor = today < start ? start : today > end ? start : today
  const scheduledDays = new Set(currentClub.schedule.map(session => session.weekday))
  while (cursor <= end) {
    const value = cursor.toISOString().slice(0, 10)
    if (scheduledDays.has(weekdayForDate(value))) return value
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return currentClub.start_date
}

function monthLastDate(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function errorDetail(error: unknown): string {
  if (!axios.isAxiosError(error)) return ''
  return typeof error.response?.data?.detail === 'string' ? error.response.data.detail : ''
}

function formatDisplayDate(value: string): string {
  const locale = document.documentElement.lang || 'ru'
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

function dayName(day: ClubWeekday): string {
  return t(`lessons.days.${day}`)
}

function initials(fullName: string): string {
  return fullName.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase()
}

function attendanceError(error: unknown): string {
  if (!axios.isAxiosError(error) || !error.response?.data) return ''
  const data = error.response.data as Record<string, unknown>
  const value = data.records ?? data.detail
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.filter(item => typeof item === 'string').join(' ')
  return ''
}

function statusButtonClass(studentId: number, status: ClubAttendanceStatus): string {
  const selected = statuses.value[studentId] === status
  if (!selected) return 'border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5'
  if (status === 'present') return 'border-success-500 bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'
  if (status === 'absent') return 'border-error-500 bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400'
  return 'border-warning-500 bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
}
</script>
