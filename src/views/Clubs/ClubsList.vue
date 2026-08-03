<template>
  <AdminLayout>
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">{{ t('clubs.title') }}</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.subtitle') }}</p>
        </div>
        <router-link to="/clubs/create" class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600">
          <Plus class="h-4 w-4" /> {{ t('clubs.create') }}
        </router-link>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div class="flex items-center justify-between"><p class="text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.totalClubs') }}</p><div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10"><Puzzle class="h-4 w-4 text-brand-500" /></div></div>
          <p class="mt-3 text-2xl font-semibold text-gray-800 dark:text-white/90">{{ total }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div class="flex items-center justify-between"><p class="text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.registeredStudents') }}</p><div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-light-100 dark:bg-blue-light-500/10"><Users class="h-4 w-4 text-blue-light-600 dark:text-blue-light-400" /></div></div>
          <p class="mt-3 text-2xl font-semibold text-gray-800 dark:text-white/90">{{ registeredStudents }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div class="flex items-center justify-between"><p class="text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.weeklySessions') }}</p><div class="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50 dark:bg-success-500/10"><CalendarClock class="h-4 w-4 text-success-600 dark:text-success-400" /></div></div>
          <p class="mt-3 text-2xl font-semibold text-gray-800 dark:text-white/90">{{ weeklySessions }}</p>
        </div>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="relative w-full sm:max-w-sm">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input v-model="searchQuery" type="search" :placeholder="t('clubs.searchPlaceholder')" class="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
        </div>
        <ClubAcademicYearSelect
          v-model="selectedYear"
          :years="academicYears"
          :all-label="t('clubs.allYears')"
          :aria-label="t('academicYears.title')"
        />
      </div>

      <div v-if="loading" class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div v-for="index in 4" :key="index" class="h-72 animate-pulse rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><div class="h-11 w-11 rounded-xl bg-gray-100 dark:bg-gray-800"></div><div class="mt-4 h-4 w-1/2 rounded bg-gray-100 dark:bg-gray-800"></div><div class="mt-3 h-3 w-full rounded bg-gray-100 dark:bg-gray-800"></div></div>
      </div>

      <div v-else-if="loadError" class="rounded-xl border border-error-200 bg-error-50 px-6 py-10 text-center dark:border-error-500/20 dark:bg-error-500/10">
        <CircleAlert class="mx-auto h-8 w-8 text-error-500" />
        <p class="mt-3 text-sm text-error-600 dark:text-error-400">{{ t('clubs.loadError') }}</p>
        <button type="button" @click="fetchClubs" class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600">{{ t('clubs.tryAgain') }}</button>
      </div>

      <div v-else-if="clubs.length" class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <article v-for="club in clubs" :key="club.id" role="link" tabindex="0" class="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs transition hover:border-brand-300 hover:shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/40" @click="viewClub(club)" @keydown.enter="viewClub(club)">
          <div class="flex items-start justify-between gap-4">
            <div class="flex min-w-0 items-start gap-3">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10"><Puzzle class="h-5 w-5 text-brand-500" /></div>
              <div class="min-w-0"><h2 class="truncate text-base font-semibold text-gray-800 dark:text-white/90">{{ club.club_name }}</h2><p class="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><CalendarDays class="h-3.5 w-3.5" />{{ club.academic_year.year }} · {{ formatDateRange(club.start_date, club.end_date) }}</p></div>
            </div>
            <ClubStatusBadge :status="club.status" />
          </div>

          <p class="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-gray-600 dark:text-gray-400">{{ club.plan || '—' }}</p>

          <div v-if="club.schedule.length" class="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
            <p class="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300"><CalendarClock class="h-3.5 w-3.5 text-brand-500" />{{ t('clubs.weeklySchedule') }}</p>
            <div class="flex flex-wrap gap-2">
              <span v-for="slot in club.schedule.slice(0, 3)" :key="slot.id" class="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"><span class="font-medium">{{ dayName(slot.weekday) }}</span>{{ formatTime(slot.start_time) }}–{{ formatTime(slot.end_time) }}<span v-if="slot.location" class="text-gray-400">· {{ slot.location }}</span></span>
              <span v-if="club.schedule.length > 3" class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-brand-500">{{ t('clubs.moreSessions', { count: club.schedule.length - 3 }) }}</span>
            </div>
          </div>

          <div class="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400"><span class="inline-flex items-center gap-1.5"><Users class="h-4 w-4" />{{ club.member_count }} {{ t('clubs.members').toLowerCase() }}</span><span class="inline-flex items-center gap-1.5"><ClipboardCheck class="h-4 w-4" />{{ club.attendance_dates_count }} {{ t('clubs.attendanceDates').toLowerCase() }}</span></div>
            <ChevronRight class="h-5 w-5 text-gray-400" />
          </div>
        </article>
      </div>

      <div v-else class="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900"><SearchX class="mx-auto h-8 w-8 text-gray-400" /><p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.noResults') }}</p></div>

      <Pagination v-if="!loading && !loadError && total > 0" :total="total" v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[20, 50, 100]" />
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { CalendarClock, CalendarDays, ChevronRight, CircleAlert, ClipboardCheck, Plus, Puzzle, Search, SearchX, Users } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ClubAcademicYearSelect from '@/components/clubs/ClubAcademicYearSelect.vue'
import ClubStatusBadge from '@/components/clubs/ClubStatusBadge.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { getClubsApi, type ClubAcademicYear, type ClubListItem, type ClubWeekday } from '@/api/clubs'
import { useDebounce } from '@/composables/useDebounce'

const { t } = useI18n()
const router = useRouter()
const clubs = ref<ClubListItem[]>([])
const total = ref(0)
const loading = ref(true)
const loadError = ref(false)
const searchQuery = ref('')
const debouncedSearch = useDebounce(searchQuery, 350)
const selectedYear = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const academicYears = computed<ClubAcademicYear[]>(() => {
  const years = new Map<number, ClubAcademicYear>()
  clubs.value.forEach(club => years.set(club.academic_year.id, club.academic_year))
  return [...years.values()]
})
const registeredStudents = computed(() => clubs.value.reduce((sum, club) => sum + club.member_count, 0))
const weeklySessions = computed(() => clubs.value.reduce((sum, club) => sum + club.sessions_per_week, 0))

async function fetchClubs() {
  loading.value = true
  loadError.value = false
  try {
    const { data } = await getClubsApi({
      search: debouncedSearch.value || undefined,
      academic_year: selectedYear.value ? Number(selectedYear.value) : undefined,
      page: currentPage.value,
      page_size: pageSize.value,
    })
    clubs.value = data.results
    total.value = data.count
  } catch {
    clubs.value = []
    total.value = 0
    loadError.value = true
  } finally {
    loading.value = false
  }
}

watch([debouncedSearch, selectedYear, pageSize], () => {
  if (currentPage.value === 1) fetchClubs()
  else currentPage.value = 1
})
watch(currentPage, fetchClubs)
onMounted(fetchClubs)

function formatDateRange(startDate: string, endDate: string): string {
  const locale = document.documentElement.lang || 'ru'
  const format = (value: string) => new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
  return `${format(startDate)} – ${format(endDate)}`
}

function formatTime(value: string): string {
  return value.slice(0, 5)
}

function dayName(day: ClubWeekday): string {
  return t(`lessons.days.${day}`)
}

function viewClub(club: ClubListItem) {
  router.push(`/clubs/${club.id}`)
}
</script>
