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
    <div v-else-if="!isParent" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/10">
        <ShieldAlert class="h-8 w-8 text-orange-500" />
      </div>
      <p class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('common.noAccess') || 'This page is only available for parent users.' }}</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
        <AlertCircle class="h-8 w-8 text-red-500" />
      </div>
      <p class="text-base font-medium text-gray-800 dark:text-white/90">{{ error }}</p>
    </div>

    <!-- Content -->
    <div v-else-if="student" class="space-y-6">
      <!-- Profile Header Card -->
      <div class="relative overflow-hidden rounded-xl border border-brand-200 bg-gradient-to-r from-brand-500 to-brand-600 dark:border-brand-800 shadow-theme-md">
        <div class="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5"></div>
        <div class="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/5"></div>

        <div class="relative px-6 py-8">
          <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <!-- Left: Avatar + Info -->
            <div class="flex items-center gap-5">
              <div class="shrink-0">
                <img
                  v-if="student.user.avatar"
                  :src="student.user.avatar"
                  :alt="fullName"
                  class="h-20 w-20 rounded-full object-cover ring-4 ring-white/20"
                />
                <div
                  v-else
                  class="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/20 text-2xl font-bold text-white"
                >
                  {{ initials }}
                </div>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-white">{{ fullName }}</h1>
                <p class="mt-1 text-sm text-white/70">{{ student.user.email }}</p>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    v-if="student.current_class_group"
                    class="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-xs font-medium text-white"
                  >
                    <GraduationCap class="h-3 w-3" />
                    {{ student.current_class_group.display_name }}
                  </span>
                  <span class="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-xs font-medium text-white">
                    <BookOpen class="h-3 w-3" />
                    {{ student.user.role_display }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Right: Overall grade badge -->
            <div class="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-white/15 px-8 py-5 backdrop-blur-sm">
              <span class="text-4xl font-extrabold text-white">{{ student.student_total_grade }}</span>
              <span class="mt-1 text-xs font-medium uppercase tracking-widest text-white/70">{{ t('students.grades') }}</span>
            </div>
          </div>

          <!-- Stat cards row -->
          <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p class="text-xs text-white/60">{{ t('students.grades') }}</p>
              <p class="mt-1 text-xl font-bold text-white">{{ student.student_total_grade }}</p>
            </div>
            <div class="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p class="text-xs text-white/60">{{ t('students.class') }}</p>
              <p class="mt-1 text-xl font-bold text-white truncate">
                {{ student.current_class_group?.display_name || '—' }}
              </p>
            </div>
            <div class="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p class="text-xs text-white/60">{{ t('students.yearOfEducation') }}</p>
              <p class="mt-1 text-xl font-bold text-white">
                {{ student.current_class_group?.academic_year?.year || '—' }}
              </p>
            </div>
            <div class="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm overflow-hidden">
              <p class="text-xs text-white/60">{{ t('students.email') }}</p>
              <p class="mt-1 text-sm font-semibold text-white truncate">{{ student.user.email }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quarter grade cards -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          v-for="q in [1, 2, 3, 4]"
          :key="q"
          class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs"
        >
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Q{{ q }}</p>
          <div class="mt-2 flex items-end justify-between">
            <span class="text-2xl font-bold text-gray-800 dark:text-white/90">
              {{ student.total_quarter_grades[String(q)] ?? '—' }}
            </span>
            <span
              class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
              :class="quarterBadgeClass(student.total_quarter_grades[String(q)])"
            >
              {{ quarterLabel(student.total_quarter_grades[String(q)]) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Cumulative subjects table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">
            {{ t('subjects.title') }}
          </h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {{ t('common.name') }}
                </th>
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Score
                </th>
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 w-40">
                  Progress
                </th>
                <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(score, subject) in student.cumulative_subject_grades"
                :key="subject"
                class="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                <td class="px-5 py-3.5">
                  <span class="text-sm font-medium text-gray-800 dark:text-white/90">{{ subject }}</span>
                </td>
                <td class="px-5 py-3.5">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ score.toFixed(1) }}%</span>
                </td>
                <td class="px-5 py-3.5">
                  <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="progressBarColor(score)"
                      :style="{ width: `${Math.min(score, 100)}%` }"
                    ></div>
                  </div>
                </td>
                <td class="px-5 py-3.5">
                  <span
                    class="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                    :class="gradeCircleClass(score)"
                  >
                    {{ scoreToGrade(score) }}
                  </span>
                </td>
              </tr>
              <tr v-if="Object.keys(student.cumulative_subject_grades).length === 0">
                <td colspan="4" class="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  {{ t('common.noData') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Psychological states (view-only) -->
      <div class="space-y-4">
        <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">Psychological States</h2>

        <div v-if="student.psychological_states.current.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="state in student.psychological_states.current"
            :key="state.id"
            class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs overflow-hidden"
            :class="stateBorderClass(state.score)"
            style="border-left-width: 4px"
          >
            <div class="p-4">
              <div class="flex items-start justify-between gap-2">
                <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ state.name }}</h3>
                <div class="flex shrink-0 items-center gap-0.5">
                  <Star
                    v-for="i in 5"
                    :key="i"
                    class="h-3.5 w-3.5"
                    :class="i <= state.score ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'"
                  />
                </div>
              </div>
              <span
                class="mt-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="scoreChipClass(state.score)"
              >
                {{ scoreLabel(state.score) }}
              </span>
              <blockquote v-if="state.comment" class="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
                <p class="text-xs italic leading-relaxed text-gray-600 dark:text-gray-400">"{{ state.comment }}"</p>
              </blockquote>
              <div class="mt-4 flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <User class="h-3.5 w-3.5 text-gray-400" />
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ state.added_by }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Clock class="h-3.5 w-3.5 text-gray-400" />
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(state.time_added) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 dark:border-gray-800">
          <Brain class="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.noData') }}</p>
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
  GraduationCap,
  BookOpen,
  Brain,
  User,
  Clock,
  Star,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getStudentDetailApi } from '@/api/students'
import { useAuth } from '@/composables/useAuth'
import type { StudentDetail } from '@/types/student'

const { t } = useI18n()
const { user: authUser } = useAuth()

const loading = ref(true)
const error = ref<string | null>(null)
const student = ref<StudentDetail | null>(null)

const isParent = computed(() => authUser.value?.role === 'parent')

const fullName = computed(() => {
  if (!student.value) return ''
  return `${student.value.user.last_name} ${student.value.user.first_name}`.trim()
})

const initials = computed(() => {
  if (!student.value) return ''
  const f = student.value.user.first_name?.[0] || ''
  const l = student.value.user.last_name?.[0] || ''
  return (l + f).toUpperCase()
})

function scoreToGrade(score: number): number {
  if (score > 80) return 5
  if (score > 60) return 4
  if (score > 40) return 3
  return 2
}

function progressBarColor(score: number): string {
  if (score > 80) return 'bg-success-500'
  if (score > 60) return 'bg-warning-500'
  return 'bg-error-500'
}

function gradeCircleClass(score: number): string {
  if (score > 80) return 'bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400'
  if (score > 60) return 'bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
  return 'bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400'
}

function quarterBadgeClass(grade: number | undefined): string {
  if (grade === undefined) return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
  if (grade >= 5) return 'bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400'
  if (grade >= 4) return 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
  if (grade >= 3) return 'bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
  return 'bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400'
}

function quarterLabel(grade: number | undefined): string {
  if (grade === undefined) return '—'
  if (grade >= 5) return 'Excellent'
  if (grade >= 4) return 'Good'
  if (grade >= 3) return 'Average'
  return 'Below avg'
}

function stateBorderClass(score: number): string {
  if (score >= 5) return '!border-l-success-400'
  if (score >= 4) return '!border-l-brand-400'
  if (score >= 3) return '!border-l-warning-400'
  return '!border-l-error-400'
}

function scoreChipClass(score: number): string {
  if (score >= 5) return 'bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400'
  if (score >= 4) return 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
  if (score >= 3) return 'bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
  return 'bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400'
}

function scoreLabel(score: number): string {
  const labels: Record<number, string> = {
    5: 'Excellent',
    4: 'Good',
    3: 'Average',
    2: 'Concerning',
    1: 'Critical',
  }
  return labels[score] || `Score ${score}`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

async function fetchStudent() {
  if (!isParent.value) {
    loading.value = false
    return
  }
  const userId = authUser.value?.id
  if (!userId) {
    error.value = 'User not found.'
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  try {
    const res = await getStudentDetailApi(userId)
    student.value = res.data
  } catch (err: any) {
    if (err?.response?.status === 404) {
      error.value = 'No linked student found for your account.'
    } else {
      error.value = 'Failed to load student data.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchStudent)
</script>
