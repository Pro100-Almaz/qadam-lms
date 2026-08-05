<template>
  <AdminLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <button type="button" class="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-brand-500 dark:text-gray-400" @click="goBack">
        <ArrowLeft class="h-4 w-4" />
        {{ t('common.back') }}
      </button>

      <div v-if="pageLoading" class="flex min-h-72 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <Loader2 class="h-7 w-7 animate-spin text-brand-500" />
      </div>

      <template v-else-if="club">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex min-w-0 items-center gap-4">
          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
            <Puzzle class="h-6 w-6 text-brand-500" />
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">{{ club.club_name }}</h1>
              <ClubStatusBadge :status="club.status" />
            </div>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ club.student.full_name }} · {{ club.academic_year }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div class="min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p class="break-words text-xs leading-4 text-gray-500 dark:text-gray-400">{{ t('students.totalSessions') }}</p>
          <p class="mt-2 text-xl font-semibold text-gray-800 dark:text-white/90">{{ club.total_session_count }}</p>
        </div>
        <div class="min-w-0 rounded-xl border border-success-200 bg-success-50 p-4 dark:border-success-500/20 dark:bg-success-500/10">
          <p class="break-words text-xs leading-4 text-success-700 dark:text-success-400">{{ t('clubs.present') }}</p>
          <p class="mt-2 text-xl font-semibold text-success-700 dark:text-success-400">{{ club.present_count }}</p>
        </div>
        <div class="min-w-0 rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-500/20 dark:bg-warning-500/10">
          <p class="break-words text-xs leading-4 text-warning-700 dark:text-warning-400">{{ t('clubs.late') }}</p>
          <p class="mt-2 text-xl font-semibold text-warning-700 dark:text-warning-400">{{ club.late_count }}</p>
        </div>
        <div class="min-w-0 rounded-xl border border-error-200 bg-error-50 p-4 dark:border-error-500/20 dark:bg-error-500/10">
          <p class="break-words text-xs leading-4 text-error-600 dark:text-error-400">{{ t('clubs.absent') }}</p>
          <p class="mt-2 text-xl font-semibold text-error-600 dark:text-error-400">{{ club.absent_count }}</p>
        </div>
        <div class="min-w-0 rounded-xl border border-blue-light-200 bg-blue-light-50 p-4 dark:border-blue-light-500/20 dark:bg-blue-light-500/10">
          <p class="break-words text-xs leading-4 text-blue-light-700 dark:text-blue-light-400">{{ t('students.attendanceRate') }}</p>
          <p class="mt-2 text-xl font-semibold text-blue-light-700 dark:text-blue-light-400">{{ attendanceRate }}%</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10"><CalendarDays class="h-4 w-4 text-brand-500" /></div>
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.clubDetails') }}</h2>
          </div>
          <dl class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div><dt class="text-xs font-medium uppercase tracking-wide text-gray-400">{{ t('clubs.startDate') }}</dt><dd class="mt-1.5 text-sm text-gray-700 dark:text-gray-300">{{ formatDate(club.start_date) }}</dd></div>
            <div><dt class="text-xs font-medium uppercase tracking-wide text-gray-400">{{ t('clubs.endDate') }}</dt><dd class="mt-1.5 text-sm text-gray-700 dark:text-gray-300">{{ formatDate(club.end_date) }}</dd></div>
            <div class="sm:col-span-2"><dt class="text-xs font-medium uppercase tracking-wide text-gray-400">{{ t('students.plan') }}</dt><dd class="mt-1.5 text-sm leading-6 text-gray-700 dark:text-gray-300">{{ club.plan || '—' }}</dd></div>
            <div class="sm:col-span-2"><dt class="text-xs font-medium uppercase tracking-wide text-gray-400">{{ t('students.criteria') }}</dt><dd class="mt-1.5 text-sm leading-6 text-gray-700 dark:text-gray-300">{{ club.criteria || '—' }}</dd></div>
          </dl>
        </section>

        <section class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-light-100 dark:bg-blue-light-500/10"><Clock3 class="h-4 w-4 text-blue-light-600 dark:text-blue-light-400" /></div>
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clubs.weeklySchedule') }}</h2>
          </div>
          <div class="space-y-3">
            <div v-for="slot in club.schedule" :key="slot.id" class="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
              <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ dayName(slot.weekday) }} · {{ slot.start_time }}–{{ slot.end_time }}</p>
              <p class="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><MapPin class="h-3.5 w-3.5" />{{ slot.location }}</p>
            </div>
          </div>
        </section>
      </div>

      <section class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10"><ClipboardCheck class="h-4 w-4 text-brand-500" /></div>
              <div>
                <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.personalAttendanceHistory') }}</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ t('students.personalAttendanceHint') }}</p>
              </div>
            </div>
            <ClubMonthYearPicker
              class="w-full sm:w-72"
              :model-value="selectedAttendancePeriod"
              :min-date="club.start_date"
              :max-date="club.end_date"
              :label="`${t('clubs.month')} / ${t('clubs.year')}`"
              @update:model-value="handleAttendancePeriodChange"
            />
          </div>
        </div>

        <div v-if="attendanceLoading" class="flex min-h-48 items-center justify-center">
          <Loader2 class="h-6 w-6 animate-spin text-brand-500" />
        </div>
        <div v-else-if="attendanceError" class="px-5 py-10 text-center">
          <p class="text-sm text-error-500">{{ attendanceError }}</p>
          <button type="button" class="mt-3 text-sm font-medium text-brand-500 hover:text-brand-600" @click="fetchAttendance">{{ t('clubs.tryAgain') }}</button>
        </div>
        <div v-else-if="attendanceRecords.length" class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="w-full min-w-[720px]">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('lessons.date') }}</th>
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('lessons.dayOfWeek') }}</th>
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('clubs.session') }}</th>
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('clubs.location') }}</th>
                <th class="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('common.status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in attendanceRecords" :key="record.attendance_id ?? `${record.session_id}-${record.date}`" class="border-b border-gray-100 last:border-0 dark:border-gray-800">
                <td class="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">{{ formatDate(record.date) }}</td>
                <td class="whitespace-nowrap px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{{ dayName(record.weekday) }}</td>
                <td class="whitespace-nowrap px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{{ record.start_time }}–{{ record.end_time }}</td>
                <td class="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{{ record.location }}</td>
                <td class="px-5 py-4 text-right"><span class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass(record.status)">{{ statusLabel(record.status) }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="px-5 py-14 text-center"><CircleAlert class="mx-auto h-8 w-8 text-gray-400" /><p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.noAttendanceHistory') }}</p></div>

        <div v-if="!attendanceLoading && !attendanceError && attendanceTotal" class="border-t border-gray-200 px-5 py-4 dark:border-gray-800">
          <Pagination :total="attendanceTotal" :current-page="attendancePage" :page-size="attendancePageSize" :page-sizes="[10, 20, 50]" @update:current-page="changeAttendancePage" @update:page-size="changeAttendancePageSize" />
        </div>
      </section>
      </template>

      <div v-else class="rounded-xl border border-error-200 bg-error-50 px-5 py-12 text-center dark:border-error-500/20 dark:bg-error-500/10">
        <CircleAlert class="mx-auto h-8 w-8 text-error-500" />
        <p class="mt-3 text-sm text-error-600 dark:text-error-400">{{ pageError || t('clubs.detailLoadError') }}</p>
        <button type="button" class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600" @click="loadPage">{{ t('clubs.tryAgain') }}</button>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CalendarDays, CircleAlert, ClipboardCheck, Clock3, Loader2, MapPin, Puzzle } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ClubMonthYearPicker from '@/components/clubs/ClubMonthYearPicker.vue'
import ClubStatusBadge from '@/components/clubs/ClubStatusBadge.vue'
import Pagination from '@/components/ui/Pagination.vue'
import {
  getStudentClubApi,
  getStudentClubAttendanceApi,
  type ClubAttendanceStatus,
  type ClubWeekday,
  type StudentClubAttendanceRecord,
  type StudentClubDetail,
} from '@/api/clubs'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const studentId = Number(route.params.studentId)
const clubId = Number(route.params.clubId)

const club = ref<StudentClubDetail | null>(null)
const pageLoading = ref(true)
const pageError = ref('')
const attendanceRecords = ref<StudentClubAttendanceRecord[]>([])
const attendanceTotal = ref(0)
const attendanceLoading = ref(false)
const attendanceError = ref('')
const attendancePage = ref(1)
const attendancePageSize = ref(10)
const selectedAttendancePeriod = ref('')
let attendanceRequestSequence = 0

const attendanceRate = computed(() => {
  if (!club.value?.total_session_count) return 0
  return Math.round(((club.value.present_count + club.value.late_count) / club.value.total_session_count) * 100)
})

const attendanceDateRange = computed(() => {
  if (!club.value || !selectedAttendancePeriod.value) return { dateFrom: '', dateTo: '' }

  const [year, month] = selectedAttendancePeriod.value.split('-').map(Number)
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEnd = monthLastDate(year, month)

  return {
    dateFrom: monthStart < club.value.start_date ? club.value.start_date : monthStart,
    dateTo: monthEnd > club.value.end_date ? club.value.end_date : monthEnd,
  }
})

onMounted(loadPage)

async function loadPage() {
  pageLoading.value = true
  pageError.value = ''
  attendanceRecords.value = []
  attendanceTotal.value = 0

  try {
    const { data } = await getStudentClubApi(studentId, clubId)
    club.value = data
    selectedAttendancePeriod.value = initialAttendancePeriod(data)
    attendancePage.value = 1
    pageLoading.value = false
    await fetchAttendance()
  } catch {
    club.value = null
    pageError.value = t('clubs.detailLoadError')
  } finally {
    pageLoading.value = false
  }
}

async function fetchAttendance() {
  if (!club.value || !selectedAttendancePeriod.value) return

  const requestId = ++attendanceRequestSequence
  const { dateFrom, dateTo } = attendanceDateRange.value
  attendanceLoading.value = true
  attendanceError.value = ''

  try {
    const { data } = await getStudentClubAttendanceApi(studentId, clubId, {
      date_from: dateFrom,
      date_to: dateTo,
      page: attendancePage.value,
      page_size: attendancePageSize.value,
    })
    if (requestId !== attendanceRequestSequence) return

    attendanceRecords.value = data.results
    attendanceTotal.value = data.count
  } catch {
    if (requestId !== attendanceRequestSequence) return

    attendanceRecords.value = []
    attendanceTotal.value = 0
    attendanceError.value = t('clubs.attendanceHistoryLoadError')
  } finally {
    if (requestId === attendanceRequestSequence) attendanceLoading.value = false
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/students')
}

async function changeAttendancePage(page: number) {
  attendancePage.value = page
  await fetchAttendance()
}

async function changeAttendancePageSize(pageSize: number) {
  attendancePageSize.value = pageSize
  attendancePage.value = 1
  await fetchAttendance()
}

async function handleAttendancePeriodChange(period: string) {
  selectedAttendancePeriod.value = period
  attendancePage.value = 1
  await fetchAttendance()
}

function initialAttendancePeriod(currentClub: StudentClubDetail): string {
  const today = formatLocalDate(new Date())
  const boundedDate = today < currentClub.start_date
    ? currentClub.start_date
    : today > currentClub.end_date
      ? currentClub.end_date
      : today
  return boundedDate.slice(0, 7)
}

function monthLastDate(year: number, month: number): string {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(locale.value === 'kz' ? 'kk' : locale.value, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

function dayName(day: ClubWeekday): string {
  return t(`lessons.days.${day}`)
}

function statusLabel(status: ClubAttendanceStatus | null): string {
  return status ? t(`clubs.${status}`) : t('clubs.unmarked')
}

function statusClass(status: ClubAttendanceStatus | null): string {
  if (status === 'present') return 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'
  if (status === 'late') return 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
  if (status === 'absent') return 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400'
  return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
}
</script>
