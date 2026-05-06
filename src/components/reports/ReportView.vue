<template>
  <div class="space-y-6 print:space-y-4">
    <!-- Header -->
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 print:border-0 print:shadow-none">
      <p class="text-xs font-semibold uppercase tracking-wider text-brand-500">Qadam Analytics</p>
      <h1 class="mt-1 text-xl font-bold text-gray-900 dark:text-white">{{ t('reports.title') }}</h1>
      <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
        <span class="font-medium text-gray-800 dark:text-white/90">{{ studentName }}</span>
        <span>{{ classGroup }}</span>
        <span v-if="academicYear">{{ academicYear }}</span>
        <span v-if="quarterLabel">{{ quarterLabel }}</span>
      </div>
      <div v-if="generatedBy || generatedAt" class="mt-2 text-xs text-gray-400">
        <span v-if="generatedBy">{{ t('reports.generatedBy') }}: {{ generatedBy }}</span>
        <span v-if="generatedBy && generatedAt" class="mx-1">·</span>
        <span v-if="generatedAt">{{ generatedAt }}</span>
      </div>
    </div>

    <!-- Summary -->
    <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('reports.summary') }}</h2>
      <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ reportData.summary }}</p>
    </section>

    <!-- Overall Assessment -->
    <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('reports.overallAssessment') }}</h2>
      <div class="mt-3">
        <span
          class="inline-flex rounded-full px-3 py-1 text-sm font-semibold"
          :class="scoreLabelClass(reportData.overall_assessment.score_label)"
        >
          {{ reportData.overall_assessment.score_label }}
        </span>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ reportData.overall_assessment.description }}</p>
      </div>
    </section>

    <!-- Academic Performance -->
    <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 print:break-before-page">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('reports.academicPerformance') }}</h2>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ reportData.academic_performance.overview }}</p>
      <div class="mt-4 space-y-3">
        <SubjectAnalysisCard
          v-for="sa in reportData.academic_performance.subject_analyses"
          :key="sa.subject"
          :analysis="sa"
        />
      </div>
    </section>

    <!-- Strengths -->
    <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('reports.strengths') }}</h2>
      <ul class="mt-3 space-y-2">
        <li v-for="(s, i) in reportData.strengths" :key="i" class="flex items-start gap-2 text-sm">
          <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-success-500" />
          <span class="text-gray-700 dark:text-gray-300"><strong>{{ s.area }}</strong> — {{ s.description }}</span>
        </li>
      </ul>
    </section>

    <!-- Areas for Improvement -->
    <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('reports.areasForImprovement') }}</h2>
      <ul class="mt-3 space-y-3">
        <li v-for="(a, i) in reportData.areas_for_improvement" :key="i" class="text-sm">
          <div class="flex items-start gap-2">
            <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-warning-500" />
            <span class="text-gray-700 dark:text-gray-300"><strong>{{ a.area }}</strong> — {{ a.description }}</span>
          </div>
          <div class="ml-6 mt-1 flex items-start gap-1.5 text-xs text-brand-600 dark:text-brand-400">
            <ArrowRight class="mt-0.5 h-3 w-3 shrink-0" />
            <span>{{ a.suggested_action }}</span>
          </div>
        </li>
      </ul>
    </section>

    <!-- Psychological Profile -->
    <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('reports.psychologicalProfile') }}</h2>
      <template v-if="reportData.psychological_profile.summary.toLowerCase().includes('no data')">
        <p class="mt-2 text-sm italic text-gray-400">{{ t('reports.noDataAvailable') }}</p>
      </template>
      <template v-else>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ reportData.psychological_profile.summary }}</p>
        <div v-if="reportData.psychological_profile.observations.length" class="mt-3">
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">{{ t('reports.observations') }}</p>
          <ul class="mt-1.5 space-y-1">
            <li v-for="(o, i) in reportData.psychological_profile.observations" :key="i" class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
              {{ o }}
            </li>
          </ul>
        </div>
        <div v-if="reportData.psychological_profile.recommendations.length" class="mt-3">
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">{{ t('reports.recommendations') }}</p>
          <ul class="mt-1.5 space-y-1">
            <li v-for="(r, i) in reportData.psychological_profile.recommendations" :key="i" class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              {{ r }}
            </li>
          </ul>
        </div>
      </template>
    </section>

    <!-- Extracurricular -->
    <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('reports.extracurricular') }}</h2>
      <template v-if="reportData.extracurricular.highlights.length === 0 && reportData.extracurricular.summary.toLowerCase().includes('no')">
        <p class="mt-2 text-sm italic text-gray-400">{{ t('reports.noDataAvailable') }}</p>
      </template>
      <template v-else>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ reportData.extracurricular.summary }}</p>
        <ul v-if="reportData.extracurricular.highlights.length" class="mt-2 space-y-1">
          <li v-for="(h, i) in reportData.extracurricular.highlights" :key="i" class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
            {{ h }}
          </li>
        </ul>
      </template>
    </section>

    <!-- Recommendations -->
    <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 print:break-before-page">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('reports.recommendations') }}</h2>
      <div class="mt-4 grid gap-4 md:grid-cols-3">
        <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/10">
          <p class="mb-2 text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">{{ t('reports.forTeachers') }}</p>
          <ul class="space-y-1.5">
            <li v-for="(r, i) in reportData.recommendations.for_teachers" :key="i" class="flex items-start gap-1.5 text-sm text-gray-700 dark:text-gray-300">
              <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              {{ r }}
            </li>
          </ul>
        </div>
        <div class="rounded-lg bg-green-50 p-4 dark:bg-green-900/10">
          <p class="mb-2 text-xs font-semibold uppercase text-green-600 dark:text-green-400">{{ t('reports.forParents') }}</p>
          <ul class="space-y-1.5">
            <li v-for="(r, i) in reportData.recommendations.for_parents" :key="i" class="flex items-start gap-1.5 text-sm text-gray-700 dark:text-gray-300">
              <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
              {{ r }}
            </li>
          </ul>
        </div>
        <div class="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/10">
          <p class="mb-2 text-xs font-semibold uppercase text-purple-600 dark:text-purple-400">{{ t('reports.forStudent') }}</p>
          <ul class="space-y-1.5">
            <li v-for="(r, i) in reportData.recommendations.for_student" :key="i" class="flex items-start gap-1.5 text-sm text-gray-700 dark:text-gray-300">
              <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
              {{ r }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Conclusion -->
    <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('reports.conclusion') }}</h2>
      <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ reportData.conclusion }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-vue-next'
import SubjectAnalysisCard from './SubjectAnalysisCard.vue'
import type { ReportData } from '@/types/report'

defineProps<{
  reportData: ReportData
  studentName: string
  classGroup: string
  academicYear?: string
  quarterLabel?: string
  generatedBy?: string
  generatedAt?: string
}>()

const { t } = useI18n()

function scoreLabelClass(label: string): string {
  const l = label.toLowerCase()
  if (l === 'excellent') return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
  if (l === 'good') return 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
  if (l === 'average') return 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
  return 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400'
}
</script>
