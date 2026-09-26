<template>
  <div
    ref="root"
    class="overflow-hidden bg-white dark:bg-gray-900"
    :class="embedded ? '' : 'rounded-xl border border-gray-200 dark:border-gray-800'"
  >
    <div v-if="loading" class="space-y-3 p-5">
      <div
        v-for="index in 5"
        :key="index"
        class="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
      ></div>
    </div>

    <div v-else-if="loadError" class="px-5 py-10 text-center">
      <CircleAlert class="mx-auto h-8 w-8 text-error-500" />
      <p class="mt-3 text-sm text-error-600 dark:text-error-400">{{ t('homeworks.loadError') }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600"
        @click="load"
      >
        {{ t('homeworks.tryAgain') }}
      </button>
    </div>

    <div v-else-if="!students.length" class="px-5 py-12 text-center">
      <Users class="mx-auto h-8 w-8 text-gray-400" />
      <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('homeworks.noStudentsInClass') }}</p>
    </div>

    <div v-else-if="!homeworks.length" class="px-5 py-12 text-center">
      <NotebookPen class="mx-auto h-8 w-8 text-gray-400" />
      <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('homeworks.noClassHomeworks') }}</p>
    </div>

    <div v-else class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="w-full table-fixed border-collapse" :style="{ minWidth: tableMinWidth }">
        <colgroup>
          <col :style="nameColumnStyle" />
          <col v-for="index in displayColumnCount" :key="index" :style="gradeColumnStyle" />
          <col :style="averageColumnStyle" />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th
              scope="col"
              class="sticky left-0 z-10 border-b border-r border-gray-200 bg-white px-5 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="truncate text-base font-semibold normal-case tracking-normal text-gray-800 dark:text-white/90">
                    {{ subjectName || '—' }}
                  </h2>
                  <span class="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-normal normal-case tracking-normal text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                    {{ classGroupName }}
                  </span>
                </div>
                <p class="mt-1 text-xs font-normal normal-case tracking-normal text-gray-500 dark:text-gray-400">
                  {{ t('homeworks.gradebookMeta', { students: students.length, homeworks: homeworks.length }) }}
                </p>
              </div>
            </th>
            <th
              v-for="homework in homeworks"
              :key="homework.id"
              scope="col"
              class="border-b border-l border-gray-200 p-0 text-center align-bottom dark:border-gray-800"
            >
              <div class="block w-full overflow-hidden px-2 py-2.5" :title="columnTitle(homework)">
                <span class="mx-auto mb-1 block h-1 w-6 rounded-full bg-brand-500"></span>
                <span class="block truncate text-[11px] font-medium text-gray-700 dark:text-gray-300">
                  {{ formatShortDate(homework.due_date) }}
                </span>
                <span class="block truncate text-[11px] font-normal text-gray-500 dark:text-gray-400">
                  {{ homework.description || '—' }}
                </span>
                <span class="block text-[10px] font-normal text-gray-400 dark:text-gray-500">
                  / {{ homework.max_grade }}
                </span>
              </div>
            </th>
            <th
              v-for="index in fillerColumns"
              :key="`filler-${index}`"
              aria-hidden="true"
              class="border-b border-l border-gray-200 dark:border-gray-800"
            ></th>
            <th
              scope="col"
              class="border-b border-l border-gray-200 px-3 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-gray-400"
            >
              {{ t('assignments.averageShort') }}
            </th>
            <th aria-hidden="true" class="border-b border-gray-200 dark:border-gray-800"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(student, rowIndex) in students"
            :key="student.id"
            class="group hover:bg-gray-50 dark:hover:bg-white/5"
          >
            <th
              scope="row"
              class="sticky left-0 z-10 border-b border-r border-gray-100 bg-white px-5 py-2.5 text-left text-sm font-normal text-gray-800 group-hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:group-hover:bg-gray-800"
              :title="studentName(student)"
            >
              <span class="block w-[160px] truncate">{{ studentName(student) }}</span>
            </th>
            <td
              v-for="homework in homeworks"
              :key="homework.id"
              class="border-b border-l border-gray-100 px-2 py-2.5 text-center text-sm font-medium tabular-nums dark:border-gray-800"
              :class="cellClass(student.id, homework)"
              :title="cellTitle(student.id, homework)"
            >
              {{ cellLabel(student.id, homework) }}
            </td>
            <td
              v-for="index in fillerColumns"
              :key="`filler-${index}`"
              aria-hidden="true"
              class="border-b border-l border-gray-100 dark:border-gray-800"
            ></td>
            <td
              class="border-b border-l border-gray-100 px-3 py-2.5 text-center text-sm font-semibold tabular-nums dark:border-gray-800"
              :class="studentAverages[rowIndex] === null
                ? 'text-gray-400 dark:text-gray-500'
                : 'text-gray-700 dark:text-gray-300'"
            >
              {{ studentAverages[rowIndex] === null ? '—' : `${studentAverages[rowIndex]}%` }}
            </td>
            <td aria-hidden="true" class="border-b border-gray-100 dark:border-gray-800"></td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th
              scope="row"
              class="sticky left-0 z-10 border-r border-gray-100 bg-gray-50 px-5 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-white/5 dark:text-gray-400"
              :title="t('assignments.classAverage')"
            >
              <span class="block w-[160px] truncate">{{ t('assignments.classAverage') }}</span>
            </th>
            <td
              v-for="(homework, index) in homeworks"
              :key="homework.id"
              class="border-l border-gray-100 bg-gray-50 px-2 py-2.5 text-center text-xs font-semibold tabular-nums text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"
            >
              {{ homeworkAverages[index] === null ? '—' : `${homeworkAverages[index]}%` }}
            </td>
            <td
              v-for="index in fillerColumns"
              :key="`filler-${index}`"
              aria-hidden="true"
              class="border-l border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/5"
            ></td>
            <td class="border-l border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-white/5"></td>
            <td aria-hidden="true" class="bg-gray-50 dark:bg-white/5"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CircleAlert, NotebookPen, Users } from 'lucide-vue-next'
import { getStudentsApi } from '@/api/students'
import {
  getHomeworkGradesApi,
  getMyClassHomeworksApi,
  type Homework,
  type HomeworkGrade,
} from '@/api/homeworks'
import type { Student } from '@/types/student'
import { currentIntlLocale } from '@/i18n'

const props = defineProps<{
  offeringId: number
  classGroupId: number
  subjectName: string
  classGroupName: string
  embedded?: boolean
}>()

const { t } = useI18n()

const students = ref<Student[]>([])
const homeworks = ref<Homework[]>([])
const gradeRows = ref<Record<number, HomeworkGrade[]>>({})
const loading = ref(true)
const loadError = ref(false)

const NAME_COLUMN_WIDTH = 200
const AVERAGE_COLUMN_WIDTH = 72
const MIN_GRADE_COLUMN_WIDTH = 80
const MIN_GRADE_COLUMNS = 10
const LIST_PAGE_SIZE = 100
const MAX_LIST_PAGES = 10

const cardWidth = ref(0)
const root = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  resizeObserver = new ResizeObserver(entries => {
    cardWidth.value = entries[0]?.contentRect.width ?? 0
  })
  if (root.value) resizeObserver.observe(root.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

const gradeSpace = computed(() =>
  Math.max(0, cardWidth.value - NAME_COLUMN_WIDTH - AVERAGE_COLUMN_WIDTH),
)
const gradeColumnCount = computed(() =>
  Math.max(MIN_GRADE_COLUMNS, Math.floor(gradeSpace.value / MIN_GRADE_COLUMN_WIDTH)),
)
const gradeColumnWidth = computed(() =>
  Math.max(MIN_GRADE_COLUMN_WIDTH, Math.floor(gradeSpace.value / gradeColumnCount.value)),
)
const displayColumnCount = computed(() =>
  Math.max(homeworks.value.length, gradeColumnCount.value),
)
const fillerColumns = computed(() => displayColumnCount.value - homeworks.value.length)

const nameColumnStyle = { width: `${NAME_COLUMN_WIDTH}px` }
const averageColumnStyle = { width: `${AVERAGE_COLUMN_WIDTH}px` }
const gradeColumnStyle = computed(() => ({ width: `${gradeColumnWidth.value}px` }))
const tableMinWidth = computed(
  () =>
    `${NAME_COLUMN_WIDTH + displayColumnCount.value * gradeColumnWidth.value + AVERAGE_COLUMN_WIDTH}px`,
)

const gradesByHomeworkAndStudent = computed(() => {
  const byHomework = new Map<number, Map<number, HomeworkGrade>>()
  Object.entries(gradeRows.value).forEach(([homeworkId, rows]) => {
    byHomework.set(Number(homeworkId), new Map(rows.map(row => [row.student, row])))
  })
  return byHomework
})

const studentAverages = computed(() =>
  students.value.map(student => {
    const percents = homeworks.value
      .map(homework => gradePercent(student.id, homework))
      .filter((value): value is number => value !== null)
    if (!percents.length) return null
    return Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length)
  }),
)

const homeworkAverages = computed(() =>
  homeworks.value.map(homework => {
    const rows = gradeRows.value[homework.id] ?? []
    const percents = rows
      .filter(row => row.grade !== null && homework.max_grade > 0)
      .map(row => (row.grade! / homework.max_grade) * 100)
    if (!percents.length) return null
    return Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length)
  }),
)

function studentName(student: Student): string {
  return `${student.user.last_name} ${student.user.first_name}`.trim() || student.user.username
}

function gradeFor(studentId: number, homework: Homework): HomeworkGrade | null {
  return gradesByHomeworkAndStudent.value.get(homework.id)?.get(studentId) ?? null
}

function gradePercent(studentId: number, homework: Homework): number | null {
  const row = gradeFor(studentId, homework)
  if (!row || row.grade === null || homework.max_grade <= 0) return null
  return (row.grade / homework.max_grade) * 100
}

function cellLabel(studentId: number, homework: Homework): string {
  const row = gradeFor(studentId, homework)
  if (!row) return '—'
  return String(row.grade ?? '—')
}

function cellClass(studentId: number, homework: Homework): string {
  const percent = gradePercent(studentId, homework)
  if (percent === null) return 'text-gray-300 dark:text-gray-600'
  if (percent > 80) return 'text-success-600 dark:text-success-400'
  if (percent > 60) return 'text-warning-600 dark:text-warning-400'
  return 'text-error-600 dark:text-error-400'
}

function cellTitle(studentId: number, homework: Homework): string {
  const student = students.value.find(row => row.id === studentId)
  const grade = gradeFor(studentId, homework)
  const lines = [`${student ? studentName(student) : ''} · ${homework.description || '—'}`]
  lines.push(
    grade
      ? `${t('statistics.points')}: ${grade.grade ?? '—'} / ${homework.max_grade}`
      : t('statistics.notGraded'),
  )
  if (grade?.comments) lines.push(grade.comments)
  return lines.join('\n')
}

function columnTitle(homework: Homework): string {
  const graded = (gradeRows.value[homework.id] ?? []).filter(row => row.grade !== null).length
  return [
    homework.description || '—',
    `${t('homeworks.dueDate')}: ${formatDate(homework.due_date)}`,
    `${t('homeworks.maxGrade')}: ${homework.max_grade}`,
    `${t('statistics.graded')}: ${graded} / ${students.value.length}`,
  ].join('\n')
}

function formatShortDate(value: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat(currentIntlLocale(), {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
}

function formatDate(value: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat(currentIntlLocale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
}

async function fetchHomeworks(): Promise<Homework[]> {
  const collected: Homework[] = []
  for (let page = 1; page <= MAX_LIST_PAGES; page += 1) {
    const { data } = await getMyClassHomeworksApi({
      class_group: props.classGroupId,
      offering: props.offeringId,
      page,
      page_size: LIST_PAGE_SIZE,
    })
    collected.push(...data.results)
    if (!data.results.length || collected.length >= data.count) break
  }
  return collected.sort(
    (a, b) =>
      a.due_date.localeCompare(b.due_date) ||
      a.created_at.localeCompare(b.created_at) ||
      a.id - b.id,
  )
}

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const [{ data: roster }, homeworkRows] = await Promise.all([
      getStudentsApi({ class_group: props.classGroupId }),
      fetchHomeworks(),
    ])
    students.value = roster
    homeworks.value = homeworkRows
    const entries = await Promise.all(
      homeworkRows.map(async homework => {
        const { data } = await getHomeworkGradesApi(homework.id)
        return [homework.id, data] as const
      }),
    )
    gradeRows.value = Object.fromEntries(entries)
  } catch {
    students.value = []
    homeworks.value = []
    gradeRows.value = {}
    loadError.value = true
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.offeringId, props.classGroupId],
  load,
  { immediate: true },
)
</script>
