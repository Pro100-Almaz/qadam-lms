<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.totalRecords') }}</p>
        <p class="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{{ data.stats.total_records }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.avgScore') }}</p>
        <p class="mt-1 text-2xl font-bold" :class="scoreColor(data.stats.average_score)">{{ data.stats.average_score.toFixed(1) }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.last30Days') }}</p>
        <p class="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{{ data.stats.records_last_30_days }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.needAttention') }}</p>
        <p class="mt-1 text-2xl font-bold text-red-500">{{ data.students_needing_attention.length }}</p>
      </div>
    </div>

    <!-- Score Distribution Chart -->
    <div class="rounded-xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
      <h3 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('teacherDashboard.scoreDistribution') }}</h3>
      <VueApexCharts type="bar" height="260" :options="barChartOptions" :series="barChartSeries" />
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Students Needing Attention -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">
            <AlertTriangle class="mr-1.5 inline h-4 w-4 text-red-500" />
            {{ t('teacherDashboard.studentsNeedAttention') }}
          </h3>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-gray-800">
          <router-link
            v-for="student in data.students_needing_attention"
            :key="student.student_id"
            :to="`/teacher/psychologist/${student.student_id}`"
            class="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ student.full_name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ student.low_score_count }} {{ t('teacherDashboard.lowScoreRecords') }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold" :class="scoreColor(student.average_score)">
                {{ student.average_score.toFixed(1) }}
              </span>
              <ChevronRight class="h-4 w-4 text-gray-400" />
            </div>
          </router-link>
          <div v-if="data.students_needing_attention.length === 0" class="px-5 py-8 text-center text-sm text-gray-400">
            {{ t('teacherDashboard.noAttentionNeeded') }}
          </div>
        </div>
      </div>

      <!-- Recent States -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('teacherDashboard.recentStates') }}</h3>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
          <router-link
            v-for="state in data.recent_states"
            :key="state.id"
            :to="`/teacher/psychologist/${state.student_id}`"
            class="block px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ state.student_name }}</p>
              <span
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                :class="psychBadgeClass(state.score)"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="psychDotClass(state.score)"></span>
                {{ state.name }} ({{ state.score }})
              </span>
            </div>
            <p v-if="state.comment" class="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{{ state.comment }}</p>
            <p class="mt-0.5 text-xs text-gray-400">{{ formatDate(state.time_added) }} · {{ state.added_by }}</p>
          </router-link>
          <div v-if="data.recent_states.length === 0" class="px-5 py-8 text-center text-sm text-gray-400">
            {{ t('common.noData') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, ChevronRight } from 'lucide-vue-next'
import VueApexCharts from 'vue3-apexcharts'
import type { PsychologistDashboard } from '@/types/teacherDashboard'

const props = defineProps<{ data: PsychologistDashboard }>()
const { t } = useI18n()

const barChartSeries = computed(() => [{
  name: t('teacherDashboard.records'),
  data: [1, 2, 3, 4, 5].map((s) => props.data.stats.score_distribution[String(s)] ?? 0),
}])

const barChartOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', type: 'bar', toolbar: { show: false } },
  colors: ['#F44336', '#FF9800', '#FFC107', '#8BC34A', '#4CAF50'],
  plotOptions: {
    bar: {
      distributed: true,
      borderRadius: 6,
      columnWidth: '50%',
      dataLabels: { position: 'top' },
    },
  },
  dataLabels: {
    enabled: true,
    offsetY: -20,
    style: { fontSize: '13px', fontWeight: 600, colors: ['#6B7280'] },
  },
  xaxis: {
    categories: ['1 - Critical', '2 - Low', '3 - Neutral', '4 - Good', '5 - Great'],
    labels: { style: { fontSize: '11px', colors: '#9CA3AF' } },
  },
  yaxis: { labels: { style: { fontSize: '12px', colors: '#9CA3AF' } } },
  grid: { borderColor: '#E5E7EB', strokeDashArray: 4, yaxis: { lines: { show: true } } },
  legend: { show: false },
  tooltip: { theme: 'light' },
}))

function scoreColor(score: number) {
  if (score <= 2) return 'text-red-500'
  if (score <= 3) return 'text-amber-500'
  return 'text-green-500'
}

function psychBadgeClass(score: number) {
  if (score <= 2) return 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
  if (score === 3) return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
  return 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
}

function psychDotClass(score: number) {
  if (score <= 2) return 'bg-red-500'
  if (score === 3) return 'bg-amber-500'
  return 'bg-green-500'
}

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}
</script>
