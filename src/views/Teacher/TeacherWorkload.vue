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
    <div v-else-if="workload" class="space-y-6">
      <!-- Header with week nav -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-800 dark:text-white/90">{{ t('teacherDashboard.workload') }}</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ workload.period }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="changeWeek(-1)"
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <button
            @click="resetWeek"
            class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
          >
            {{ t('teacherDashboard.thisWeek') }}
          </button>
          <button
            @click="changeWeek(1)"
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.lessonsTaught') }}</p>
          <p class="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{{ workload.lessons_taught }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.lessonsUpcoming') }}</p>
          <p class="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">{{ workload.lessons_upcoming }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.withoutTopics') }}</p>
          <p class="mt-1 text-2xl font-bold" :class="workload.lessons_without_topics > 0 ? 'text-orange-500' : 'text-gray-800 dark:text-white/90'">
            {{ workload.lessons_without_topics }}
          </p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.gradingCompletion') }}</p>
          <p class="mt-1 text-2xl font-bold" :class="workload.grading_completion.completion_percentage >= 80 ? 'text-green-500' : 'text-orange-500'">
            {{ workload.grading_completion.completion_percentage.toFixed(0) }}%
          </p>
        </div>
      </div>

      <!-- Grading Breakdown -->
      <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <h3 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('teacherDashboard.gradingBreakdown') }}</h3>
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2">
            <div class="h-3 w-3 rounded-full bg-green-500"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ t('teacherDashboard.fullyGraded') }}: <strong>{{ workload.grading_completion.fully_graded }}</strong></span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-3 w-3 rounded-full bg-amber-500"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ t('teacherDashboard.partiallyGraded') }}: <strong>{{ workload.grading_completion.partially_graded }}</strong></span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-3 w-3 rounded-full bg-red-500"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ t('teacherDashboard.ungradedLabel') }}: <strong>{{ workload.grading_completion.ungraded }}</strong></span>
          </div>
        </div>
        <div class="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div class="bg-green-500 transition-all" :style="{ width: gradingBarWidth('fully_graded') }"></div>
          <div class="bg-amber-500 transition-all" :style="{ width: gradingBarWidth('partially_graded') }"></div>
          <div class="bg-red-500 transition-all" :style="{ width: gradingBarWidth('ungraded') }"></div>
        </div>
      </div>

      <!-- Subject Breakdown Table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('teacherDashboard.subjectBreakdown') }}</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('subjects.subject') }}</th>
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.classGroup') }}</th>
                <th class="px-5 py-3.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.lessonsThisWeek') }}</th>
                <th class="px-5 py-3.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.gradingStatus') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(subj, i) in workload.subjects"
                :key="i"
                class="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                <td class="px-5 py-3.5 text-sm font-medium text-gray-800 dark:text-white/90">{{ subj.subject_name }}</td>
                <td class="px-5 py-3.5">
                  <span class="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                    {{ subj.class_group }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-center text-sm text-gray-600 dark:text-gray-300">{{ subj.lessons_this_week }}</td>
                <td class="px-5 py-3.5 text-center">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    :class="subj.grading_complete
                      ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                      : 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'"
                  >
                    <span class="h-1.5 w-1.5 rounded-full" :class="subj.grading_complete ? 'bg-green-500' : 'bg-orange-500'"></span>
                    {{ subj.grading_complete ? t('teacherDashboard.complete') : t('teacherDashboard.incomplete') }}
                  </span>
                </td>
              </tr>
              <tr v-if="workload.subjects.length === 0">
                <td colspan="4" class="px-5 py-10 text-center text-sm text-gray-400">{{ t('common.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getTeacherWorkloadApi } from '@/api/teacherDashboard'
import type { TeacherWorkload } from '@/types/teacherDashboard'

const { t } = useI18n()

const loading = ref(true)
const error = ref<string | null>(null)
const workload = ref<TeacherWorkload | null>(null)
const weekOffset = ref(0)

function getMonday(offset: number): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7
  return new Date(d.setDate(diff))
}

function formatISODate(d: Date): string {
  return d.toISOString().split('T')[0]
}

async function fetchWorkload() {
  loading.value = true
  error.value = null
  try {
    const monday = getMonday(weekOffset.value)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    const { data } = await getTeacherWorkloadApi({
      week_start: formatISODate(monday),
      week_end: formatISODate(sunday),
    })
    workload.value = data
  } catch {
    error.value = t('teacherDashboard.loadError')
  } finally {
    loading.value = false
  }
}

function changeWeek(delta: number) {
  weekOffset.value += delta
  fetchWorkload()
}

function resetWeek() {
  weekOffset.value = 0
  fetchWorkload()
}

function gradingBarWidth(key: 'fully_graded' | 'partially_graded' | 'ungraded'): string {
  if (!workload.value) return '0%'
  const total = workload.value.grading_completion.total_lessons_to_grade
  if (total === 0) return '0%'
  return `${(workload.value.grading_completion[key] / total) * 100}%`
}

onMounted(fetchWorkload)
</script>
