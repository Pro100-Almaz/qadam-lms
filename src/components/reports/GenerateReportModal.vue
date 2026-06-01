<template>
  <Modal :fullScreenBackdrop="true" @close="emit('close')">
    <template #body>
      <div class="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md dark:border-gray-800 dark:bg-gray-900">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('reports.generate') }}</h3>
          <button @click="emit('close')" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Student info -->
        <div class="mb-5 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ studentName }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ classGroup }}</p>
        </div>

        <!-- Generation form -->
        <div v-if="!isGenerating" class="space-y-4">
          <!-- Quarter -->
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {{ t('reports.quarter') }} <span class="text-red-500">*</span>
            </label>
            <select
              v-model="selectedQuarter"
              class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option v-for="q in 4" :key="q" :value="q">Q{{ q }}</option>
            </select>
          </div>

          <!-- Language -->
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {{ t('reports.reportLanguage') }}
            </label>
            <div class="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
              <button
                v-for="lang in languages"
                :key="lang.value"
                @click="selectedLanguage = lang.value"
                class="flex-1 px-3 py-2 text-sm font-medium transition-colors"
                :class="selectedLanguage === lang.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'"
              >
                {{ lang.label }}
              </button>
            </div>
          </div>

          <!-- Info -->
          <div class="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-900/10 dark:text-blue-400">
            <Info class="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{{ t('reports.estimatedTime') }}</span>
          </div>

          <!-- Rate limit warning -->
          <div v-if="isRateLimited" class="flex items-start gap-2 rounded-lg bg-warning-50 p-3 text-xs text-warning-700 dark:bg-warning-900/10 dark:text-warning-400">
            <AlertCircle class="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{{ t('reports.rateLimited') }} ({{ retryAfter }}s)</span>
          </div>

          <!-- Error -->
          <div v-if="error" class="flex items-start gap-2 rounded-lg bg-error-50 p-3 text-xs text-error-700 dark:bg-error-900/10 dark:text-error-400">
            <AlertCircle class="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{{ error }}</span>
          </div>
        </div>

        <!-- Generating state -->
        <div v-else class="space-y-4 py-4">
          <div class="flex justify-center">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
          <div class="space-y-2 text-center">
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ t('reports.generating') }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ loadingText }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-6 flex gap-3">
          <button
            @click="emit('close')"
            class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            @click="handleGenerate"
            :disabled="isGenerating || isRateLimited"
            class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            <Sparkles v-if="!isGenerating" class="h-4 w-4" />
            <Loader2 v-else class="h-4 w-4 animate-spin" />
            {{ isRateLimited ? `${t('reports.generate')} (${retryAfter}s)` : t('reports.generate') }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Sparkles, Loader2, Info, AlertCircle } from 'lucide-vue-next'
import Modal from '@/components/ui/Modal.vue'
import { generateReportApi, getReportApi } from '@/api/reports'
import type { StudentReport, ReportLanguage } from '@/types/report'

const props = defineProps<{
  studentId: number
  studentName: string
  classGroup: string
  currentQuarter: number
}>()

const emit = defineEmits<{
  close: []
  generated: [report: StudentReport]
}>()

const { t, locale } = useI18n()

const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 40

const languages = [
  { value: 'ru' as ReportLanguage, label: 'Русский' },
  { value: 'kz' as ReportLanguage, label: 'Қазақша' },
  { value: 'en' as ReportLanguage, label: 'English' },
]

const localeToLang: Record<string, ReportLanguage> = { ru: 'ru', kz: 'kz', en: 'en' }
const selectedLanguage = ref<ReportLanguage>(localeToLang[locale.value] ?? 'ru')
const selectedQuarter = ref(props.currentQuarter || 1)
const isGenerating = ref(false)
const error = ref<string | null>(null)
const loadingText = ref('')
const retryAfter = ref(0)
const isRateLimited = computed(() => retryAfter.value > 0)

let countdownInterval: ReturnType<typeof setInterval> | null = null
let loadingStepTimeout: ReturnType<typeof setTimeout> | null = null
let pollAborted = false

const loadingSteps = [
  { text: () => t('reports.collectingData'), delay: 0 },
  { text: () => t('reports.analyzingGrades'), delay: 3000 },
  { text: () => t('reports.buildingRecommendations'), delay: 9000 },
  { text: () => t('reports.finalizingReport'), delay: 15000 },
]

function startLoadingSteps() {
  loadingSteps.forEach((step) => {
    loadingStepTimeout = setTimeout(() => {
      if (isGenerating.value) loadingText.value = step.text()
    }, step.delay)
  })
}

function startCountdown(seconds: number) {
  retryAfter.value = seconds
  countdownInterval = setInterval(() => {
    retryAfter.value--
    if (retryAfter.value <= 0 && countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }, 1000)
}

async function pollUntilDone(reportId: number): Promise<StudentReport> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    if (pollAborted) throw new Error('Aborted')
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    const report = await getReportApi(reportId)
    if (report.status === 'completed') return report
    if (report.status === 'failed') throw new Error(report.error_message || t('reports.failed'))
  }
  throw new Error(t('reports.timedOut'))
}

async function handleGenerate() {
  isGenerating.value = true
  error.value = null
  pollAborted = false
  startLoadingSteps()

  try {
    const initial = await generateReportApi(props.studentId, {
      language: selectedLanguage.value,
      quarter: selectedQuarter.value,
    })

    if (initial.status === 'completed') {
      emit('generated', initial)
      return
    }

    const completed = await pollUntilDone(initial.id)
    emit('generated', completed)
  } catch (err: any) {
    if (err.response?.status === 429) {
      const retry = parseInt(err.response.headers['retry-after'] ?? '60', 10)
      startCountdown(retry)
    } else if (err.message !== 'Aborted') {
      error.value = err.response?.data?.detail ?? err.message ?? t('reports.failed')
    }
  } finally {
    isGenerating.value = false
  }
}

onUnmounted(() => {
  pollAborted = true
  if (countdownInterval) clearInterval(countdownInterval)
  if (loadingStepTimeout) clearTimeout(loadingStepTimeout)
})
</script>
