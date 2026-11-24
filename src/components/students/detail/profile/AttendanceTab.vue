<template>
  <div class="space-y-6">
    <section>
      <StatePanel :loading="summaryLoading" :error="summaryError" @retry="loadSummary" />
      <AttendanceSummaryPanel v-if="!summaryLoading && !summaryError && summary" :data="summary" />
    </section>

    <section class="space-y-3">
      <h2 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">
        {{ t('studentDetail.attendance.absencesTitle') }}
      </h2>
      <p class="text-theme-xs text-gray-500 dark:text-gray-400">
        {{ t('studentDetail.attendance.absencesNote') }}
      </p>

      <div v-if="recordsLoading" class="space-y-2" role="status" :aria-label="t('common.loading')">
        <div v-for="i in 4" :key="i" class="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-white/5"></div>
      </div>

      <div
        v-else-if="recordsError"
        class="rounded-xl border border-error-200 bg-error-50 px-6 py-8 text-center dark:border-error-500/20 dark:bg-error-500/10"
      >
        <p class="text-theme-sm text-error-600 dark:text-error-400">{{ recordsError }}</p>
        <button
          type="button"
          class="mt-3 rounded-lg bg-error-500 px-4 py-2 text-theme-sm font-medium text-white transition hover:bg-error-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-500"
          @click="loadRecords"
        >
          {{ t('assignments.tryAgain') }}
        </button>
      </div>

      <p
        v-else-if="!records.length"
        class="rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center text-theme-sm text-gray-500 dark:border-gray-800 dark:text-gray-400"
      >
        {{ t('studentDetail.attendance.noAbsences') }}
      </p>

      <div v-else class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="w-full min-w-[420px]">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th scope="col" class="px-4 py-2.5 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ t('studentDetail.attendance.date') }}
                </th>
                <th scope="col" class="px-4 py-2.5 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ t('statistics.subject') }}
                </th>
                <th scope="col" class="px-4 py-2.5 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ t('studentDetail.attendance.status') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in records"
                :key="row.id"
                class="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                <td class="px-4 py-2.5 text-theme-sm tabular-nums text-gray-800 dark:text-white/90">{{ row.date }}</td>
                <td class="px-4 py-2.5 text-theme-sm text-gray-600 dark:text-gray-400">{{ row.subject_name }}</td>
                <td class="px-4 py-2.5">
                  <span class="inline-flex rounded-full bg-error-50 px-2.5 py-0.5 text-theme-xs font-medium text-error-700 dark:bg-error-500/10 dark:text-error-400">
                    {{ t('statistics.absent') }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination
          :total="total"
          :current-page="page"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          @update:currentPage="onPage"
          @update:pageSize="onPageSize"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import StatePanel from '@/components/analytics/StatePanel.vue'
import AttendanceSummaryPanel from '@/components/analytics/AttendanceSummaryPanel.vue'
import Pagination from '@/components/ui/Pagination.vue'
import {
  getAttendanceSummaryApi,
  readAnalyticsError,
  type AttendanceSummaryResponse,
} from '@/api/analytics'
import { getStudentAttendanceApi, type AttendanceRecord } from '@/api/attendance'

/**
 * Attendance for one quarter: the summary (rate, vs class, weekday, month,
 * subject) and the individual absences.
 *
 * Both endpoints take the student profile pk (not the user id).
 *
 * The register has only `present` and `absent` (no `late`), so the table lists
 * absences only, paged on the server (newest first).
 */
const props = defineProps<{
  /** Student profile pk: both the analytics summary and the register records. */
  studentPk: number
  quarter: number
}>()

const { t } = useI18n()

// A counter per request kind: only the latest response may write state.
let summarySeq = 0
let recordsSeq = 0

const summary = ref<AttendanceSummaryResponse | null>(null)
const summaryLoading = ref(false)
const summaryError = ref('')

async function loadSummary() {
  const seq = ++summarySeq
  summaryLoading.value = true
  summaryError.value = ''
  try {
    const { data } = await getAttendanceSummaryApi(props.studentPk, { quarter: props.quarter })
    if (seq === summarySeq) summary.value = data
  } catch (error) {
    if (seq !== summarySeq) return
    summary.value = null
    summaryError.value = readAnalyticsError(error) || t('statistics.loadError')
  } finally {
    if (seq === summarySeq) summaryLoading.value = false
  }
}

const records = ref<AttendanceRecord[]>([])
const total = ref(0)
const recordsLoading = ref(false)
const recordsError = ref('')
const page = ref(1)
const pageSize = ref(10)

async function loadRecords() {
  const seq = ++recordsSeq
  recordsLoading.value = true
  recordsError.value = ''
  try {
    const data = await getStudentAttendanceApi(props.studentPk, {
      quarter: props.quarter,
      status: 'absent',
      page: page.value,
      page_size: pageSize.value,
    })
    if (seq !== recordsSeq) return
    records.value = data.results
    total.value = data.count
  } catch {
    if (seq !== recordsSeq) return
    records.value = []
    total.value = 0
    recordsError.value = t('studentDetail.attendance.loadError')
  } finally {
    if (seq === recordsSeq) recordsLoading.value = false
  }
}

function onPage(next: number) {
  page.value = next
  void loadRecords()
}

function onPageSize(size: number) {
  pageSize.value = size
  page.value = 1
  void loadRecords()
}

watch(() => [props.studentPk, props.quarter] as const, loadSummary, { immediate: true })
watch(
  () => [props.studentPk, props.quarter] as const,
  () => {
    page.value = 1
    void loadRecords()
  },
  { immediate: true },
)
</script>
