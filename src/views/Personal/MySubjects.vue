<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {{ t('nav.mySubjects') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t('common.total') }}: {{ subjects.length }}
        </p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="flex flex-col items-center gap-3">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="subjects.length === 0"
        class="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <BookOpen class="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
        <p class="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('common.noData') }}</p>
      </div>

      <!-- Grid -->
      <div
        v-else
        class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <div
          v-for="subject in subjects"
          :key="subject.offering_id"
          class="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
        >
          <!-- Subject name + code + language -->
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-base font-semibold text-gray-800 dark:text-white/90">
                {{ subject.subject_name }}
              </p>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ subject.subject_code }}</p>
            </div>
            <span class="shrink-0 inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              {{ subject.language }}
            </span>
          </div>

          <!-- Teacher -->
          <div class="flex items-center gap-2.5">
            <div class="shrink-0">
              <img
                v-if="subject.teacher?.avatar"
                :src="subject.teacher.avatar"
                :alt="subject.teacher.full_name"
                class="h-8 w-8 rounded-full object-cover"
              />
              <div
                v-else
                class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
              >
                {{ teacherInitials(subject.teacher?.full_name) }}
              </div>
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ subject.teacher?.full_name ?? '—' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ subject.class_group_name }}</p>
            </div>
          </div>

          <!-- Divider -->
          <div class="h-px bg-gray-100 dark:bg-gray-800"></div>

          <!-- Overall grade -->
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('classes.grade') }}</span>
            <span
              class="text-2xl font-bold"
              :class="gradeColor(subject.student_grade)"
            >
              {{ subject.student_grade ?? '—' }}
            </span>
          </div>

          <!-- Quarter grades -->
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(value, key) in subject.quarter_grades"
              :key="key"
              class="flex flex-col items-center rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800"
            >
              <span class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">{{ key }}</span>
              <span
                class="text-sm font-semibold"
                :class="gradeColor(value)"
              >
                {{ value ?? '—' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { BookOpen } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getMySubjectsApi } from '@/api/studentSelf'
import type { MySubject } from '@/types/studentSelf'

const { t } = useI18n()

const subjects = ref<MySubject[]>([])
const loading = ref(false)

function teacherInitials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function gradeColor(grade: number | null | undefined): string {
  if (grade == null) return 'text-gray-400 dark:text-gray-500'
  if (grade > 80) return 'text-success-600 dark:text-success-400'
  if (grade > 60) return 'text-warning-600 dark:text-warning-400'
  return 'text-error-600 dark:text-error-400'
}

async function fetchSubjects() {
  loading.value = true
  try {
    const { data } = await getMySubjectsApi()
    subjects.value = data
  } catch {
    subjects.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchSubjects)
</script>
