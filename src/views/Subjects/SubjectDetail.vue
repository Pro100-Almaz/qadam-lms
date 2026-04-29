<template>
  <AdminLayout>
    <div class="space-y-6">

      <!-- Back button -->
      <button
        @click="$router.back()"
        class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90 transition-colors"
      >
        <ArrowLeft class="h-4 w-4" />
        {{ $t('common.back') }}
      </button>

      <!-- Loading skeleton -->
      <template v-if="loadingDetail">
        <div class="animate-pulse space-y-4">
          <div class="h-8 w-64 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div class="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div v-for="n in 4" :key="n" class="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </template>

      <!-- Error state -->
      <div
        v-else-if="detailError"
        class="rounded-xl border border-error-200 bg-error-50 p-6 text-center dark:border-error-500/20 dark:bg-error-500/10"
      >
        <AlertCircle class="mx-auto mb-2 h-8 w-8 text-error-500" />
        <p class="text-sm font-medium text-error-700 dark:text-error-400">{{ detailError }}</p>
        <button
          @click="fetchDetail"
          class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600 transition"
        >
          <RefreshCw class="h-3.5 w-3.5" />
          {{ $t('common.loading') }}
        </button>
      </div>

      <template v-else-if="subject">
        <!-- ── Header ─────────────────────────────────────────── -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
                {{ subject.name }}
              </h1>
              <!-- Language badge -->
              <span :class="langBadgeClass(subject.language_group)">
                {{ $t('subjects.languages.' + subject.language_group) }}
              </span>
              <!-- Status badge -->
              <span :class="statusBadgeClass(subject.status)">
                {{ statusLabel(subject.status) }}
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <!-- Teacher -->
              <div class="flex items-center gap-1.5">
                <GraduationCap class="h-4 w-4" />
                <span>
                  {{ subject.primary_teacher
                    ? subject.primary_teacher.user.first_name + ' ' + subject.primary_teacher.user.last_name
                    : $t('subjects.noTeacher') }}
                </span>
              </div>
              <!-- Added by -->
              <div class="flex items-center gap-1.5">
                <UserIcon class="h-4 w-4" />
                <span>
                  {{ $t('subjects.addedBy') }}:
                  {{ subject.added_by.first_name }} {{ subject.added_by.last_name }}
                </span>
              </div>
            </div>

            <!-- Classes offered -->
            <div v-if="subject.offerings.length" class="flex flex-wrap gap-1.5 pt-0.5">
              <span
                v-for="o in subject.offerings"
                :key="o.id"
                class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-white/70"
              >
                {{ o.class_group.display_name }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── Stats row ──────────────────────────────────────── -->
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div
            v-for="stat in statsCards"
            :key="stat.label"
            class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <div class="flex items-center gap-3">
              <div :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', stat.iconBg]">
                <component :is="stat.icon" :class="['h-5 w-5', stat.iconColor]" />
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
                <p class="text-xl font-semibold text-gray-800 dark:text-white/90">
                  {{ stat.value }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Quarter selector ───────────────────────────────── -->
        <div class="flex items-center gap-2">
          <button
            v-for="q in [1, 2, 3, 4]"
            :key="q"
            @click="selectQuarter(q)"
            :class="[
              'flex h-9 w-16 items-center justify-center rounded-lg text-sm font-medium transition',
              activeQuarter === q
                ? 'bg-brand-500 text-white shadow-sm'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5',
            ]"
          >
            Q{{ q }}
          </button>
          <span v-if="loadingGrades" class="ml-3 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <Loader2 class="h-3.5 w-3.5 animate-spin" />
            {{ $t('common.loading') }}
          </span>
        </div>

        <!-- Quarter stats strip -->
        <div
          v-if="grades"
          class="flex flex-wrap gap-x-6 gap-y-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-800/50"
        >
          <span class="text-gray-500 dark:text-gray-400">
            {{ $t('subjects.studentsCount') }}:
            <strong class="text-gray-800 dark:text-white/90">{{ grades.students_count }}</strong>
          </span>
          <span class="text-gray-500 dark:text-gray-400">
            {{ $t('lessons.title') }}:
            <strong class="text-gray-800 dark:text-white/90">{{ grades.lessons_count }}</strong>
          </span>
          <span class="text-gray-500 dark:text-gray-400">
            {{ $t('subjects.avgPoints') }}:
            <strong class="text-gray-800 dark:text-white/90">{{ grades.average_subject_points.toFixed(1) }}</strong>
          </span>
          <span class="text-gray-500 dark:text-gray-400">
            {{ $t('subjects.completion') }}:
            <strong class="text-gray-800 dark:text-white/90">{{ grades.completion_percent.toFixed(0) }}%</strong>
          </span>
        </div>

        <!-- ── Main content: gradebook + sidebar ─────────────── -->
        <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]">

          <!-- Left column -->
          <div class="space-y-6 min-w-0">

            <!-- Lessons table -->
            <div
              v-if="grades && grades.lessons.length"
              class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            >
              <div class="border-b border-gray-200 px-5 py-3.5 dark:border-gray-800">
                <h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {{ $t('lessons.title') }} — Q{{ activeQuarter }}
                </h2>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-gray-100 dark:border-gray-800">
                      <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 w-10">#</th>
                      <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ $t('common.name') }}</th>
                      <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ $t('lessons.dayOfWeek') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="lesson in grades.lessons"
                      :key="lesson.id"
                      class="border-b border-gray-100 last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td class="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{{ lesson.order }}</td>
                      <td class="px-5 py-3 text-sm font-medium">
                        <router-link
                          :to="`/lessons/${lesson.id}`"
                          class="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                        >
                          {{ lesson.title }}
                        </router-link>
                      </td>
                      <td class="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{{ formatDate(lesson.date) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Gradebook -->
            <div
              v-if="grades && grades.top_grades.length && grades.lessons.length"
              class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            >
              <div class="border-b border-gray-200 px-5 py-3.5 dark:border-gray-800">
                <h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {{ $t('subjects.gradebook') }} — Q{{ activeQuarter }}
                </h2>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-100 dark:border-gray-800">
                      <th class="sticky left-0 z-10 bg-white px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:bg-gray-900 dark:text-gray-400 min-w-[160px]">
                        {{ $t('students.fullName') }}
                      </th>
                      <th
                        v-for="lesson in grades.lessons"
                        :key="lesson.id"
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[48px]"
                        :title="lesson.title"
                      >
                        L{{ lesson.order }}
                      </th>
                      <th class="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 min-w-[64px]">
                        {{ $t('subjects.avg') }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="student in grades.top_grades"
                      :key="student.student_id"
                      class="border-b border-gray-100 last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td class="sticky left-0 z-10 bg-white px-5 py-3 font-medium text-gray-800 dark:bg-gray-900 dark:text-white/90">
                        {{ student.student_name }}
                      </td>
                      <td
                        v-for="lesson in grades.lessons"
                        :key="lesson.id"
                        class="px-3 py-3 text-center"
                      >
                        <span
                          v-if="getCellGrade(lesson.id, student.student_id) !== null"
                          :class="['inline-flex h-7 w-8 items-center justify-center rounded text-xs font-semibold', gradeCellClass(getCellGrade(lesson.id, student.student_id)!)]"
                        >
                          {{ getCellGrade(lesson.id, student.student_id) }}
                        </span>
                        <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                      </td>
                      <td class="px-4 py-3 text-center">
                        <span :class="['inline-flex h-7 min-w-[2rem] items-center justify-center rounded px-1.5 text-xs font-bold', gradeCellClass(student.grade)]">
                          {{ student.grade.toFixed(0) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Empty grades state -->
            <div
              v-else-if="grades && !loadingGrades"
              class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-14 dark:border-gray-700 dark:bg-gray-900"
            >
              <BookOpen class="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p class="text-sm text-gray-400 dark:text-gray-500">{{ $t('common.noData') }}</p>
            </div>
          </div>

          <!-- Right sidebar: Top students -->
          <div class="space-y-4">
            <div
              v-if="grades && grades.top_grades.length"
              class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            >
              <div class="border-b border-gray-200 px-5 py-3.5 dark:border-gray-800">
                <h2 class="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                  <Trophy class="h-4 w-4 text-warning-500" />
                  {{ $t('subjects.topStudents') }}
                </h2>
              </div>
              <ul class="divide-y divide-gray-100 dark:divide-gray-800">
                <li
                  v-for="(student, idx) in sortedTopGrades"
                  :key="student.student_id"
                  class="flex items-center gap-3 px-5 py-3"
                >
                  <!-- Rank -->
                  <span :class="['flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', rankBadgeClass(idx)]">
                    {{ idx + 1 }}
                  </span>
                  <!-- Name -->
                  <span class="flex-1 truncate text-sm text-gray-800 dark:text-white/90">
                    {{ student.student_name }}
                  </span>
                  <!-- Grade -->
                  <span :class="['inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded px-1.5 text-xs font-bold', gradeCellClass(student.grade)]">
                    {{ student.grade.toFixed(0) }}
                  </span>
                </li>
              </ul>
            </div>

            <!-- Subject info card -->
            <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 space-y-3">
              <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ $t('common.details') }}</h3>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-2">
                  <dt class="text-gray-500 dark:text-gray-400">{{ $t('subjects.language') }}</dt>
                  <dd class="font-medium text-gray-800 dark:text-white/90">{{ $t('subjects.languages.' + subject.language_group) }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-gray-500 dark:text-gray-400">{{ $t('common.status') }}</dt>
                  <dd><span :class="statusBadgeClass(subject.status)">{{ statusLabel(subject.status) }}</span></dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-gray-500 dark:text-gray-400">{{ $t('subjects.addedBy') }}</dt>
                  <dd class="font-medium text-gray-800 dark:text-white/90 text-right">
                    {{ subject.added_by.first_name }} {{ subject.added_by.last_name }}
                  </dd>
                </div>
                <div v-if="subject.primary_teacher" class="flex justify-between gap-2">
                  <dt class="text-gray-500 dark:text-gray-400">{{ $t('lessons.teacher') }}</dt>
                  <dd class="font-medium text-gray-800 dark:text-white/90 text-right">
                    {{ subject.primary_teacher.user.first_name }} {{ subject.primary_teacher.user.last_name }}
                  </dd>
                </div>
                <div v-if="subject.primary_teacher?.occupation" class="flex justify-between gap-2">
                  <dt class="text-gray-500 dark:text-gray-400">{{ $t('teachers.position') }}</dt>
                  <dd class="font-medium text-gray-800 dark:text-white/90 text-right">{{ subject.primary_teacher.occupation }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Loader2,
  Users,
  BookOpen,
  BarChart2,
  CheckCircle2,
  GraduationCap,
  User as UserIcon,
  Trophy,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getSubjectDetailApi, getSubjectGradesApi } from '@/api/subjects'
import type { SubjectDetail, SubjectGrades } from '@/types/subject'

const { t } = useI18n()
const route = useRoute()

const subjectId = computed(() => Number(route.params.id))

const subject = ref<SubjectDetail | null>(null)
const grades = ref<SubjectGrades | null>(null)
const loadingDetail = ref(false)
const loadingGrades = ref(false)
const detailError = ref<string | null>(null)
const activeQuarter = ref(1)

// ── Data fetching ──────────────────────────────────────────────────────────────

async function fetchDetail() {
  loadingDetail.value = true
  detailError.value = null
  try {
    const { data } = await getSubjectDetailApi(subjectId.value)
    subject.value = data
  } catch {
    detailError.value = t('common.noData')
  } finally {
    loadingDetail.value = false
  }
}

async function fetchGrades(quarter: number) {
  loadingGrades.value = true
  try {
    const { data } = await getSubjectGradesApi(subjectId.value, { quarter })
    grades.value = data
  } catch {
    grades.value = null
  } finally {
    loadingGrades.value = false
  }
}

function selectQuarter(q: number) {
  activeQuarter.value = q
  fetchGrades(q)
}

// ── Computed helpers ───────────────────────────────────────────────────────────

const statsCards = computed(() => {
  if (!subject.value) return []
  const g = grades.value
  return [
    {
      label: t('subjects.studentsCount'),
      value: subject.value.students_count,
      icon: Users,
      iconBg: 'bg-brand-50 dark:bg-brand-500/10',
      iconColor: 'text-brand-500 dark:text-brand-400',
    },
    {
      label: t('lessons.title'),
      value: subject.value.lessons_count,
      icon: BookOpen,
      iconBg: 'bg-success-50 dark:bg-success-500/10',
      iconColor: 'text-success-600 dark:text-success-400',
    },
    {
      label: t('subjects.avgPoints'),
      value: g ? g.average_subject_points.toFixed(1) : '—',
      icon: BarChart2,
      iconBg: 'bg-warning-50 dark:bg-warning-500/10',
      iconColor: 'text-warning-600 dark:text-warning-400',
    },
    {
      label: t('subjects.completion'),
      value: g ? g.completion_percent.toFixed(0) + '%' : '—',
      icon: CheckCircle2,
      iconBg: 'bg-blue-light-50 dark:bg-blue-light-500/10',
      iconColor: 'text-blue-light-500 dark:text-blue-light-400',
    },
  ]
})

const sortedTopGrades = computed(() => {
  if (!grades.value) return []
  return [...grades.value.top_grades].sort((a, b) => b.grade - a.grade)
})

// lesson_avgs: Record<lessonId, Record<studentId, grade>>
function getCellGrade(lessonId: number, studentId: number): number | null {
  const lessonMap = grades.value?.lesson_avgs[String(lessonId)]
  if (!lessonMap) return null
  const val = lessonMap[String(studentId)]
  return val !== undefined ? val : null
}

// ── Style helpers ──────────────────────────────────────────────────────────────

function gradeCellClass(grade: number): string {
  if (grade > 80) return 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400'
  if (grade > 60) return 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400'
  return 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400'
}

function statusBadgeClass(status: string): string {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
  switch (status) {
    case 'active':
      return `${base} bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400`
    case 'planned':
      return `${base} bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400`
    case 'archived':
      return `${base} bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/50`
    case 'disabled':
      return `${base} bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400`
    default:
      return `${base} bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/50`
  }
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: t('subjects.statusActive'),
    planned: t('subjects.statusPlanned'),
    archived: t('subjects.archive'),
    disabled: t('subjects.statusDisabled'),
  }
  return map[status] ?? status
}

function langBadgeClass(lang: string): string {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
  switch (lang) {
    case 'kaz':
      return `${base} bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400`
    case 'rus':
      return `${base} bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400`
    case 'eng':
      return `${base} bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400`
    default:
      return `${base} bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60`
  }
}

function rankBadgeClass(idx: number): string {
  if (idx === 0) return 'bg-warning-400 text-white'
  if (idx === 1) return 'bg-gray-400 text-white'
  if (idx === 2) return 'bg-orange-400 text-white'
  return 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────

onMounted(async () => {
  await fetchDetail()
  await fetchGrades(activeQuarter.value)
})
</script>
