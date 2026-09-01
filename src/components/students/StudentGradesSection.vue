<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 v-if="heading" class="text-base font-semibold text-gray-800 dark:text-white/90">{{ heading }}</h2>
        <p v-if="!loading && !loadError && total" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {{ t('studentGrades.summary', { count: total, percent: averagePercent }) }}
        </p>
      </div>
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div class="w-full sm:w-48">
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {{ t('studentGrades.subject') }}
          </label>
          <SelectMenu
            v-model="selectedSubject"
            :options="subjectOptions"
            :placeholder="t('studentGrades.allSubjects')"
            :aria-label="t('studentGrades.subject')"
            clearable
            :clear-label="t('studentGrades.allSubjects')"
          />
        </div>
        <div class="w-full sm:w-44">
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {{ t('assignments.category') }}
          </label>
          <SelectMenu
            v-model="selectedCategory"
            :options="categoryOptions"
            :placeholder="t('assignments.allCategories')"
            :aria-label="t('assignments.category')"
            clearable
            :clear-label="t('assignments.allCategories')"
          />
        </div>
        <div class="w-full sm:w-40">
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {{ t('assignments.dateFrom') }}
          </label>
          <DatePicker
            v-model="dateFrom"
            :max-date="dateTo"
            :placeholder="t('assignments.pickDate')"
            :aria-label="t('assignments.dateFrom')"
            clearable
            :input-class="dateInputClass"
          />
        </div>
        <div class="w-full sm:w-40">
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {{ t('assignments.dateTo') }}
          </label>
          <DatePicker
            v-model="dateTo"
            :min-date="dateFrom"
            :placeholder="t('assignments.pickDate')"
            :aria-label="t('assignments.dateTo')"
            clearable
            :input-class="dateInputClass"
          />
        </div>
        <!-- Charts the same marks the table below lists. Like the workbook it
             carries its own quarter, so the filters here do not reach it. -->
        <StatisticsButton
          v-if="studentId"
          class="h-11 w-full sm:w-auto"
          :student="{ id: studentId, name: studentName }"
        />
        <!-- The workbook covers a whole quarter, so it ignores the filters
             above and asks for its own subject and quarter. -->
        <GradeReportButton
          v-if="studentId"
          class="h-11 w-full sm:w-auto"
          :student="{ id: studentId, name: studentName }"
          :subjects="subjects"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div
        v-for="index in 4"
        :key="index"
        class="h-20 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      ></div>
    </div>

    <!-- Error -->
    <div
      v-else-if="loadError"
      class="rounded-xl border border-error-200 bg-error-50 px-6 py-10 text-center dark:border-error-500/20 dark:bg-error-500/10"
    >
      <CircleAlert class="mx-auto h-8 w-8 text-error-500" />
      <p class="mt-3 text-sm text-error-600 dark:text-error-400">{{ t('studentGrades.loadError') }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600"
        @click="fetchGrades"
      >
        {{ t('assignments.tryAgain') }}
      </button>
    </div>

    <!-- Table — the API orders by the assignment's date, so newest lessons lead. -->
    <div
      v-else-if="grades.length"
      class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
    >
      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="w-full min-w-[880px]">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('assignments.assignmentTitle') }}
              </th>
              <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('studentGrades.subject') }}
              </th>
              <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('assignments.category') }}
              </th>
              <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('studentGrades.grade') }}
              </th>
              <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('studentGrades.comment') }}
              </th>
              <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('studentGrades.assignmentDate') }}
              </th>
              <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('studentGrades.gradedAt') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="grade in grades"
              :key="grade.id"
              class="border-b border-gray-100 last:border-0 dark:border-gray-800"
            >
              <td class="px-5 py-3.5">
                <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ grade.assignment.title }}</p>
              </td>
              <td class="px-5 py-3.5">
                <span class="text-sm text-gray-600 dark:text-gray-300">{{ grade.assignment.subject_name || '—' }}</span>
              </td>
              <td class="px-5 py-3.5">
                <AssignmentCategoryBadge :category="grade.assignment.category" />
              </td>
              <td class="whitespace-nowrap px-5 py-3.5">
                <span class="text-sm font-bold" :class="gradeColor(grade)">
                  {{ grade.grade ?? '—' }}<span class="text-xs font-medium text-gray-400">/{{ grade.assignment.max_grade }}</span>
                </span>
              </td>
              <td class="max-w-xs px-5 py-3.5">
                <p class="line-clamp-2 text-sm text-gray-600 dark:text-gray-300" :title="grade.comments || undefined">
                  {{ grade.comments || '—' }}
                </p>
              </td>
              <td class="whitespace-nowrap px-5 py-3.5">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatAcademicDate(grade.assignment.date) }}
                </span>
              </td>
              <!-- When the mark was entered, which need not be the lesson day. -->
              <td class="whitespace-nowrap px-5 py-3.5">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatRecordedAt(grade.created_at) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else
      class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 dark:border-gray-700 dark:bg-gray-900"
    >
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <SquareCheckBig class="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <p class="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('studentGrades.noResults') }}</p>
    </div>

    <Pagination
      v-if="!loading && !loadError && total > 0"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[20, 50, 100]"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CircleAlert, SquareCheckBig } from 'lucide-vue-next'
import AssignmentCategoryBadge from '@/components/grading/AssignmentCategoryBadge.vue'
import StatisticsButton from '@/components/analytics/StatisticsButton.vue'
import GradeReportButton from '@/components/grading/GradeReportButton.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import Pagination from '@/components/ui/Pagination.vue'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import {
  SUBJECT_ASSIGNMENT_CATEGORIES,
  getSubjectGradesApi,
  type SubjectAssignmentCategory,
  type SubjectGrade,
} from '@/api/subjectAssignments'
import { formatAcademicDate, formatRecordedAt } from '@/utils/gradeDates'

export interface GradeSubjectOption {
  id: number
  name: string
}

/**
 * One student's marks on graded assignments, newest academic date first. Read-only wherever
 * it is mounted: grading happens from the teacher's own Grading page, which is
 * scoped to the offerings they actually teach.
 *
 * The endpoint scopes itself to the caller, so a viewer who may only see part
 * of this student's record gets that part rather than a 403.
 */
const props = defineProps<{
  /** Student **profile** id, not the user id. */
  studentId: number
  /** Subjects offered to this student — the filter's option list. */
  subjects: GradeSubjectOption[]
  heading?: string
  /** Shown in the report dialog so the reader sees whose marks they are asking for. */
  studentName?: string
}>()

const { t } = useI18n()

const grades = ref<SubjectGrade[]>([])
const total = ref(0)
const loading = ref(true)
const loadError = ref(false)
const selectedSubject = ref<number | string | null>(null)
const selectedCategory = ref<number | string | null>(null)
/** Both `YYYY-MM-DD`, matched against the assignment's academic date. */
const dateFrom = ref('')
const dateTo = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const subjectOptions = computed<SelectOption[]>(() => {
  const unique = new Map<number, string>()
  props.subjects.forEach(subject => unique.set(subject.id, subject.name))
  return [...unique.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

const categoryOptions = computed<SelectOption[]>(() =>
  SUBJECT_ASSIGNMENT_CATEGORIES.map(category => ({
    value: category,
    label: t(`assignments.categories.${category}`),
  })),
)

/**
 * Assignments are scored on different scales, so raw marks cannot be averaged —
 * each is normalised to a percentage of its own maximum first. Covers the
 * current page only, which is what the reader can see.
 */
const averagePercent = computed(() => {
  // Comment-only rows carry no mark, so they cannot pull the average either way.
  const scored = grades.value.filter(
    grade => grade.assignment.max_grade > 0 && grade.grade !== null,
  )
  if (!scored.length) return 0
  const sum = scored.reduce((acc, grade) => acc + (grade.grade! / grade.assignment.max_grade) * 100, 0)
  return Math.round(sum / scored.length)
})

async function fetchGrades() {
  // The host only renders this once it holds a student, so a missing id here
  // means the profile id never arrived — surface it instead of spinning.
  if (!props.studentId) {
    grades.value = []
    total.value = 0
    loading.value = false
    loadError.value = true
    return
  }

  loading.value = true
  loadError.value = false
  try {
    const { data } = await getSubjectGradesApi({
      student: props.studentId,
      subject: selectedSubject.value ? Number(selectedSubject.value) : undefined,
      category: (selectedCategory.value as SubjectAssignmentCategory) || undefined,
      date_from: dateFrom.value || undefined,
      date_to: dateTo.value || undefined,
      page: currentPage.value,
      page_size: pageSize.value,
    })
    grades.value = data.results
    total.value = data.count
  } catch {
    grades.value = []
    total.value = 0
    loadError.value = true
  } finally {
    loading.value = false
  }
}

watch([selectedSubject, selectedCategory, dateFrom, dateTo, pageSize], () => {
  if (currentPage.value === 1) fetchGrades()
  else currentPage.value = 1
})
watch(currentPage, fetchGrades)

// `studentId` arrives asynchronously on the pages that load a student first.
watch(
  () => props.studentId,
  () => {
    currentPage.value = 1
    selectedSubject.value = null
    selectedCategory.value = null
    dateFrom.value = ''
    dateTo.value = ''
    fetchGrades()
  },
  { immediate: true },
)

function gradeColor(grade: SubjectGrade): string {
  const max = grade.assignment.max_grade
  if (!max || grade.grade === null) return 'text-gray-700 dark:text-gray-300'
  const percent = (grade.grade / max) * 100
  if (percent > 80) return 'text-success-600 dark:text-success-400'
  if (percent > 60) return 'text-warning-600 dark:text-warning-400'
  return 'text-error-600 dark:text-error-400'
}

/** The filter row runs one step taller than the picker's default. */
const dateInputClass =
  'h-11 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 pr-9 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
</script>
