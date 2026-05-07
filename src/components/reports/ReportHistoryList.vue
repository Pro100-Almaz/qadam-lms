<template>
  <div>
    <div v-if="loading" class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="reports.length === 0" class="flex flex-col items-center py-10 text-gray-400">
      <FileText class="mb-2 h-8 w-8" />
      <p class="text-sm">{{ t('reports.noReports') }}</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="report in reports"
        :key="report.id"
        class="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 text-sm transition-colors dark:border-gray-800"
        :class="report.status === 'completed'
          ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
          : 'opacity-60'"
        @click="report.status === 'completed' ? viewReport(report.id) : undefined"
      >
        <div class="flex items-center gap-3">
          <span
            class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
            :class="statusClass(report.status)"
          >
            <CheckCircle2 v-if="report.status === 'completed'" class="h-3.5 w-3.5" />
            <Loader2 v-else-if="report.status === 'pending' || report.status === 'generating'" class="h-3.5 w-3.5 animate-spin" />
            <XCircle v-else class="h-3.5 w-3.5" />
          </span>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900 dark:text-white">Q{{ report.quarter }}</span>
              <span class="rounded bg-gray-100 px-1.5 py-0.5 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">{{ report.language }}</span>
            </div>
            <p class="text-xs text-gray-400">
              {{ formatDate(report.created_at) }}
              <span v-if="report.generated_by_name"> · {{ report.generated_by_name }}</span>
            </p>
          </div>
        </div>
        <ChevronRight v-if="report.status === 'completed'" class="h-4 w-4 text-gray-400" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { FileText, ChevronRight, CheckCircle2, Loader2, XCircle } from 'lucide-vue-next'
import { getStudentReportsApi } from '@/api/reports'
import type { StudentReportListItem, ReportStatus } from '@/types/report'

const props = defineProps<{ studentId: number }>()

const { t } = useI18n()
const router = useRouter()

const reports = ref<StudentReportListItem[]>([])
const loading = ref(true)

function statusClass(status: ReportStatus): string {
  if (status === 'completed') return 'bg-success-100 text-success-600 dark:bg-success-500/10 dark:text-success-400'
  if (status === 'failed') return 'bg-error-100 text-error-600 dark:bg-error-500/10 dark:text-error-400'
  return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

function viewReport(id: number) {
  router.push(`/reports/${id}`)
}

async function fetchReports() {
  loading.value = true
  try {
    reports.value = await getStudentReportsApi(props.studentId)
  } catch {
    reports.value = []
  } finally {
    loading.value = false
  }
}

defineExpose({ refresh: fetchReports })

onMounted(fetchReports)
</script>
