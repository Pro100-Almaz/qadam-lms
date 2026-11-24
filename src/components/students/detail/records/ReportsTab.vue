<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">{{ t('reports.aiReports') }}</h2>
      <button
        v-if="canGenerate"
        type="button"
        class="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-theme-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        @click="showModal = true"
      >
        <Sparkles class="h-4 w-4" aria-hidden="true" />
        {{ t('reports.generate') }}
      </button>
    </div>

    <StatePanel v-if="error" :loading="false" :error="error" @retry="fetchPage" />

    <div v-else class="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="w-full min-w-[640px] text-left">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th scope="col" class="px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('studentDetail.reports.colDate') }}</th>
              <th scope="col" class="px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('reports.quarter') }}</th>
              <th scope="col" class="px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('reports.reportLanguage') }}</th>
              <th scope="col" class="px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('common.status') }}</th>
              <th scope="col" class="px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('reports.generatedBy') }}</th>
              <th scope="col" class="px-4 py-3 text-right"><span class="sr-only">{{ t('common.actions') }}</span></th>
            </tr>
          </thead>
          <tbody v-if="loading" aria-busy="true">
            <tr v-for="n in 5" :key="n" class="border-b border-gray-100 last:border-0 dark:border-gray-800">
              <td v-for="c in 6" :key="c" class="px-4 py-3"><div class="h-4 animate-pulse rounded bg-gray-100 dark:bg-white/5"></div></td>
            </tr>
          </tbody>
          <tbody v-else-if="rows.length > 0">
            <tr v-for="report in rows" :key="report.id" class="border-b border-gray-100 last:border-0 dark:border-gray-800">
              <td class="whitespace-nowrap px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">{{ formatDate(report.created_at) }}</td>
              <td class="px-4 py-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">{{ t('studentDetail.common.quarterShort', { n: report.quarter }) }}</td>
              <td class="px-4 py-3 text-theme-sm uppercase text-gray-700 dark:text-gray-300">{{ report.language }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-theme-xs font-medium" :class="statusClass(report.status)">
                  <CheckCircle2 v-if="report.status === 'completed'" class="h-3.5 w-3.5" aria-hidden="true" />
                  <Loader2 v-else-if="report.status === 'pending' || report.status === 'generating'" class="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  <XCircle v-else class="h-3.5 w-3.5" aria-hidden="true" />
                  {{ t(`studentDetail.reports.status.${report.status}`) }}
                </span>
              </td>
              <td class="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">{{ report.generated_by_name || '—' }}</td>
              <td class="px-4 py-3 text-right">
                <router-link
                  v-if="report.status === 'completed'"
                  :to="`/reports/${report.id}`"
                  class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-theme-sm font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-brand-400 dark:hover:bg-brand-500/10"
                >
                  {{ t('studentDetail.reports.open') }}
                  <ChevronRight class="h-4 w-4" aria-hidden="true" />
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!loading && rows.length === 0" class="flex flex-col items-center px-4 py-10 text-center">
        <FileText class="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" aria-hidden="true" />
        <p class="text-theme-sm text-gray-500 dark:text-gray-400">{{ canGenerate ? t('studentDetail.reports.emptyCanGenerate') : t('studentDetail.reports.empty') }}</p>
      </div>
      <Pagination v-if="total > 0" v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" />
    </div>

    <GenerateReportModal
      v-if="showModal"
      :student-id="studentPk"
      :student-name="studentName"
      :class-group="classGroup"
      @close="showModal = false"
      @generated="onGenerated"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CheckCircle2, ChevronRight, FileText, Loader2, Sparkles, XCircle } from 'lucide-vue-next'
import Pagination from '@/components/ui/Pagination.vue'
import StatePanel from '@/components/analytics/StatePanel.vue'
import GenerateReportModal from '@/components/reports/GenerateReportModal.vue'
import { getStudentReportsPageApi } from '@/api/reports'
import type { ReportStatus, StudentReportListItem } from '@/types/report'
import { currentIntlLocale } from '@/i18n'

// studentPk is the student profile pk: that is what both the reports list
// endpoint and GenerateReportModal expect (same as ReportHistoryList today).
const props = defineProps<{
  studentPk: number
  canGenerate: boolean
  /** One-shot: opens the generate modal when it turns true. */
  openGenerate?: boolean
  studentName: string
  classGroup: string
}>()

const emit = defineEmits<{ (e: 'generate-opened'): void }>()

const { t } = useI18n()

const rows = ref<StudentReportListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(true)
const error = ref('')
const showModal = ref(false)
let requestId = 0

function statusClass(status: ReportStatus): string {
  if (status === 'completed') return 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'
  if (status === 'failed') return 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400'
  return 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300'
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(currentIntlLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

async function fetchPage() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const res = await getStudentReportsPageApi(props.studentPk, { page: page.value, page_size: pageSize.value })
    if (id !== requestId) return
    rows.value = res.results
    total.value = res.count
  } catch {
    if (id !== requestId) return
    error.value = t('common.serverError')
  } finally {
    if (id === requestId) loading.value = false
  }
}

function onGenerated() {
  showModal.value = false
  if (page.value === 1) fetchPage()
  else page.value = 1
}

watch([page, pageSize], fetchPage)
watch(() => props.studentPk, () => {
  page.value = 1
  fetchPage()
})
onMounted(fetchPage)
watch(
  () => props.openGenerate,
  (open) => {
    if (!open) return
    if (props.canGenerate) showModal.value = true
    emit('generate-opened')
  },
  { immediate: true },
)
</script>
