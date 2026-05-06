<template>
  <div class="rounded-lg border border-gray-100 p-4 dark:border-gray-800" data-testid="subject-card">
    <div class="flex items-center justify-between">
      <h4 class="font-medium text-gray-900 dark:text-white">{{ analysis.subject }}</h4>
      <div class="text-sm">
        <span :class="gradeColor(analysis.grade_percentage)" class="font-semibold">
          {{ analysis.grade_percentage }}%
        </span>
        <span class="mx-1 text-gray-400">vs</span>
        <span class="text-gray-500">{{ t('reports.classAverage') }}: {{ analysis.class_average }}%</span>
      </div>
    </div>

    <div class="mt-3 space-y-1.5">
      <div class="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          class="h-2 rounded-full transition-all"
          :class="gradeBarColor(analysis.grade_percentage)"
          :style="{ width: `${Math.min(analysis.grade_percentage, 100)}%` }"
        />
      </div>
      <div class="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          class="h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"
          :style="{ width: `${Math.min(analysis.class_average, 100)}%` }"
        />
      </div>
    </div>

    <div class="mt-2 flex items-center gap-1.5 text-sm" :class="trendColor(analysis.trend)">
      <component :is="trendIcon(analysis.trend)" class="h-4 w-4" />
      <span>{{ t(`reports.${analysis.trend}`) }}</span>
    </div>

    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ analysis.analysis }}</p>

    <div class="mt-2 flex items-start gap-2 rounded-md bg-brand-50 p-2.5 text-sm dark:bg-brand-900/20">
      <Lightbulb class="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
      <span class="text-gray-700 dark:text-gray-300">{{ analysis.recommendation }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-vue-next'
import type { SubjectAnalysis } from '@/types/report'

defineProps<{ analysis: SubjectAnalysis }>()

const { t } = useI18n()

function trendIcon(trend: string) {
  if (trend === 'improving') return TrendingUp
  if (trend === 'declining') return TrendingDown
  return Minus
}

function trendColor(trend: string): string {
  if (trend === 'improving') return 'text-success-600 dark:text-success-400'
  if (trend === 'declining') return 'text-error-600 dark:text-error-400'
  return 'text-gray-500 dark:text-gray-400'
}

function gradeColor(grade: number): string {
  if (grade > 80) return 'text-success-600 dark:text-success-400'
  if (grade > 60) return 'text-warning-600 dark:text-warning-400'
  return 'text-error-600 dark:text-error-400'
}

function gradeBarColor(grade: number): string {
  if (grade > 80) return 'bg-success-500'
  if (grade > 60) return 'bg-warning-500'
  return 'bg-error-500'
}
</script>
