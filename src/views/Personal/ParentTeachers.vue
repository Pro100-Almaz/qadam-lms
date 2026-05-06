<template>
  <AdminLayout>
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <div class="flex flex-col items-center gap-3">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-xl font-bold text-gray-800 dark:text-white/90">{{ t('nav.myTeachers') }}</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ teachers.length }} {{ teachers.length === 1 ? 'teacher' : 'teachers' }}
        </p>
      </div>

      <!-- Empty -->
      <div
        v-if="teachers.length === 0"
        class="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs"
      >
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Users class="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">{{ t('common.noData') }}</p>
      </div>

      <!-- Teacher grid -->
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="teacher in teachers"
          :key="teacher.id"
          class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
        >
          <div class="flex items-start gap-4">
            <!-- Avatar -->
            <div class="shrink-0">
              <img
                v-if="teacher.avatar"
                :src="teacher.avatar"
                :alt="teacher.full_name"
                class="h-12 w-12 rounded-full object-cover"
              />
              <div
                v-else
                class="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold"
                :class="avatarColorClass(teacher.id)"
              >
                {{ initials(teacher.full_name) }}
              </div>
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                {{ teacher.full_name }}
              </p>
              <p class="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                {{ teacher.email }}
              </p>

              <!-- Subject badges -->
              <div v-if="teacher.subjects.length > 0" class="mt-3 flex flex-wrap gap-1.5">
                <span
                  v-for="subject in teacher.subjects"
                  :key="subject"
                  class="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                >
                  {{ subject }}
                </span>
              </div>

              <!-- Children badges -->
              <div v-if="teacher.children.length > 0" class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-for="childName in teacher.children"
                  :key="childName"
                  class="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:bg-green-500/10 dark:text-green-400"
                >
                  <GraduationCap class="h-3 w-3" />
                  {{ childName }}
                </span>
              </div>
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
import { Users, GraduationCap } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getParentTeachersApi } from '@/api/parentSelf'
import type { ParentTeacher } from '@/types/parentSelf'

const { t } = useI18n()

const teachers = ref<ParentTeacher[]>([])
const loading = ref(true)

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
  const parts = fullName.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0]?.[0] ?? '').toUpperCase()
}

async function fetchTeachers() {
  loading.value = true
  try {
    const { data } = await getParentTeachersApi()
    teachers.value = data
  } catch {
    teachers.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchTeachers)
</script>
