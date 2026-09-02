<template>
  <div
    ref="root"
    class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
  >
    <!-- One offering's header: the subject is the heading, the class the badge. -->
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="truncate text-base font-semibold text-gray-800 dark:text-white/90">
            {{ subjectName || '—' }}
          </h2>
          <span class="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            {{ classGroupName }}
          </span>
        </div>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {{ t('assignments.gradebookMeta', { students: studentCount, assignments: columns.length }) }}
        </p>
      </div>
      <p v-if="columns.length" class="text-xs text-gray-400 dark:text-gray-500">
        {{ t('assignments.gradebookHint') }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3 p-5">
      <div
        v-for="index in 5"
        :key="index"
        class="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
      ></div>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="px-5 py-10 text-center">
      <CircleAlert class="mx-auto h-8 w-8 text-error-500" />
      <p class="mt-3 text-sm text-error-600 dark:text-error-400">{{ t('assignments.gradingLoadError') }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600"
        @click="load"
      >
        {{ t('assignments.tryAgain') }}
      </button>
    </div>

    <!-- Empty roster -->
    <div v-else-if="!students.length" class="px-5 py-12 text-center">
      <Users class="mx-auto h-8 w-8 text-gray-400" />
      <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('assignments.noStudentsInClass') }}</p>
    </div>

    <!-- No columns -->
    <div v-else-if="!columns.length" class="px-5 py-12 text-center">
      <ClipboardList class="mx-auto h-8 w-8 text-gray-400" />
      <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('assignments.noGradebookColumns') }}</p>
    </div>

    <!-- The gradebook: students down, assignments across in academic-date order. -->
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
              <!-- The inner width is the column's, less its padding: a table
                   cell can still be pushed past a `<col>` width by content that
                   refuses to shrink, and truncating at a fixed width is what
                   holds every gradebook to the same name column. -->
              <span class="block w-[160px] truncate">{{ t('statistics.student') }}</span>
            </th>
            <th
              v-for="column in columns"
              :key="column.assignment.id"
              scope="col"
              class="border-b border-l border-gray-200 p-0 text-center align-bottom dark:border-gray-800"
            >
              <!-- The whole header is the row-actions target: grading, editing
                   and deleting an assignment all hang off its column now that
                   there is no per-assignment row to carry a kebab. -->
              <button
                type="button"
                class="block w-full overflow-hidden px-2 py-2.5 transition"
                :class="menuTarget(column.assignment.id)
                  ? 'hover:bg-gray-50 dark:hover:bg-white/5'
                  : 'cursor-default'"
                :title="columnTitle(column)"
                :aria-haspopup="menuTarget(column.assignment.id) ? 'menu' : undefined"
                :aria-expanded="openAssignmentId === column.assignment.id"
                @click.stop="openMenu(column.assignment.id, $event)"
              >
                <span class="mx-auto mb-1 block h-1 w-6 rounded-full" :class="CATEGORY_DOTS[column.assignment.category]"></span>
                <span class="block truncate text-[11px] font-medium text-gray-700 dark:text-gray-300">
                  {{ formatAcademicDay(column.assignment.date) }}
                </span>
                <span class="block truncate text-[11px] font-normal text-gray-500 dark:text-gray-400">
                  {{ column.assignment.title }}
                </span>
                <span class="block text-[10px] font-normal text-gray-400 dark:text-gray-500">
                  / {{ column.assignment.max_grade }}
                </span>
              </button>
            </th>
            <!-- Blank slots that hold the grid's shape; see MIN_COLUMNS. -->
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
            <!-- Takes the card's leftover width so the columns keep theirs. -->
            <th aria-hidden="true" class="border-b border-gray-200 dark:border-gray-800"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(student, rowIndex) in students"
            :key="student.id"
            class="group hover:bg-gray-50 dark:hover:bg-white/5"
          >
            <!-- The sticky cell paints its own background, so the row's hover
                 has to be repeated on it or it reads as a gap in the row. -->
            <th
              scope="row"
              class="sticky left-0 z-10 border-b border-r border-gray-100 bg-white px-5 py-2.5 text-left text-sm font-normal text-gray-800 group-hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:group-hover:bg-gray-800"
              :title="student.full_name"
            >
              <span class="block w-[160px] truncate">{{ student.full_name }}</span>
            </th>
            <td
              v-for="column in columns"
              :key="column.assignment.id"
              class="border-b border-l border-gray-100 px-2 py-2.5 text-center text-sm font-medium tabular-nums dark:border-gray-800"
              :class="cellClass(rowIndex, column)"
              :title="cellTitle(rowIndex, column)"
            >
              {{ cellLabel(rowIndex, column) }}
            </td>
            <td
              v-for="index in fillerColumns"
              :key="`filler-${index}`"
              aria-hidden="true"
              class="border-b border-l border-gray-100 dark:border-gray-800"
            ></td>
            <td
              class="border-b border-l border-gray-100 px-3 py-2.5 text-center text-sm font-semibold tabular-nums dark:border-gray-800"
              :class="hasAnyGrade(rowIndex)
                ? 'text-gray-700 dark:text-gray-300'
                : 'text-gray-400 dark:text-gray-500'"
              :title="rowMeanTitle(rowIndex)"
            >
              {{ hasAnyGrade(rowIndex) ? `${Math.round(rowMeans[rowIndex] ?? 0)}%` : '—' }}
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
              v-for="column in columns"
              :key="column.assignment.id"
              class="border-l border-gray-100 bg-gray-50 px-2 py-2.5 text-center text-xs font-semibold tabular-nums text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"
            >
              {{ column.assignment.graded_count ? `${Math.round(columnMeans[column.index] ?? 0)}%` : '—' }}
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

    <!-- The endpoint keeps only the most recent columns past its cap, so a long
         range silently loses its oldest assignments unless this is said. -->
    <p
      v-if="!loading && !loadError && data?.truncated"
      class="flex items-start gap-2 border-t border-gray-200 px-5 py-3 text-xs text-warning-700 dark:border-gray-800 dark:text-warning-400"
    >
      <TriangleAlert class="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{{ t('statistics.truncatedAssignments') }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CircleAlert, ClipboardList, TriangleAlert, Users } from 'lucide-vue-next'
import {
  getAssignmentHeatmapApi,
  type AssignmentCategory,
  type AssignmentHeatmapResponse,
  type HeatmapAssignment,
} from '@/api/analytics'
import type { SubjectAssignment, SubjectAssignmentCategory } from '@/api/subjectAssignments'
import { formatAcademicDay } from '@/utils/gradeDates'

/**
 * One offering's gradebook: its class down the rows, its assignments across the
 * columns in academic-date order, marks in the cells.
 *
 * The grid comes from the assignment heatmap endpoint rather than from
 * `/subject-grades/` plus a roster, for two reasons: it is one request instead
 * of two, and it names *every* student in the class, including the ones with no
 * mark at all — a grade list can only ever name the students already graded, so
 * the empty cells that a teacher is reading this table for would be invisible.
 *
 * Cells show the mark in the assignment's own points, not the percentage the
 * heatmap chart paints: this is a register to check a student's mark in, and
 * the points are what was written down.
 */
const props = defineProps<{
  offeringId: number
  subjectName: string
  classGroupName: string
  /**
   * The offering's assignments as the list endpoint returned them, keyed by id.
   * The columns come from the heatmap, but its assignment shape is not the one
   * the form and grading modals take, so the full record is looked up here.
   */
  assignments: SubjectAssignment[]
  /** Whose column menu the page currently has open, for the header's state. */
  openAssignmentId?: number | null
  /** The page's filters, passed through so the grid matches what was asked for. */
  category?: SubjectAssignmentCategory | null
  dateFrom?: string
  dateTo?: string
  /**
   * Bumped by the parent when this offering's marks changed under it. Reloading
   * on every save school-wide would refetch every visible table instead.
   */
  reloadToken?: number
}>()

const emit = defineEmits<{
  (e: 'assignment-menu', assignment: SubjectAssignment, event: MouseEvent): void
}>()

const { t } = useI18n()

/** A column, paired with its index into the server's matrices. */
interface Column {
  assignment: HeatmapAssignment
  index: number
}

/** Same hues as `AssignmentCategoryBadge`, so a category keeps one colour. */
const CATEGORY_DOTS: Record<AssignmentCategory, string> = {
  lesson: 'bg-blue-light-500',
  exam: 'bg-warning-500',
  final: 'bg-error-500',
}

const data = ref<AssignmentHeatmapResponse | null>(null)
const loading = ref(true)
const loadError = ref(false)

const students = computed(() => data.value?.students ?? [])
const rowMeans = computed(() => data.value?.row_means ?? [])
const columnMeans = computed(() => data.value?.column_means ?? [])
const studentCount = computed(() => data.value?.class_size ?? students.value.length)

/**
 * Oldest first. The response's own order is "most recent kept" once it truncates
 * and is not promised beyond that, so the reading order is imposed here — the
 * index into the matrices is carried along rather than assumed to match.
 */
const columns = computed<Column[]>(() =>
  (data.value?.assignments ?? [])
    .map((assignment, index) => ({ assignment, index }))
    .sort(
      (a, b) =>
        a.assignment.date.localeCompare(b.assignment.date) || a.assignment.id - b.assignment.id,
    ),
)

/**
 * Column widths are fixed rather than content-driven. The page stacks one table
 * per offering, and widths that each table works out for itself — a name column
 * sized to its own longest name, grade columns sharing out whatever is left —
 * leave the grids visibly out of step down the page. Pinning them means every
 * gradebook rules its columns in the same places.
 */
const NAME_COLUMN_WIDTH = 200
const AVERAGE_COLUMN_WIDTH = 72
/** The narrowest a grade column is allowed to get; see `gradeColumnWidth`. */
const MIN_GRADE_COLUMN_WIDTH = 80
/** Held to on a card too narrow to fit that many columns, which then scrolls. */
const MIN_GRADE_COLUMNS = 10

/** The card's own width, watched so the grid can be cut to fit it. */
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

/** What the grade columns have to share, once the fixed two have taken theirs. */
const gradeSpace = computed(() =>
  Math.max(0, cardWidth.value - NAME_COLUMN_WIDTH - AVERAGE_COLUMN_WIDTH),
)

/**
 * A gradebook holding one or two assignments would stretch those columns across
 * the whole table and read as a pair of banners rather than a register, so the
 * grid is padded out with blank columns. It is padded to however many the card
 * can hold rather than to a set number, because the surplus has to go somewhere
 * and a single wide column at the end is exactly what the padding is avoiding.
 */
const gradeColumnCount = computed(() =>
  Math.max(MIN_GRADE_COLUMNS, Math.floor(gradeSpace.value / MIN_GRADE_COLUMN_WIDTH)),
)

/**
 * Divided from the count the *card* holds, not from the count this table shows,
 * so a gradebook with more assignments than fit keeps the same column width as
 * the padded ones above and below it — it simply runs off the edge and scrolls.
 */
const gradeColumnWidth = computed(() =>
  Math.max(MIN_GRADE_COLUMN_WIDTH, Math.floor(gradeSpace.value / gradeColumnCount.value)),
)

const displayColumnCount = computed(() =>
  Math.max(columns.value.length, gradeColumnCount.value),
)
const fillerColumns = computed(() => displayColumnCount.value - columns.value.length)

const nameColumnStyle = { width: `${NAME_COLUMN_WIDTH}px` }
const averageColumnStyle = { width: `${AVERAGE_COLUMN_WIDTH}px` }
const gradeColumnStyle = computed(() => ({ width: `${gradeColumnWidth.value}px` }))

/**
 * `table-layout: fixed` is what makes the widths above stick — under the
 * default algorithm a `<col>` width is only a minimum, and a long assignment
 * title or student name still widens its column. Fixed layout in turn needs a
 * floor, or the columns would be squeezed below their widths on a narrow card
 * instead of scrolling.
 */
const tableMinWidth = computed(
  () =>
    `${NAME_COLUMN_WIDTH + displayColumnCount.value * gradeColumnWidth.value + AVERAGE_COLUMN_WIDTH}px`,
)

const assignmentById = computed(
  () => new Map(props.assignments.map(assignment => [assignment.id, assignment])),
)

/** The full record behind a column, or null when the list did not carry it. */
function menuTarget(assignmentId: number): SubjectAssignment | null {
  return assignmentById.value.get(assignmentId) ?? null
}

function openMenu(assignmentId: number, event: MouseEvent) {
  const assignment = menuTarget(assignmentId)
  if (assignment) emit('assignment-menu', assignment, event)
}

function isGraded(rowIndex: number, column: Column): boolean {
  return data.value?.graded?.[rowIndex]?.[column.index] === true
}

function rawGrade(rowIndex: number, column: Column): number | null {
  return data.value?.raw_grades?.[rowIndex]?.[column.index] ?? null
}

function cellLabel(rowIndex: number, column: Column): string {
  if (!isGraded(rowIndex, column)) return '—'
  return String(rawGrade(rowIndex, column) ?? '—')
}

/**
 * Colour is by share of the assignment's own maximum — marks on a 5-point scale
 * and a 100-point scale sit in the same row and cannot be compared raw.
 */
function cellClass(rowIndex: number, column: Column): string {
  if (!isGraded(rowIndex, column)) return 'text-gray-300 dark:text-gray-600'
  const max = column.assignment.max_grade
  const grade = rawGrade(rowIndex, column)
  if (!max || grade === null) return 'text-gray-700 dark:text-gray-300'
  const percent = (grade / max) * 100
  if (percent > 80) return 'text-success-600 dark:text-success-400'
  if (percent > 60) return 'text-warning-600 dark:text-warning-400'
  return 'text-error-600 dark:text-error-400'
}

function cellTitle(rowIndex: number, column: Column): string {
  const student = students.value[rowIndex]
  const lines = [`${student?.full_name ?? ''} · ${column.assignment.title}`]
  lines.push(
    isGraded(rowIndex, column)
      ? `${t('statistics.points')}: ${rawGrade(rowIndex, column)} / ${column.assignment.max_grade}`
      : t('statistics.notGraded'),
  )
  return lines.join('\n')
}

function columnTitle(column: Column): string {
  return [
    column.assignment.title,
    `${t('assignments.date')}: ${column.assignment.date}`,
    `${t('assignments.category')}: ${t(`assignments.categories.${column.assignment.category}`)}`,
    `${t('assignments.maxGrade')}: ${column.assignment.max_grade}`,
    `${t('statistics.graded')}: ${column.assignment.graded_count} / ${studentCount.value}`,
  ].join('\n')
}

/** A row of dashes has a mean of `0.0` that would read as a class of zeroes. */
function hasAnyGrade(rowIndex: number): boolean {
  return columns.value.some(column => isGraded(rowIndex, column))
}

/**
 * The mean's divisor is the marks entered, not the columns shown — a single
 * mark of 60% averages 60, not 60 spread over the term. Said out loud here,
 * because the number alone hides how much is behind it.
 */
function rowMeanTitle(rowIndex: number): string {
  const graded = columns.value.filter(column => isGraded(rowIndex, column)).length
  if (!graded) return t('statistics.notGraded')
  return t('statistics.rowMeanHint', { graded, total: columns.value.length })
}

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const { data: response } = await getAssignmentHeatmapApi(props.offeringId, {
      category: props.category || undefined,
      date_from: props.dateFrom || undefined,
      date_to: props.dateTo || undefined,
    })
    data.value = response
  } catch {
    data.value = null
    loadError.value = true
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.offeringId, props.category, props.dateFrom, props.dateTo, props.reloadToken],
  load,
  { immediate: true },
)
</script>
