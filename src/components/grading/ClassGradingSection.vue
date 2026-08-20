<template>
  <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
    <div class="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('assignments.classSectionTitle') }}</h2>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ t('assignments.classSectionSubtitle') }}</p>
      </div>
      <div class="flex shrink-0 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="rounded-md px-3 py-1.5 text-xs font-medium transition"
          :class="view === tab.key
            ? 'bg-white text-gray-800 shadow-theme-xs dark:bg-gray-900 dark:text-white/90'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
          @click="view = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Both tabs filter on the assignment's academic date, so the row is shared. -->
    <div class="flex flex-col gap-3 border-b border-gray-200 px-5 py-3 dark:border-gray-800 sm:flex-row sm:items-end">
      <div class="w-full sm:w-40">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('assignments.dateFrom') }}</label>
        <DatePicker
          v-model="dateFrom"
          :max-date="dateTo"
          :placeholder="t('assignments.pickDate')"
          :aria-label="t('assignments.dateFrom')"
          clearable
        />
      </div>
      <div class="w-full sm:w-40">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('assignments.dateTo') }}</label>
        <DatePicker
          v-model="dateTo"
          :min-date="dateFrom"
          :placeholder="t('assignments.pickDate')"
          :aria-label="t('assignments.dateTo')"
          clearable
        />
      </div>
      <button
        v-if="dateFrom || dateTo"
        type="button"
        class="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-gray-500 transition hover:text-brand-500 dark:text-gray-400"
        @click="resetDateRange"
      >
        <X class="h-4 w-4" /> {{ t('common.reset') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3 p-5">
      <div
        v-for="index in 3"
        :key="index"
        class="h-20 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
      ></div>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="px-5 py-10 text-center">
      <CircleAlert class="mx-auto h-8 w-8 text-error-500" />
      <p class="mt-3 text-sm text-error-600 dark:text-error-400">{{ t('assignments.loadError') }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600"
        @click="fetchData"
      >
        {{ t('assignments.tryAgain') }}
      </button>
    </div>

    <!-- Assignments -->
    <template v-else-if="view === 'assignments'">
      <div v-if="assignments.length" class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="w-full min-w-[760px]">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('assignments.assignmentTitle') }}
              </th>
              <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('assignments.date') }}
              </th>
              <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('assignments.subject') }}
              </th>
              <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('assignments.category') }}
              </th>
              <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('assignments.maxGrade') }}
              </th>
              <th class="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('common.actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="assignment in assignments"
              :key="assignment.id"
              class="border-b border-gray-100 last:border-0 dark:border-gray-800"
            >
              <td class="px-5 py-3.5">
                <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ assignment.title }}</p>
              </td>
              <td class="whitespace-nowrap px-5 py-3.5">
                <span class="text-sm text-gray-600 dark:text-gray-300">{{ formatAcademicDate(assignment.date) }}</span>
              </td>
              <td class="px-5 py-3.5">
                <span class="text-sm text-gray-600 dark:text-gray-300">{{ assignment.subject_name || '—' }}</span>
              </td>
              <td class="px-5 py-3.5">
                <AssignmentCategoryBadge :category="assignment.category" />
              </td>
              <td class="px-5 py-3.5">
                <span class="text-sm text-gray-600 dark:text-gray-300">{{ assignment.max_grade }}</span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                  @click="openGrading(assignment)"
                >
                  <ClipboardCheck class="h-3.5 w-3.5" />
                  {{ canManage(assignment) ? t('assignments.grade') : t('assignments.viewGrades') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="px-5 py-12 text-center">
        <ClipboardList class="mx-auto h-8 w-8 text-gray-400" />
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('assignments.noClassAssignments') }}</p>
      </div>
    </template>

    <!-- Grades, grouped by student — the API already orders by student name. -->
    <template v-else>
      <div v-if="gradeGroups.length" class="divide-y divide-gray-100 dark:divide-gray-800">
        <div v-for="group in gradeGroups" :key="group.studentId" class="p-5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-500 dark:bg-brand-500/10">
                {{ initials(group.studentName) }}
              </div>
              <router-link
                :to="`/students/${group.studentUserId}`"
                class="text-sm font-medium text-gray-800 transition hover:text-brand-500 dark:text-white/90"
              >
                {{ group.studentName }}
              </router-link>
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('assignments.averagePercent', { percent: group.averagePercent }) }}
            </span>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <div
              v-for="grade in group.grades"
              :key="grade.id"
              class="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
              :title="grade.comments || undefined"
            >
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ grade.assignment.subject_name }} · {{ t(`assignments.categories.${grade.assignment.category}`) }}
              </p>
              <p class="mt-0.5 max-w-[14rem] truncate text-xs text-gray-600 dark:text-gray-300">
                {{ grade.assignment.title }}
              </p>
              <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                {{ formatAcademicDate(grade.assignment.date) }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500">
                {{ t('assignments.gradedAt', { date: formatRecordedAt(grade.created_at) }) }}
              </p>
              <p class="mt-1 text-sm font-bold" :class="gradeColor(grade)">
                {{ grade.grade ?? '—' }}<span class="text-xs font-medium text-gray-400">/{{ grade.assignment.max_grade }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="px-5 py-12 text-center">
        <SquareCheckBig class="mx-auto h-8 w-8 text-gray-400" />
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('assignments.noClassGrades') }}</p>
      </div>
    </template>

    <div v-if="!loading && !loadError && total > 0" class="border-t border-gray-200 px-5 py-4 dark:border-gray-800">
      <Pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[20, 50, 100]"
      />
    </div>

    <AssignmentGradingModal
      :open="gradingOpen"
      :assignment="gradingTarget"
      :can-grade="canManage(gradingTarget)"
      @close="gradingOpen = false"
      @saved="onGradesSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CircleAlert, ClipboardCheck, ClipboardList, SquareCheckBig, X } from 'lucide-vue-next'
import AssignmentCategoryBadge from '@/components/grading/AssignmentCategoryBadge.vue'
import AssignmentGradingModal from '@/components/grading/AssignmentGradingModal.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import Pagination from '@/components/ui/Pagination.vue'
import {
  getMyClassSubjectGradesApi,
  getSubjectAssignmentsApi,
  type SubjectAssignment,
  type SubjectGrade,
} from '@/api/subjectAssignments'
import { useAssignmentPermissions } from '@/composables/useAssignmentPermissions'
import { formatAcademicDate, formatRecordedAt } from '@/utils/gradeDates'

/**
 * The homeroom teacher's window onto their class: every assignment set for it,
 * across all subjects, and every grade their students earned — not just in the
 * subjects this teacher happens to teach.
 *
 * Mostly read-only. The list endpoints widen for a homeroom teacher, but the
 * write boundary does not: grading is only offered on the offerings this
 * teacher actually teaches, which `canManage()` decides row by row.
 */
const props = defineProps<{
  /** Narrows both lists when the caller is homeroom teacher of several classes. */
  classGroupId?: number
}>()

interface StudentGradeGroup {
  studentId: number
  studentUserId: number
  studentName: string
  grades: SubjectGrade[]
  averagePercent: number
}

type View = 'assignments' | 'grades'

const { t } = useI18n()
const { canManage, loadOfferings } = useAssignmentPermissions()

const view = ref<View>('assignments')
const assignments = ref<SubjectAssignment[]>([])
const grades = ref<SubjectGrade[]>([])
const total = ref(0)
const loading = ref(true)
const loadError = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
/** Both `YYYY-MM-DD`; on the grades tab they filter the assignment's date. */
const dateFrom = ref('')
const dateTo = ref('')

function resetDateRange() {
  dateFrom.value = ''
  dateTo.value = ''
}

const tabs = computed(() => [
  { key: 'assignments' as const, label: t('assignments.tabAssignments') },
  { key: 'grades' as const, label: t('assignments.tabGrades') },
])

const gradingOpen = ref(false)
const gradingTarget = ref<SubjectAssignment | null>(null)

function openGrading(assignment: SubjectAssignment) {
  gradingTarget.value = assignment
  gradingOpen.value = true
}

/** Grades just changed, so the grades tab is stale even if it is not showing. */
function onGradesSaved() {
  if (view.value === 'grades') fetchData()
}

const gradeGroups = computed<StudentGradeGroup[]>(() => {
  const grouped = new Map<number, StudentGradeGroup>()
  grades.value.forEach(grade => {
    const existing = grouped.get(grade.student)
    if (existing) {
      existing.grades.push(grade)
      return
    }
    grouped.set(grade.student, {
      studentId: grade.student,
      studentUserId: grade.student_user_id,
      studentName: grade.student_name,
      grades: [grade],
      averagePercent: 0,
    })
  })

  return [...grouped.values()].map(group => ({
    ...group,
    averagePercent: averagePercent(group.grades),
  }))
})

/**
 * Assignments are scored on different scales, so raw marks cannot be averaged —
 * each is normalised to a percentage of its own maximum first.
 */
function averagePercent(rows: SubjectGrade[]): number {
  // Comment-only rows carry no mark, so they cannot pull the average either way.
  const scored = rows.filter(row => row.assignment.max_grade > 0 && row.grade !== null)
  if (!scored.length) return 0
  const sum = scored.reduce((acc, row) => acc + (row.grade! / row.assignment.max_grade) * 100, 0)
  return Math.round(sum / scored.length)
}

async function fetchData() {
  loading.value = true
  loadError.value = false
  try {
    if (view.value === 'assignments') {
      // A teacher's scope already includes their homeroom class, so filtering by
      // the class group is what turns the personal list into the class's list.
      const { data } = await getSubjectAssignmentsApi({
        class_group: props.classGroupId || undefined,
        date_from: dateFrom.value || undefined,
        date_to: dateTo.value || undefined,
        page: currentPage.value,
        page_size: pageSize.value,
      })
      assignments.value = data.results
      total.value = data.count
    } else {
      // Always the caller's own homeroom class — there is no id in the path.
      // No homeroom assignment answers 200 with an empty page, not an error.
      const { data } = await getMyClassSubjectGradesApi({
        class_group: props.classGroupId || undefined,
        date_from: dateFrom.value || undefined,
        date_to: dateTo.value || undefined,
        page: currentPage.value,
        page_size: pageSize.value,
      })
      grades.value = data.results
      total.value = data.count
    }
  } catch {
    assignments.value = []
    grades.value = []
    total.value = 0
    loadError.value = true
  } finally {
    loading.value = false
  }
}

// Each tab paginates its own list, so switching starts over at page 1. A
// narrowed date range shortens the list the same way, so it restarts too.
watch([view, pageSize, dateFrom, dateTo], () => {
  if (currentPage.value === 1) fetchData()
  else currentPage.value = 1
})
watch(currentPage, fetchData)

// The class group id arrives after the homeroom dashboard resolves.
watch(
  () => props.classGroupId,
  () => {
    currentPage.value = 1
    fetchData()
  },
  { immediate: true },
)

// Decides which assignments this teacher may grade rather than only read.
onMounted(loadOfferings)

function gradeColor(grade: SubjectGrade): string {
  const max = grade.assignment.max_grade
  if (!max || grade.grade === null) return 'text-gray-700 dark:text-gray-300'
  const percent = (grade.grade / max) * 100
  if (percent > 80) return 'text-success-600 dark:text-success-400'
  if (percent > 60) return 'text-warning-600 dark:text-warning-400'
  return 'text-error-600 dark:text-error-400'
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}
</script>
