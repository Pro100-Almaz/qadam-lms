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
      <button @click="fetchDashboard" class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors">
        {{ t('common.retry') }}
      </button>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="dashboard" class="space-y-6">
      <!-- Welcome Header -->
      <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <div class="px-6 py-5">
          <h1 class="text-xl font-bold text-gray-800 dark:text-white/90">
            {{ t('teacherDashboard.welcome', { name: dashboard.full_name }) }}
          </h1>
          <div class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="role in dashboard.roles"
              :key="role"
              class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
              :class="roleBadgeClass(role)"
            >
              {{ roleLabel(role) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-800">
        <nav class="flex gap-4 -mb-px">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="pb-3 px-1 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === tab.key
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Lesson Teacher Tab -->
      <div v-if="activeTab === 'lessons' && dashboard.dashboards.lesson_teacher" class="space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.totalSubjects') }}</p>
            <p class="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{{ dashboard.dashboards.lesson_teacher.summary.total_offerings }}</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.totalLessons') }}</p>
            <p class="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{{ dashboard.dashboards.lesson_teacher.summary.total_lessons }}</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.graded') }}</p>
            <p class="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{{ dashboard.dashboards.lesson_teacher.summary.total_graded }}</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.ungraded') }}</p>
            <p class="mt-1 text-2xl font-bold" :class="dashboard.dashboards.lesson_teacher.summary.total_ungraded > 0 ? 'text-orange-500' : 'text-gray-800 dark:text-white/90'">
              {{ dashboard.dashboards.lesson_teacher.summary.total_ungraded }}
            </p>
          </div>
        </div>

        <!-- Grading Progress -->
        <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('teacherDashboard.gradingProgress') }}</p>
            <p class="text-sm font-bold text-brand-600 dark:text-brand-400">{{ dashboard.dashboards.lesson_teacher.summary.grading_percentage.toFixed(1) }}%</p>
          </div>
          <div class="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              class="h-2.5 rounded-full transition-all duration-500"
              :class="dashboard.dashboards.lesson_teacher.summary.grading_percentage >= 80 ? 'bg-green-500' : dashboard.dashboards.lesson_teacher.summary.grading_percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'"
              :style="{ width: `${dashboard.dashboards.lesson_teacher.summary.grading_percentage}%` }"
            ></div>
          </div>
        </div>

        <!-- Offerings Table -->
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('teacherDashboard.myOfferings') }}</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-800">
                  <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('subjects.subject') }}</th>
                  <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.classGroup') }}</th>
                  <th class="px-5 py-3.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.role') }}</th>
                  <th class="px-5 py-3.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.students') }}</th>
                  <th class="px-5 py-3.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.lessons') }}</th>
                  <th class="px-5 py-3.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.grading') }}</th>
                  <th class="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="o in dashboard.dashboards.lesson_teacher.offerings"
                  :key="o.offering_id"
                  class="border-b border-gray-100 last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td class="px-5 py-3.5">
                    <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ o.subject_name }}</p>
                  </td>
                  <td class="px-5 py-3.5">
                    <span class="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                      {{ o.class_group }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 text-center">
                    <span class="text-xs font-medium capitalize text-gray-600 dark:text-gray-400">{{ o.role }}</span>
                  </td>
                  <td class="px-5 py-3.5 text-center text-sm text-gray-600 dark:text-gray-300">{{ o.student_count }}</td>
                  <td class="px-5 py-3.5 text-center text-sm text-gray-600 dark:text-gray-300">{{ o.graded_lessons }}/{{ o.lesson_count }}</td>
                  <td class="px-5 py-3.5 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <div class="h-1.5 w-16 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          class="h-1.5 rounded-full"
                          :class="o.grading_percentage >= 80 ? 'bg-green-500' : o.grading_percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'"
                          :style="{ width: `${o.grading_percentage}%` }"
                        ></div>
                      </div>
                      <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ o.grading_percentage.toFixed(0) }}%</span>
                    </div>
                  </td>
                  <td class="px-5 py-3.5 text-right">
                    <router-link
                      :to="`/lessons?offering=${o.offering_id}`"
                      class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
                    >
                      <Eye class="h-3.5 w-3.5" />
                      {{ t('teacherDashboard.viewLessons') }}
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- My Students Tab -->
      <div v-if="activeTab === 'my-students'" class="space-y-6">
        <MyStudentsTab />
      </div>

      <!-- Homeroom Tab -->
      <div v-if="activeTab === 'my-class' && dashboard.dashboards.homeroom_teacher" class="space-y-6">
        <HomeroomTab :data="dashboard.dashboards.homeroom_teacher" />
      </div>

      <!-- Psychologist Tab -->
      <div v-if="activeTab === 'psychologist' && dashboard.dashboards.psychologist" class="space-y-6">
        <PsychologistTab :data="dashboard.dashboards.psychologist" />
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertCircle, Eye } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import HomeroomTab from './HomeroomTab.vue'
import PsychologistTab from './PsychologistTab.vue'
import MyStudentsTab from './MyStudentsTab.vue'
import { getTeacherDashboardApi } from '@/api/teacherDashboard'
import type { TeacherDashboardResponse } from '@/types/teacherDashboard'

const { t } = useI18n()

const loading = ref(true)
const error = ref<string | null>(null)
const dashboard = ref<TeacherDashboardResponse | null>(null)
const activeTab = ref('lessons')

const tabs = computed(() => {
  if (!dashboard.value) return []
  const result: { key: string; label: string }[] = []
  if (dashboard.value.dashboards.lesson_teacher) result.push({ key: 'lessons', label: t('teacherDashboard.mySubjects') })
  result.push({ key: 'my-students', label: t('teacherDashboard.myStudentsTab') })
  if (dashboard.value.dashboards.homeroom_teacher) result.push({ key: 'my-class', label: t('teacherDashboard.myClass') })
  if (dashboard.value.dashboards.psychologist) result.push({ key: 'psychologist', label: t('teacherDashboard.psychStates') })
  return result
})

function roleBadgeClass(role: string) {
  switch (role) {
    case 'Teacher': return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
    case 'HomeroomTeacher': return 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
    case 'Psychologist': return 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400'
    default: return 'bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400'
  }
}

function roleLabel(role: string) {
  switch (role) {
    case 'Teacher': return t('teacherDashboard.roleLessonTeacher')
    case 'HomeroomTeacher': return t('teacherDashboard.roleHomeroom')
    case 'Psychologist': return t('teacherDashboard.rolePsychologist')
    default: return role
  }
}

async function fetchDashboard() {
  loading.value = true
  error.value = null
  try {
    const { data } = await getTeacherDashboardApi()
    dashboard.value = data
    if (data.dashboards.lesson_teacher) activeTab.value = 'lessons'
    else if (data.dashboards.homeroom_teacher) activeTab.value = 'my-class'
    else if (data.dashboards.psychologist) activeTab.value = 'psychologist'
  } catch {
    error.value = t('teacherDashboard.loadError')
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboard)
</script>
