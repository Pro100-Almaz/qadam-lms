<template>
  <div class="space-y-5">
    <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.clubs') }}</h2>

    <div v-if="loading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="clubs.length" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="club in clubs"
        :key="club.id"
        role="link"
        tabindex="0"
        class="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs transition hover:border-brand-300 hover:shadow-theme-sm focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/40"
        @click="openClub(club)"
        @keydown.enter="openClub(club)"
        @keydown.space.prevent="openClub(club)"
      >
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ club.club_name }}</h3>
          <span class="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {{ club.academic_year }}
          </span>
        </div>

        <div class="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <CalendarDays class="h-3.5 w-3.5 shrink-0" />
          <span>{{ formatDate(club.start_date) }} – {{ formatDate(club.end_date) }}</span>
        </div>

        <dl class="mt-4 grid grid-cols-2 gap-2">
          <div class="min-w-0 rounded-lg bg-gray-50 px-2.5 py-2 dark:bg-gray-800/60">
            <dt class="break-words text-[11px] leading-4 text-gray-500 dark:text-gray-400">{{ t('students.totalSessions') }}</dt>
            <dd class="mt-0.5 text-sm font-semibold text-gray-800 dark:text-white/90">{{ club.total_session_count }}</dd>
          </div>
          <div class="min-w-0 rounded-lg bg-success-50 px-2.5 py-2 dark:bg-success-500/10">
            <dt class="break-words text-[11px] leading-4 text-success-700 dark:text-success-400">{{ t('clubs.present') }}</dt>
            <dd class="mt-0.5 text-sm font-semibold text-success-700 dark:text-success-400">{{ club.present_count }}</dd>
          </div>
          <div class="min-w-0 rounded-lg bg-warning-50 px-2.5 py-2 dark:bg-warning-500/10">
            <dt class="break-words text-[11px] leading-4 text-warning-700 dark:text-warning-400">{{ t('clubs.late') }}</dt>
            <dd class="mt-0.5 text-sm font-semibold text-warning-700 dark:text-warning-400">{{ club.late_count }}</dd>
          </div>
          <div class="min-w-0 rounded-lg bg-error-50 px-2.5 py-2 dark:bg-error-500/10">
            <dt class="break-words text-[11px] leading-4 text-error-700 dark:text-error-400">{{ t('clubs.absent') }}</dt>
            <dd class="mt-0.5 text-sm font-semibold text-error-700 dark:text-error-400">{{ club.absent_count }}</dd>
          </div>
        </dl>

        <div class="mt-3">
          <div class="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{{ t('students.attendance') }}</span>
            <span>{{ markedSessionCount(club) }}/{{ club.total_session_count }}</span>
          </div>
          <div class="flex h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div class="bg-success-500" :style="{ width: attendanceWidth(club.present_count, club) }"></div>
            <div class="bg-warning-500" :style="{ width: attendanceWidth(club.late_count, club) }"></div>
            <div class="bg-error-500" :style="{ width: attendanceWidth(club.absent_count, club) }"></div>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 dark:border-gray-800">
      <Puzzle class="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
      <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('students.noClubEntries') }}</p>
    </div>

    <Pagination
      v-if="!loading && total > 0"
      :total="total"
      :current-page="page"
      :page-size="pageSize"
      :page-sizes="[6, 12, 24]"
      @update:current-page="changePage"
      @update:page-size="changePageSize"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { CalendarDays, Puzzle } from 'lucide-vue-next'
import Pagination from '@/components/ui/Pagination.vue'
import { getStudentClubsApi, type StudentClub } from '@/api/clubs'

const props = defineProps<{
  studentId: number
}>()

const { t, locale } = useI18n()
const router = useRouter()
const clubs = ref<StudentClub[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(6)
const loading = ref(false)
let requestSequence = 0

function openClub(club: StudentClub) {
  router.push({
    name: 'StudentClubDetail',
    params: { studentId: props.studentId, clubId: club.id },
  })
}

async function fetchClubs() {
  if (!props.studentId) return
  const requestId = ++requestSequence
  loading.value = true
  try {
    const { data } = await getStudentClubsApi(props.studentId, {
      page: page.value,
      page_size: pageSize.value,
    })
    if (requestId !== requestSequence) return
    clubs.value = data.results
    total.value = data.count
  } catch {
    if (requestId !== requestSequence) return
    clubs.value = []
    total.value = 0
  } finally {
    if (requestId === requestSequence) loading.value = false
  }
}

function changePage(nextPage: number) {
  page.value = nextPage
  fetchClubs()
}

function changePageSize(nextPageSize: number) {
  page.value = 1
  pageSize.value = nextPageSize
  fetchClubs()
}

function markedSessionCount(club: StudentClub): number {
  return club.present_count + club.late_count + club.absent_count
}

function attendanceWidth(count: number, club: StudentClub): string {
  return club.total_session_count ? `${(count / club.total_session_count) * 100}%` : '0%'
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(locale.value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

watch(
  () => props.studentId,
  () => {
    page.value = 1
    fetchClubs()
  },
  { immediate: true },
)
</script>
