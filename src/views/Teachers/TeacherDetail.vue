<template>
  <AdminLayout>
    <div class="space-y-6">

      <!-- Back button + breadcrumb row -->
      <div class="flex items-center gap-3">
        <button
          @click="router.push('/teachers')"
          class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <ArrowLeft class="h-4 w-4" />
          {{ t('common.back') }}
        </button>
        <span class="text-sm text-gray-400 dark:text-gray-600">/</span>
        <router-link
          to="/teachers"
          class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {{ t('teachers.title') }}
        </router-link>
        <span class="text-sm text-gray-400 dark:text-gray-600">/</span>
        <span class="text-sm text-gray-800 dark:text-white/90">{{ fullName }}</span>
      </div>

      <!-- Loading skeleton -->
      <template v-if="loading">
        <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <div class="h-28 bg-gradient-to-r from-indigo-500 to-purple-600" />
          <div class="px-6 pb-6 pt-4 space-y-4">
            <div class="h-6 w-48 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div class="h-4 w-32 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>
      </template>

      <!-- Error state -->
      <template v-else-if="error">
        <div class="rounded-xl border border-error-200 bg-error-50 px-6 py-10 text-center dark:border-error-500/20 dark:bg-error-500/10">
          <AlertCircle class="mx-auto mb-3 h-10 w-10 text-error-500 dark:text-error-400" />
          <p class="text-sm font-medium text-error-700 dark:text-error-400">{{ error }}</p>
          <button
            @click="fetchTeacher"
            class="mt-4 inline-flex items-center gap-2 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600"
          >
            <RefreshCw class="h-4 w-4" />
            {{ t('common.back') }}
          </button>
        </div>
      </template>

      <!-- Main content -->
      <template v-else-if="teacher">

        <!-- ─── Profile header card ─────────────────────────────────── -->
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <!-- Gradient banner -->
          <div class="h-28 bg-gradient-to-r from-indigo-500 to-purple-600" />

          <!-- Avatar + meta -->
          <div class="px-6 pb-6">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-10">
              <!-- Avatar -->
              <div class="flex items-end gap-4">
                <div class="relative">
                  <div
                    v-if="teacher.user.avatar"
                    class="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-white dark:border-gray-900 dark:bg-gray-900 shadow-md"
                  >
                    <img
                      :src="teacher.user.avatar"
                      :alt="fullName"
                      class="h-full w-full object-cover"
                    />
                  </div>
                  <div
                    v-else
                    class="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white text-xl font-bold dark:border-gray-900 shadow-md"
                    :class="avatarColorClass"
                  >
                    {{ initials }}
                  </div>
                </div>
                <div class="mb-1">
                  <h1 class="text-xl font-semibold text-gray-900 dark:text-white/90">
                    {{ fullName }}
                  </h1>
                  <div class="mt-1 flex flex-wrap items-center gap-2">
                    <!-- Role badge -->
                    <span class="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                      {{ teacher.user.role_display }}
                    </span>
                    <!-- Occupation -->
                    <span
                      v-if="teacher.occupation"
                      class="text-sm text-gray-500 dark:text-gray-400"
                    >
                      {{ teacher.occupation }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Stats row -->
            <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-white/5">
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('teachers.workingHours') }}
                </p>
                <p class="mt-1 text-base font-semibold text-gray-800 dark:text-white/90">
                  {{ teacher.working_hours }}h
                </p>
              </div>
              <div class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-white/5">
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('teachers.employmentType') }}
                </p>
                <p class="mt-1 text-base font-semibold text-gray-800 dark:text-white/90">
                  {{ employmentTypeLabel }}
                </p>
              </div>
              <div class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-white/5">
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('teachers.academicDegree') }}
                </p>
                <p class="mt-1 text-base font-semibold text-gray-800 dark:text-white/90">
                  {{ teacher.academic_degree || '—' }}
                </p>
              </div>
              <div class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-white/5">
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('teachers.gender') }}
                </p>
                <p class="mt-1 text-base font-semibold text-gray-800 dark:text-white/90">
                  {{ genderLabel }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── Two-column layout ─────────────────────────────────────── -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-5">

          <!-- Left column (60%) -->
          <div class="space-y-6 lg:col-span-3">

            <!-- Subjects card -->
            <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                <div class="flex items-center gap-2">
                  <BookOpen class="h-4 w-4 text-indigo-500" />
                  <h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {{ t('teachers.subjects') }}
                  </h2>
                </div>
                <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
                  {{ teacher.subjects.length }}
                </span>
              </div>

              <div class="p-6">
                <div
                  v-if="teacher.subjects.length === 0"
                  class="py-6 text-center text-sm text-gray-400 dark:text-gray-500"
                >
                  {{ t('common.noData') }}
                </div>
                <div v-else class="flex flex-wrap gap-3">
                  <router-link
                    v-for="subject in teacher.subjects"
                    :key="subject.id"
                    :to="`/subjects/${subject.id}`"
                    class="group flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:bg-white/5 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-gray-800 group-hover:text-indigo-700 dark:text-white/90 dark:group-hover:text-indigo-300">
                        {{ subject.name }}
                      </p>
                      <div class="mt-1 flex flex-wrap items-center gap-1.5">
                        <!-- Language badge -->
                        <span :class="languageBadgeClass(subject.language_group)">
                          {{ t('subjects.languages.' + subject.language_group) }}
                        </span>
                        <!-- Status badge -->
                        <span :class="statusBadgeClass(subject.status)">
                          {{ subjectStatusLabel(subject.status) }}
                        </span>
                      </div>
                    </div>
                    <ChevronRight class="h-4 w-4 shrink-0 text-gray-400 group-hover:text-indigo-500" />
                  </router-link>
                </div>
              </div>
            </div>

            <!-- Assignments card -->
            <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                <div class="flex items-center gap-2">
                  <ClipboardList class="h-4 w-4 text-purple-500" />
                  <h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {{ t('teachers.assignments') }}
                  </h2>
                </div>
                <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
                  {{ teacher.assignments.length }}
                </span>
              </div>

              <div class="overflow-x-auto">
                <div
                  v-if="teacher.assignments.length === 0"
                  class="px-6 py-6 text-center text-sm text-gray-400 dark:text-gray-500"
                >
                  {{ t('common.noData') }}
                </div>
                <table v-else class="w-full">
                  <thead>
                    <tr class="border-b border-gray-100 dark:border-gray-800">
                      <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {{ t('subjects.name') }}
                      </th>
                      <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {{ t('teachers.classGroup') }}
                      </th>
                      <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {{ t('teachers.role') }}
                      </th>
                      <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {{ t('teachers.gradingStrategy') }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="assignment in teacher.assignments"
                      :key="assignment.id"
                      class="border-b border-gray-100 last:border-0 dark:border-gray-800"
                    >
                      <td class="px-5 py-4">
                        <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                          {{ assignment.offering.subject.name }}
                        </p>
                        <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                          {{ assignment.offering.academic_year?.year || assignment.offering.academic_year }}
                        </p>
                      </td>
                      <td class="px-5 py-4">
                        <span class="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300">
                          {{ assignment.offering.class_group?.display_name || '—' }}
                        </span>
                      </td>
                      <td class="px-5 py-4">
                        <span class="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                          {{ assignment.role }}
                        </span>
                      </td>
                      <td class="px-5 py-4">
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                          {{ assignment.offering.grading_strategy || '—' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <!-- Right column (40%) -->
          <div class="space-y-6 lg:col-span-2">

            <!-- Personal information card -->
            <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-center gap-2 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                <User class="h-4 w-4 text-teal-500" />
                <h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {{ t('teachers.personalInfo') }}
                </h2>
              </div>
              <div class="divide-y divide-gray-100 dark:divide-gray-800">
                <div class="flex items-start justify-between gap-4 px-6 py-3.5">
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('teachers.email') }}</span>
                  <a
                    v-if="teacher.user.email"
                    :href="`mailto:${teacher.user.email}`"
                    class="max-w-[180px] truncate text-right text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {{ teacher.user.email }}
                  </a>
                  <span v-else class="text-sm text-gray-400 dark:text-gray-600">—</span>
                </div>
                <div class="flex items-start justify-between gap-4 px-6 py-3.5">
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('teachers.phone') }}</span>
                  <a
                    v-if="teacher.user.phone_number"
                    :href="`tel:${teacher.user.phone_number}`"
                    class="text-right text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {{ teacher.user.phone_number }}
                  </a>
                  <span v-else class="text-sm text-gray-400 dark:text-gray-600">—</span>
                </div>
                <div class="flex items-start justify-between gap-4 px-6 py-3.5">
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('teachers.dateOfBirth') }}</span>
                  <span class="text-right text-sm font-medium text-gray-800 dark:text-white/90">
                    {{ formattedDob || '—' }}
                  </span>
                </div>
                <div class="flex items-start justify-between gap-4 px-6 py-3.5">
                  <span class="shrink-0 text-sm text-gray-500 dark:text-gray-400">{{ t('teachers.address') }}</span>
                  <span class="max-w-[180px] text-right text-sm font-medium text-gray-800 dark:text-white/90">
                    {{ teacher.user.address || '—' }}
                  </span>
                </div>
                <div class="flex items-start justify-between gap-4 px-6 py-3.5">
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('teachers.school') }}</span>
                  <span class="max-w-[180px] text-right text-sm font-medium text-gray-800 dark:text-white/90">
                    {{ teacher.user.school || '—' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Quick contact card -->
            <div
              v-if="teacher.user.email || teacher.user.phone_number"
              class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            >
              <div class="flex items-center gap-2 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                <Phone class="h-4 w-4 text-green-500" />
                <h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {{ t('teachers.quickContact') }}
                </h2>
              </div>
              <div class="flex flex-col gap-3 p-6">
                <a
                  v-if="teacher.user.email"
                  :href="`mailto:${teacher.user.email}`"
                  class="inline-flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"
                >
                  <Mail class="h-4 w-4 shrink-0 text-indigo-500" />
                  <span class="min-w-0 truncate">{{ teacher.user.email }}</span>
                </a>
                <a
                  v-if="teacher.user.phone_number"
                  :href="`tel:${teacher.user.phone_number}`"
                  class="inline-flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 transition hover:border-green-300 hover:bg-green-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-green-500/40 dark:hover:bg-green-500/10"
                >
                  <Phone class="h-4 w-4 shrink-0 text-green-500" />
                  <span>{{ teacher.user.phone_number }}</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </template>

    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  User,
  Phone,
  Mail,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getTeacherDetailApi } from '@/api/teachers'
import type { TeacherDetail } from '@/types/teacher'
import type { LanguageGroup, SubjectStatus } from '@/types/subject'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const teacher = ref<TeacherDetail | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchTeacher() {
  loading.value = true
  error.value = null
  try {
    const userId = Number(route.params.userId)
    const { data } = await getTeacherDetailApi(userId)
    teacher.value = data
  } catch {
    error.value = t('common.noData')
  } finally {
    loading.value = false
  }
}

onMounted(fetchTeacher)

// ─── Computed helpers ─────────────────────────────────────────────────────────

const fullName = computed(() => {
  if (!teacher.value) return ''
  const { last_name, first_name } = teacher.value.user
  return `${last_name} ${first_name}`.trim()
})

const initials = computed(() => {
  if (!teacher.value) return ''
  const first = teacher.value.user.first_name?.[0] || ''
  const last = teacher.value.user.last_name?.[0] || ''
  return (last + first).toUpperCase()
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

const avatarColorClass = computed(() => {
  if (!teacher.value) return avatarColors[0]
  return avatarColors[teacher.value.user.id % avatarColors.length]
})

const employmentTypeLabel = computed(() => {
  if (!teacher.value) return '—'
  const map: Record<string, string> = {
    full_time: t('teachers.fullTime'),
    part_time: t('teachers.partTime'),
  }
  return map[teacher.value.employment_type] ?? teacher.value.employment_type ?? '—'
})

const genderLabel = computed(() => {
  if (!teacher.value) return '—'
  const map: Record<string, string> = {
    M: t('teachers.male'),
    F: t('teachers.female'),
  }
  return map[teacher.value.gender] ?? teacher.value.gender ?? '—'
})

const formattedDob = computed(() => {
  const dob = teacher.value?.user.date_of_birth
  if (!dob) return null
  try {
    return new Date(dob).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dob
  }
})

// ─── Badge helpers ────────────────────────────────────────────────────────────

function languageBadgeClass(lang: LanguageGroup): string {
  const map: Record<LanguageGroup, string> = {
    kaz: 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    rus: 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    eng: 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  }
  return map[lang] ?? 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'
}

function statusBadgeClass(status: SubjectStatus): string {
  const map: Record<SubjectStatus, string> = {
    active:   'inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400',
    archived: 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
    disabled: 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400',
    planned:  'inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400',
  }
  return map[status] ?? 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500'
}

function subjectStatusLabel(status: SubjectStatus): string {
  const map: Record<SubjectStatus, string> = {
    active:   t('subjects.statusActive'),
    archived: t('subjects.archive'),
    disabled: t('subjects.statusDisabled'),
    planned:  t('subjects.statusPlanned'),
  }
  return map[status] ?? status
}
</script>
