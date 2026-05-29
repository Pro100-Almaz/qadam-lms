<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <!-- Score % -->
    <div class="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
          <Percent class="h-5 w-5 text-brand-500 dark:text-brand-400" />
        </div>
        <div class="min-w-0">
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('parentChildSubject.scorePercent') }}</p>
          <p class="text-xl font-semibold" :class="percentColor(scorePercent)">
            {{ scorePercent !== null ? `${scorePercent}%` : '—' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Grade 2-5 -->
    <div class="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-50 dark:bg-success-500/10">
          <Award class="h-5 w-5 text-success-500 dark:text-success-400" />
        </div>
        <div class="min-w-0">
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('lessons.grade') }}</p>
          <p class="text-xl font-semibold" :class="gradeNumberColor(grade)">
            {{ grade ?? '—' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Graded X/Y -->
    <div class="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning-50 dark:bg-warning-500/10">
          <ClipboardCheck class="h-5 w-5 text-warning-500 dark:text-warning-400" />
        </div>
        <div class="min-w-0">
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('parentChildSubject.graded') }}</p>
          <p class="text-xl font-semibold text-gray-800 dark:text-white/90">
            {{ gradedCount }}<span class="text-sm font-medium text-gray-400 dark:text-gray-500">/{{ totalLessons }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Avg pts -->
    <div class="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-500/10">
          <BarChart3 class="h-5 w-5 text-purple-500 dark:text-purple-400" />
        </div>
        <div class="min-w-0">
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('subjects.avgPoints') }}</p>
          <p class="text-xl font-semibold text-gray-800 dark:text-white/90">
            {{ avgPoints !== null ? avgPoints.toFixed(1) : '—' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Percent, Award, ClipboardCheck, BarChart3 } from 'lucide-vue-next'
import { useGradeHelpers } from '@/composables/useGradeHelpers'

defineProps<{
  scorePercent: number | null
  grade: number | null
  gradedCount: number
  totalLessons: number
  avgPoints: number | null
}>()

const { t } = useI18n()
const { percentColor, gradeNumberColor } = useGradeHelpers()
</script>
