<template>
  <AdminLayout>
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <div class="flex flex-col items-center gap-3">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
        <AlertCircle class="h-8 w-8 text-red-500" />
      </div>
      <p class="text-base font-medium text-gray-800 dark:text-white/90">{{ error }}</p>
    </div>

    <!-- Content -->
    <div v-else-if="detail" class="space-y-6">
      <!-- Back + Header -->
      <div class="flex items-center gap-3">
        <router-link
          to="/teacher"
          class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft class="h-4 w-4" />
        </router-link>
        <div>
          <h1 class="text-xl font-bold text-gray-800 dark:text-white/90">{{ detail.full_name }}</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.psychHistory') }}</p>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.totalRecords') }}</p>
          <p class="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{{ detail.total_records }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.avgScore') }}</p>
          <p class="mt-1 text-2xl font-bold" :class="scoreColor(detail.average_score)">{{ detail.average_score.toFixed(1) }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.latestScore') }}</p>
          <p v-if="detail.history.length > 0" class="mt-1 text-2xl font-bold" :class="scoreColor(detail.history[0].score)">
            {{ detail.history[0].score }}/5
          </p>
          <p v-else class="mt-1 text-lg text-gray-400">—</p>
        </div>
      </div>

      <!-- Score Trend Chart -->
      <div v-if="detail.history.length > 1" class="rounded-xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <h3 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('teacherDashboard.scoreTrend') }}</h3>
        <VueApexCharts type="line" height="260" :options="trendChartOptions" :series="trendChartSeries" />
      </div>

      <!-- History List -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('teacherDashboard.stateHistory') }}</h3>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-gray-800">
          <div
            v-for="entry in detail.history"
            :key="entry.id"
            class="px-5 py-4"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  :class="scoreBgClass(entry.score)"
                >
                  {{ entry.score }}
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ entry.name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(entry.time_added) }} · {{ entry.added_by }}</p>
                </div>
              </div>
            </div>
            <p v-if="entry.comment" class="mt-2 ml-13 text-sm text-gray-600 dark:text-gray-400">{{ entry.comment }}</p>
          </div>
          <div v-if="detail.history.length === 0" class="px-5 py-10 text-center text-sm text-gray-400">
            {{ t('common.noData') }}
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertCircle, ArrowLeft } from 'lucide-vue-next'
import VueApexCharts from 'vue3-apexcharts'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getPsychStudentDetailApi } from '@/api/teacherDashboard'
import type { PsychStudentDetail } from '@/types/teacherDashboard'

const route = useRoute()
const { t } = useI18n()

const loading = ref(true)
const error = ref<string | null>(null)
const detail = ref<PsychStudentDetail | null>(null)

const trendChartSeries = computed(() => {
  if (!detail.value) return []
  const sorted = [...detail.value.history].reverse()
  return [{ name: t('teacherDashboard.score'), data: sorted.map((e) => e.score) }]
})

const trendChartOptions = computed(() => {
  if (!detail.value) return {}
  const sorted = [...detail.value.history].reverse()
  return {
    chart: { fontFamily: 'Outfit, sans-serif', type: 'line', toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#465FFF'],
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 6, colors: ['#465FFF'], strokeWidth: 2, strokeColors: '#fff' },
    dataLabels: { enabled: true, offsetY: -10, style: { fontSize: '12px', fontWeight: 600, colors: ['#465FFF'] }, background: { enabled: false } },
    xaxis: {
      categories: sorted.map((e) => {
        try { return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(e.time_added)) } catch { return '' }
      }),
      labels: { style: { fontSize: '11px', colors: '#9CA3AF' }, rotate: -45, rotateAlways: sorted.length > 8 },
    },
    yaxis: { min: 0, max: 5, tickAmount: 5, labels: { style: { fontSize: '12px', colors: '#9CA3AF' } } },
    grid: { borderColor: '#E5E7EB', strokeDashArray: 4, yaxis: { lines: { show: true } } },
    tooltip: { theme: 'light' },
  }
})

function scoreColor(score: number) {
  if (score <= 2) return 'text-red-500'
  if (score <= 3) return 'text-amber-500'
  return 'text-green-500'
}

function scoreBgClass(score: number) {
  if (score <= 2) return 'bg-red-500'
  if (score === 3) return 'bg-amber-500'
  return 'bg-green-500'
}

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

async function fetchDetail() {
  loading.value = true
  error.value = null
  try {
    const { data } = await getPsychStudentDetailApi(Number(route.params.studentId))
    detail.value = data
  } catch {
    error.value = t('teacherDashboard.loadError')
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)
</script>
