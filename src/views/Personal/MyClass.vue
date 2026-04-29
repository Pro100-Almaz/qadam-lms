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
    <div v-else-if="!isHomeroomTeacher" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/10">
        <ShieldAlert class="h-8 w-8 text-orange-500" />
      </div>
      <p class="text-base font-medium text-gray-800 dark:text-white/90">This page is only available for homeroom teachers.</p>
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
      <!-- Class Header -->
      <div v-if="classGroup" class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <div class="px-6 py-5">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 class="text-xl font-bold text-gray-800 dark:text-white/90">{{ classGroup.display_name }}</h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ t('students.yearOfEducation') }}: {{ classGroup.academic_year?.year || '—' }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 dark:bg-brand-500/10">
                <Users class="h-4 w-4 text-brand-500" />
                <span class="text-sm font-semibold text-brand-600 dark:text-brand-400">
                  {{ students.length }} {{ students.length === 1 ? 'student' : 'students' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Students Table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.title') }}</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {{ t('common.name') }}
                </th>
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {{ t('students.email') }}
                </th>
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {{ t('profile.phone') }}
                </th>
                <th class="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {{ t('common.actions') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="s in students"
                :key="s.id"
                class="border-b border-gray-100 last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="shrink-0">
                      <img
                        v-if="s.user.avatar"
                        :src="s.user.avatar"
                        :alt="s.user.last_name"
                        class="h-9 w-9 rounded-full object-cover"
                      />
                      <div
                        v-else
                        class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                      >
                        {{ (s.user.last_name?.[0] || '').toUpperCase() }}{{ (s.user.first_name?.[0] || '').toUpperCase() }}
                      </div>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                        {{ s.user.last_name }} {{ s.user.first_name }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ s.user.username }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5">
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ s.user.email || '—' }}</span>
                </td>
                <td class="px-5 py-3.5">
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ s.user.phone_number || '—' }}</span>
                </td>
                <td class="px-5 py-3.5 text-right">
                  <router-link
                    :to="`/students/${s.user.id}`"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
                  >
                    <Eye class="h-3.5 w-3.5" />
                    {{ t('common.view') || 'View' }}
                  </router-link>
                </td>
              </tr>
              <tr v-if="students.length === 0">
                <td colspan="4" class="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
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
  Users,
  Eye,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getStudentsApi } from '@/api/students'
import { getClassGroupsApi } from '@/api/academic'
import { useAuth } from '@/composables/useAuth'
import type { Student } from '@/types/student'
import type { ClassGroup } from '@/types/academic'

const { t } = useI18n()
const { user: authUser } = useAuth()

const loading = ref(true)
const error = ref<string | null>(null)
const students = ref<Student[]>([])
const classGroup = ref<ClassGroup | null>(null)

const isHomeroomTeacher = computed(() => authUser.value?.role === 'homeroom_teacher')

async function fetchData() {
  if (!isHomeroomTeacher.value) {
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  try {
    const classGroupsRes = await getClassGroupsApi()
    const groups = classGroupsRes.data

    // Find the class group matching this teacher's primary_group or take the first one
    const teacherGroup = authUser.value?.primary_group
    const matched = groups.find((g) => g.display_name === teacherGroup) || groups[0] || null
    classGroup.value = matched

    if (matched) {
      const studentsRes = await getStudentsApi({ class_group: matched.id })
      students.value = studentsRes.data
    }
  } catch {
    error.value = 'Failed to load class data.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>
