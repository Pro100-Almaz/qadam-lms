<template>
  <AdminLayout>
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <div class="flex flex-col items-center gap-3">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Role mismatch -->
    <div v-else-if="!isTeacher" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/10">
        <ShieldAlert class="h-8 w-8 text-orange-500" />
      </div>
      <p class="text-base font-medium text-gray-800 dark:text-white/90">This page is only available for teachers.</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
        <AlertCircle class="h-8 w-8 text-red-500" />
      </div>
      <p class="text-base font-medium text-gray-800 dark:text-white/90">{{ error }}</p>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Header + filter -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-800 dark:text-white/90">{{ t('nav.myLessons') }}</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ lessons.length }} {{ lessons.length === 1 ? 'lesson' : 'lessons' }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <select
            v-model="selectedQuarter"
            class="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option :value="0">All Quarters</option>
            <option v-for="q in [1, 2, 3, 4]" :key="q" :value="q">Quarter {{ q }}</option>
          </select>
        </div>
      </div>

      <!-- Lessons Table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {{ t('common.name') }}
                </th>
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Subject
                </th>
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Class
                </th>
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Quarter
                </th>
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 w-32">
                  Graded
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="lesson in filteredLessons"
                :key="lesson.id"
                class="border-b border-gray-100 last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td class="px-5 py-3.5">
                  <span class="text-sm font-medium text-gray-800 dark:text-white/90">{{ lesson.title }}</span>
                </td>
                <td class="px-5 py-3.5">
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ lesson.offering.subject_name }}</span>
                </td>
                <td class="px-5 py-3.5">
                  <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {{ lesson.offering.class_group_name }}
                  </span>
                </td>
                <td class="px-5 py-3.5">
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ formatDate(lesson.date) }}</span>
                </td>
                <td class="px-5 py-3.5">
                  <span class="text-sm text-gray-600 dark:text-gray-300">Q{{ lesson.quarter }}</span>
                </td>
                <td class="px-5 py-3.5">
                  <span
                    class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    :class="statusBadgeClass(lesson.status)"
                  >
                    {{ lesson.status }}
                  </span>
                </td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-2">
                    <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :class="gradedBarColor(lesson.graded_percent)"
                        :style="{ width: `${Math.min(lesson.graded_percent, 100)}%` }"
                      ></div>
                    </div>
                    <span class="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {{ Math.round(lesson.graded_percent) }}%
                    </span>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredLessons.length === 0">
                <td colspan="7" class="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  {{ t('common.noData') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AlertCircle,
  ShieldAlert,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getLessonsApi } from '@/api/lessons'
import { useAuth } from '@/composables/useAuth'
import type { Lesson } from '@/types/lesson'

const { t } = useI18n()
const { user: authUser } = useAuth()

const loading = ref(true)
const error = ref<string | null>(null)
const lessons = ref<Lesson[]>([])
const selectedQuarter = ref(0)

const isTeacher = computed(() => {
  const role = authUser.value?.role
  return role === 'teacher' || role === 'homeroom_teacher'
})

const filteredLessons = computed(() => {
  if (selectedQuarter.value === 0) return lessons.value
  return lessons.value.filter((l) => l.quarter === selectedQuarter.value)
})

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function statusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'done':
      return 'bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400'
    case 'in_progress':
    case 'active':
      return 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
    case 'draft':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    default:
      return 'bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
  }
}

function gradedBarColor(percent: number): string {
  if (percent >= 80) return 'bg-success-500'
  if (percent >= 40) return 'bg-warning-500'
  return 'bg-error-500'
}

async function fetchLessons() {
  if (!isTeacher.value) {
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  try {
    const res = await getLessonsApi()
    lessons.value = res.data
  } catch {
    error.value = 'Failed to load lessons.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchLessons)
</script>
