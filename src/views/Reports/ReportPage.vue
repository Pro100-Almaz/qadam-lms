<template>
  <AdminLayout>
    <div class="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="rounded-xl border border-error-200 bg-error-50 p-6 text-center dark:border-error-800 dark:bg-error-900/20">
        <p class="text-error-700 dark:text-error-400">{{ error }}</p>
        <button
          class="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600"
          @click="fetchReport"
        >
          {{ t('reports.retry') }}
        </button>
      </div>

      <!-- Report -->
      <template v-else-if="report?.report_data">
        <!-- Action bar -->
        <div class="flex items-center justify-between no-print">
          <button
            @click="router.back()"
            class="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft class="h-4 w-4" />
            {{ t('common.back') }}
          </button>

          <button
            @click="downloadPdf"
            :disabled="downloadingPdf"
            class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            <Loader2 v-if="downloadingPdf" class="h-4 w-4 animate-spin" />
            <Download v-else class="h-4 w-4" />
            {{ t('reports.downloadPdf') }}
          </button>
        </div>

        <ReportView
          :report-data="report.report_data"
          :student-name="report.student_name"
          :class-group="report.class_group"
          :academic-year="report.academic_year_label"
          :quarter-label="`Q${report.quarter}`"
          :generated-by="report.generated_by_name ?? undefined"
          :generated-at="formatDateTime(report.created_at)"
        />

        <div class="flex items-center gap-4 text-xs text-gray-400 no-print">
          <span v-if="report.generation_time_ms">
            Generated in {{ (report.generation_time_ms / 1000).toFixed(1) }}s
          </span>
          <span v-if="report.tokens_used">
            {{ report.tokens_used.toLocaleString() }} tokens
          </span>
        </div>
      </template>

      <!-- Pending/Generating -->
      <div v-else-if="report && (report.status === 'pending' || report.status === 'generating')" class="flex flex-col items-center py-20">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">{{ t('reports.generating') }}</p>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Download, Loader2 } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ReportView from '@/components/reports/ReportView.vue'
import { getReportApi, downloadReportPdfApi } from '@/api/reports'
import type { StudentReport } from '@/types/report'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const report = ref<StudentReport | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const downloadingPdf = ref(false)

const reportId = computed(() => Number(route.params.id))

let pollTimer: ReturnType<typeof setInterval> | null = null

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString()
}

async function downloadPdf() {
  if (!report.value) return
  downloadingPdf.value = true
  try {
    const blob = await downloadReportPdfApi(reportId.value)
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `Report_${report.value.student_name}_Q${report.value.quarter}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    /* handled by global interceptor */
  } finally {
    downloadingPdf.value = false
  }
}

async function fetchReport() {
  isLoading.value = true
  error.value = null
  try {
    report.value = await getReportApi(reportId.value)
    if (report.value.status === 'failed') {
      error.value = report.value.error_message || t('reports.failed')
    } else if (report.value.status === 'pending' || report.value.status === 'generating') {
      startPolling()
    }
  } catch {
    error.value = t('reports.failed')
  } finally {
    isLoading.value = false
  }
}

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    try {
      report.value = await getReportApi(reportId.value)
      if (report.value.status === 'completed' || report.value.status === 'failed') {
        if (pollTimer) clearInterval(pollTimer)
        pollTimer = null
        if (report.value.status === 'failed') {
          error.value = report.value.error_message || t('reports.failed')
        }
      }
    } catch { /* keep polling */ }
  }, 3000)
}

onMounted(fetchReport)
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
