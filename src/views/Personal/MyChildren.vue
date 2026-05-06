<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {{ t('nav.myChildren') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t('common.total') }}: {{ children.length }}
        </p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="flex flex-col items-center gap-3">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
        </div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="children.length === 0"
        class="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <GraduationCap class="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
        <p class="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('common.noData') }}</p>
      </div>

      <!-- Children grid -->
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <router-link
          v-for="child in children"
          :key="child.id"
          :to="`/my-children/${child.id}`"
          class="group flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs transition-shadow hover:shadow-theme-md dark:border-gray-800 dark:bg-gray-900"
        >
          <!-- Avatar + name -->
          <div class="flex items-start gap-4">
            <div class="shrink-0">
              <img
                v-if="child.avatar"
                :src="child.avatar"
                :alt="child.full_name"
                class="h-14 w-14 rounded-full object-cover"
              />
              <div
                v-else
                class="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-base font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
              >
                {{ initials(child.full_name) }}
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-base font-semibold text-gray-800 group-hover:text-brand-600 dark:text-white/90 dark:group-hover:text-brand-400">
                {{ child.full_name }}
              </p>
              <p v-if="child.class_group_name" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{ child.class_group_name }}
              </p>
              <p v-if="child.school_group" class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                {{ child.school_group }}
              </p>
            </div>
          </div>

          <!-- Divider -->
          <div class="h-px bg-gray-100 dark:bg-gray-800"></div>

          <!-- Overall grade -->
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('students.grades') }}</span>
            <span class="text-2xl font-bold" :class="gradeColor(child.student_total_grade)">
              {{ child.student_total_grade ?? '—' }}
            </span>
          </div>

          <!-- Quarter grades -->
          <div class="flex flex-wrap gap-2">
            <div
              v-for="q in [1, 2, 3, 4]"
              :key="q"
              class="flex flex-col items-center rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800"
            >
              <span class="text-xs font-medium text-gray-400 dark:text-gray-500">Q{{ q }}</span>
              <span class="text-sm font-semibold" :class="quarterColor(child.quarter_grades[String(q)])">
                {{ child.quarter_grades[String(q)] ?? '—' }}
              </span>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { GraduationCap } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getMyChildrenApi } from '@/api/parentSelf'
import type { ParentChild } from '@/types/parentSelf'

const { t } = useI18n()

const children = ref<ParentChild[]>([])
const loading = ref(true)

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

function gradeColor(grade: number | null | undefined): string {
  if (grade == null) return 'text-gray-400 dark:text-gray-500'
  if (grade > 80) return 'text-success-600 dark:text-success-400'
  if (grade > 60) return 'text-warning-600 dark:text-warning-400'
  return 'text-error-600 dark:text-error-400'
}

function quarterColor(grade: number | null | undefined): string {
  if (grade == null) return 'text-gray-400 dark:text-gray-500'
  if (grade >= 5) return 'text-success-600 dark:text-success-400'
  if (grade >= 4) return 'text-brand-600 dark:text-brand-400'
  if (grade >= 3) return 'text-warning-600 dark:text-warning-400'
  return 'text-error-600 dark:text-error-400'
}

async function fetchChildren() {
  loading.value = true
  try {
    const { data } = await getMyChildrenApi()
    children.value = data
  } catch {
    children.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchChildren)
</script>
