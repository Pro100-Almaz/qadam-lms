<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {{ t('nav.myClassmates') }}
        </h1>
        <!-- Search -->
        <div class="relative w-full sm:w-64">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('common.search') + '...'"
            class="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
        </div>
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
        v-else-if="classmates.length === 0"
        class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-20 dark:border-gray-800"
      >
        <GraduationCap class="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.noData') }}</p>
      </div>

      <!-- Grid -->
      <div
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="classmate in classmates"
          :key="classmate.id"
          class="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
        >
          <!-- Avatar -->
          <div class="shrink-0">
            <img
              v-if="classmate.avatar"
              :src="classmate.avatar"
              :alt="classmate.full_name"
              class="h-16 w-16 rounded-full object-cover"
            />
            <div
              v-else
              class="flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold"
              :class="avatarColorClass(classmate.id)"
            >
              {{ initials(classmate.full_name) }}
            </div>
          </div>

          <!-- Info -->
          <div class="w-full text-center">
            <p class="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">
              {{ classmate.full_name }}
            </p>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
              {{ classmate.email }}
            </p>
          </div>

          <!-- Grade badge -->
          <span
            class="inline-flex rounded-full px-3 py-0.5 text-xs font-semibold"
            :class="gradeBadgeClass(classmate.student_total_grade)"
          >
            {{ classmate.student_total_grade !== null ? classmate.student_total_grade : '—' }}
          </span>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, GraduationCap } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getMyClassmatesApi } from '@/api/studentSelf'
import type { MyClassmate } from '@/types/studentSelf'

const { t } = useI18n()

const classmates = ref<MyClassmate[]>([])
const loading = ref(false)
const searchQuery = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function fetchClassmates(search?: string) {
  loading.value = true
  try {
    const { data } = await getMyClassmatesApi(search ? { search } : undefined)
    classmates.value = data
  } catch {
    classmates.value = []
  } finally {
    loading.value = false
  }
}

watch(searchQuery, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchClassmates(val || undefined)
  }, 300)
})

const avatarColors = [
  'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
  'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
]

function avatarColorClass(id: number): string {
  return avatarColors[id % avatarColors.length]
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return fullName.slice(0, 2).toUpperCase()
}

function gradeBadgeClass(grade: number | null): string {
  if (grade === null) return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
  if (grade > 80) return 'bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400'
  if (grade > 60) return 'bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
  return 'bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400'
}

onMounted(() => fetchClassmates())
</script>
