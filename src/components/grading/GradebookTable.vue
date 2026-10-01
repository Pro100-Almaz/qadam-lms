<template>
  <div
    ref="root"
    class="overflow-hidden bg-white dark:bg-gray-900"
    :class="embedded ? '' : 'rounded-xl border border-gray-200 dark:border-gray-800'"
  >

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
                  {{ t('assignments.gradebookMeta', { students: studentCount, assignments: columns.length }) }}
                </p>
              </div>
            </th>
            <th
              v-for="column in columns"
              :key="column.assignment.id"
              scope="col"
              class="border-b border-l border-gray-200 p-0 text-center align-bottom dark:border-gray-800"
            >
              <!-- The header is the assignment itself: clicking it opens the
                   edit modal, which is also where deleting lives. Marks are
                   typed straight into the cells below, so there is nothing left
                   for an actions menu to hold. -->
              <button
                type="button"
                class="block w-full overflow-hidden px-2 py-2.5 transition"
                :class="[
                  editTarget(column.assignment.id)
                    ? 'hover:bg-gray-50 dark:hover:bg-white/5'
                    : 'cursor-default',
                  { 'opacity-50': isInactive(column) },
                ]"
                :title="columnTitle(column)"
                @click.stop="requestEdit(column.assignment.id)"
              >
                <span
                  class="mx-auto mb-1 block h-1 w-6 rounded-full"
                  :class="CATEGORY_DOTS[column.assignment.category] ?? 'bg-gray-400'"
                ></span>
                <span class="block truncate text-[11px] font-medium text-gray-700 dark:text-gray-300">
                  {{ formatAcademicDay(column.assignment.date) }}
                </span>
                <span class="block truncate text-[11px] font-normal text-gray-500 dark:text-gray-400">
                  {{ column.assignment.title }}
                </span>
                <span class="block text-[10px] font-normal text-gray-400 dark:text-gray-500">
                  / {{ column.assignment.max_grade }}
                </span>
                <span
                  v-if="isInactive(column)"
                  class="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500"
                >
                  {{ t('assignments.inactive') }}
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
              class="relative border-b border-l border-gray-100 px-2 py-2.5 text-center text-sm font-medium tabular-nums dark:border-gray-800"
              :class="editableCell(column)
                ? 'text-gray-700 dark:text-gray-200'
                : cellClass(rowIndex, column)"
              :title="cellTitle(rowIndex, column)"
              @click.stop
              @focusout="onCellFocusOut(student.id, column.assignment.id, $event)"
            >
              <template v-if="editableCell(column)">
                <!-- Widened while it shows a comment, so the label has room and
                     the (invisible) input under it still catches every click. -->
                <div
                  class="relative mx-auto"
                  :class="showsCommentPreview(student.id, column.assignment.id) ? 'w-[72px]' : 'w-14'"
                >
                  <input
                    :value="draftValue(student.id, column.assignment.id)"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    autocomplete="off"
                    :maxlength="String(column.assignment.max_grade).length"
                    class="h-8 w-full rounded-md border px-2 text-center text-sm font-medium tabular-nums outline-none transition dark:bg-gray-900"
                    :class="inputClass(student.id, column.assignment.id)"
                    :aria-label="cellInputLabel(student.full_name, column.assignment.title)"
                    @input="setDraftValue(student.id, column.assignment.id, keepDigits($event))"
                    @focus="activeCellKey = cellKey(column.assignment.id, student.id)"
                    @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
                    @keydown.esc.prevent="revertCell(student.id, column.assignment.id, $event)"
                  />
                  <!-- A comment with no mark would otherwise be an empty box,
                       indistinguishable from a student nobody has looked at.
                       It stands in for the input — which is still there, just
                       invisible — so only one box shows at a time, and a click
                       or Tab lands in the input and swaps the two back. -->
                  <span
                    v-if="showsCommentPreview(student.id, column.assignment.id)"
                    class="pointer-events-none absolute inset-0 block truncate rounded-md bg-gray-100 px-1.5 text-left text-[11px] font-normal italic leading-8 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                  >
                    {{ draftComment(student.id, column.assignment.id) }}
                  </span>
                  <!-- The mark leaves for the server the moment the cell does,
                       so the cell has to say for itself where it got to. -->
                  <Loader2
                    v-if="isSavingCell(student.id, column.assignment.id)"
                    class="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-brand-500"
                  />
                  <Check
                    v-else-if="isSavedCell(student.id, column.assignment.id)"
                    class="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-success-500"
                  />
                  <!-- A mark that also carries a comment says so. -->
                  <span
                    v-else-if="hasMarkAndComment(student.id, column.assignment.id)"
                    class="pointer-events-none absolute -right-1 top-0.5 h-1.5 w-1.5 rounded-full bg-brand-400"
                    aria-hidden="true"
                  ></span>
                </div>
                <p
                  v-if="cellMessage(student.id, column.assignment.id)"
                  class="mt-1 text-[10px] font-medium text-error-500"
                >
                  {{ cellMessage(student.id, column.assignment.id) }}
                </p>
                <div
                  v-if="showsCommentBox(student.id, column.assignment.id)"
                  class="absolute left-1/2 top-[calc(100%-2px)] z-30 w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
                  @click.stop
                >
                  <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    {{ t('assignments.commentFor', { name: student.full_name }) }}
                  </label>
                  <textarea
                    :value="draftComment(student.id, column.assignment.id)"
                    rows="2"
                    class="w-full resize-none rounded-md border border-gray-300 px-2.5 py-2 text-xs text-gray-700 outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                    :placeholder="t('assignments.commentPlaceholder')"
                    @input="setDraftComment(student.id, column.assignment.id, ($event.target as HTMLTextAreaElement).value)"
                  ></textarea>
                </div>
              </template>
              <template v-else>
                {{ cellLabel(rowIndex, column) }}
              </template>
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

  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, CircleAlert, ClipboardList, Loader2, Users } from 'lucide-vue-next'
import type { AssignmentCategory, HeatmapAssignment } from '@/api/analytics'
import {
  createAssignmentGradeApi,
  deleteSubjectGradeApi,
  getAllOfferingGradesApi,
  updateSubjectGradeApi,
  type OfferingGradesAssignment,
  type SubjectAssignment,
  type SubjectAssignmentCategory,
} from '@/api/subjectAssignments'
import { useClassRoster } from '@/composables/useClassRoster'
import { formatAcademicDay } from '@/utils/gradeDates'
import {
  buildGradeGrid,
  gradeCellKey,
  gridMeans,
  type GradeCellRecord,
  type GradeGrid,
} from '@/utils/offeringGradeGrid'

/**
 * One offering's gradebook: its class down the rows, its assignments across the
 * columns in academic-date order, marks in the cells.
 *
 * The grid is `/offerings/{id}/subject-grades/` — every assignment with its
 * stored grade rows, ids and comments included, in one request — laid over the
 * class roster. The roster is what gives every student a row: a grade list can
 * only ever name the students already graded, so the empty cells a teacher is
 * reading this table for would otherwise be invisible.
 *
 * Cells show the mark in the assignment's own points, not the percentage the
 * heatmap chart paints: this is a register to check a student's mark in, and
 * the points are what was written down.
 *
 * It is also where marks are *entered*. A cell the caller says is writable is
 * an input, saved on its own the moment the teacher leaves it — see "Saving one
 * cell" below. Nothing is staged: there is no save button anywhere on the page,
 * so a mark that is not sent as the cell is left is a mark that is lost.
 */
const props = defineProps<{
  offeringId: number
  /** The offering's class — whose roster gives the grid its rows. */
  classGroupId: number
  subjectName: string
  classGroupName: string
  /**
   * The offering's assignments as the list endpoint returned them. Only a
   * fallback now: the grades response carries the full records itself.
   */
  assignments?: SubjectAssignment[]
  /** Suppresses column actions when the table is used as a read-only register. */
  readOnly?: boolean
  /** Removes the outer card frame when the table already lives inside a panel. */
  embedded?: boolean
  /** The page's filters, passed through so the grid matches what was asked for. */
  category?: SubjectAssignmentCategory | null
  dateFrom?: string
  dateTo?: string
  writableAssignmentIds?: number[]
  /**
   * Inactive assignments are left out unless this is set; shown, they are
   * dimmed so they still read as switched off.
   */
  showInactive?: boolean
  /**
   * Bumped by the parent when this offering's marks changed under it. Reloading
   * on every save school-wide would refetch every visible table instead.
   */
  reloadToken?: number
}>()

const emit = defineEmits<{
  (e: 'edit-assignment', assignment: SubjectAssignment): void
}>()

const { t } = useI18n()

/** A column, paired with its index into the server's matrices. */
interface Column {
  assignment: HeatmapAssignment
  index: number
}

/**
 * Same hues as `AssignmentCategoryBadge`, so a category keeps one colour.
 * Admin-added categories have no hue of their own and fall back to grey.
 */
const CATEGORY_DOTS: Record<AssignmentCategory | (string & {}), string> = {
  lesson: 'bg-blue-light-500',
  exam: 'bg-warning-500',
  final: 'bg-error-500',
  homework: 'bg-purple-500',
}

const data = ref<GradeGrid | null>(null)
/** The full assignment records of the last load, for the edit modal. */
const loadedAssignments = ref<OfferingGradesAssignment[]>([])
const loading = ref(true)
const loadError = ref(false)
const gradeRecords = ref<Record<string, GradeCellRecord>>({})
const draftValues = ref<Record<string, string>>({})
const draftComments = ref<Record<string, string>>({})
const activeCellKey = ref<string | null>(null)
/** Cells with a request in flight, and cells whose last request failed. */
const savingKeys = ref<Record<string, true>>({})
const saveErrors = ref<Record<string, string>>({})
/** Cells showing the "it landed" tick; see `flashSaved`. */
const savedKeys = ref<Record<string, true>>({})
const savedTimers = new Map<string, ReturnType<typeof setTimeout>>()

const students = computed(() => data.value?.students ?? [])
/**
 * Over the columns on screen only: with "Show inactive" off, a hidden
 * assignment's marks do not move anyone's average. Computed, so a saved mark
 * (written into the grid by `applyGradeToGrid`) updates them with no refetch.
 * Unmarked cells are left out, so one mark of 60% averages 60, not 6.
 */
const means = computed(() =>
  data.value
    ? gridMeans(data.value, columns.value.map(column => column.index))
    : { rowMeans: [] as number[], columnMeans: [] as number[] },
)
const rowMeans = computed(() => means.value.rowMeans)
const columnMeans = computed(() => means.value.columnMeans)
const studentCount = computed(() => data.value?.class_size ?? students.value.length)

/**
 * Oldest first. The endpoint lists newest first, so the reading order is
 * imposed here — the index into the matrices is carried along rather than
 * assumed to match.
 */
const columns = computed<Column[]>(() =>
  (data.value?.assignments ?? [])
    .map((assignment, index) => ({ assignment, index }))
    .filter(column => props.showInactive || !isInactive(column))
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
  document.addEventListener('click', closeActiveCell)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  document.removeEventListener('click', closeActiveCell)
  savedTimers.forEach(timer => clearTimeout(timer))
  savedTimers.clear()
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
  () =>
    new Map<number, SubjectAssignment>(
      [...(props.assignments ?? []), ...loadedAssignments.value].map(assignment => [assignment.id, assignment]),
    ),
)

const writableIds = computed(() => new Set(props.writableAssignmentIds ?? []))

/**
 * The grid's own flag, else the list endpoint's copy. A column neither knows
 * about counts as active, so nothing vanishes on a guess.
 */
function isInactive(column: Column): boolean {
  const flag = column.assignment.is_active ?? assignmentById.value.get(column.assignment.id)?.is_active
  return flag === false
}

/** Where each student and assignment sits in the response's matrices. */
const rowIndexByStudent = computed(
  () => new Map(students.value.map((student, index) => [student.id, index])),
)

const columnIndexByAssignment = computed(
  () => new Map((data.value?.assignments ?? []).map((assignment, index) => [assignment.id, index])),
)

const validationErrors = computed<Record<string, string>>(() => {
  const errors: Record<string, string> = {}
  columns.value.forEach(column => {
    students.value.forEach(student => {
      const key = cellKey(column.assignment.id, student.id)
      const raw = (draftValues.value[key] ?? '').trim()
      if (raw === '') return
      const parsed = Number(raw)
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > column.assignment.max_grade) {
        errors[key] = t('assignments.gradeRange', { max: column.assignment.max_grade })
      }
    })
  })
  return errors
})

/** The full record behind a column, or null when the list did not carry it. */
function editTarget(assignmentId: number): SubjectAssignment | null {
  if (props.readOnly) return null
  return assignmentById.value.get(assignmentId) ?? null
}

function requestEdit(assignmentId: number) {
  const assignment = editTarget(assignmentId)
  if (assignment) emit('edit-assignment', assignment)
}

function cellKey(assignmentId: number, studentId: number): string {
  return gradeCellKey(assignmentId, studentId)
}

function editableCell(column: Column): boolean {
  return writableIds.value.has(column.assignment.id)
}

function draftValue(studentId: number, assignmentId: number): string {
  return draftValues.value[cellKey(assignmentId, studentId)] ?? ''
}

function draftComment(studentId: number, assignmentId: number): string {
  return draftComments.value[cellKey(assignmentId, studentId)] ?? ''
}

/**
 * Marks are whole points, so the cell is a text input that only takes digits:
 * no spinner arrows, no wheel or arrow-key nudging, and a pasted "7.5" or "-3"
 * is cleaned in place rather than typed in and then refused.
 */
function keepDigits(event: Event): string {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '')
  if (input.value !== digits) input.value = digits
  return digits
}

function setDraftValue(studentId: number, assignmentId: number, value: string) {
  const key = cellKey(assignmentId, studentId)
  draftValues.value = { ...draftValues.value, [key]: value }
  activeCellKey.value = key
}

function setDraftComment(studentId: number, assignmentId: number, value: string) {
  const key = cellKey(assignmentId, studentId)
  draftComments.value = { ...draftComments.value, [key]: value }
}

function closeActiveCell() {
  activeCellKey.value = null
}

/**
 * The comment box hangs under the cell being edited, from the moment it is
 * focused — a comment may stand on its own, with no mark at all, so it must
 * not wait for one to be typed first.
 */
function showsCommentBox(studentId: number, assignmentId: number): boolean {
  return activeCellKey.value === cellKey(assignmentId, studentId)
}

function hasMarkAndComment(studentId: number, assignmentId: number): boolean {
  return draftValue(studentId, assignmentId).trim() !== ''
    && draftComment(studentId, assignmentId).trim() !== ''
}

/** The input's look: hidden under a comment label, errored, edited, or at rest. */
function inputClass(studentId: number, assignmentId: number): string {
  if (showsCommentPreview(studentId, assignmentId)) return 'border-transparent bg-transparent opacity-0'
  if (cellMessage(studentId, assignmentId)) {
    return 'border-error-300 text-error-600 focus:border-error-400 dark:border-error-500/50 dark:text-error-400'
  }
  if (isDirtyCell(studentId, assignmentId)) {
    return 'border-brand-300 bg-brand-50 text-brand-700 focus:border-brand-500 dark:border-brand-500/50 dark:bg-brand-500/10 dark:text-brand-300'
  }
  return 'border-transparent bg-transparent hover:border-gray-200 focus:border-brand-500 dark:hover:border-gray-700'
}

/** At rest, a cell holding only a comment shows the comment instead of the input. */
function showsCommentPreview(studentId: number, assignmentId: number): boolean {
  if (activeCellKey.value === cellKey(assignmentId, studentId)) return false
  return draftValue(studentId, assignmentId).trim() === ''
    && draftComment(studentId, assignmentId).trim() !== ''
}


function isDirtyCell(studentId: number, assignmentId: number): boolean {
  const key = cellKey(assignmentId, studentId)
  const original = gradeRecords.value[key] ?? { value: '', comments: '' }
  return (draftValues.value[key] ?? '').trim() !== original.value
    || (draftComments.value[key] ?? '').trim() !== original.comments
}

/** What is wrong with the cell: an out-of-range mark, or a save that failed. */
function cellMessage(studentId: number, assignmentId: number): string {
  const key = cellKey(assignmentId, studentId)
  return validationErrors.value[key] ?? saveErrors.value[key] ?? ''
}

function isSavingCell(studentId: number, assignmentId: number): boolean {
  return cellKey(assignmentId, studentId) in savingKeys.value
}

function isSavedCell(studentId: number, assignmentId: number): boolean {
  return cellKey(assignmentId, studentId) in savedKeys.value
}

function cellInputLabel(studentName: string, assignmentTitle: string): string {
  return `${studentName}: ${assignmentTitle}`
}

function resetDrafts() {
  const nextValues: Record<string, string> = {}
  const nextComments: Record<string, string> = {}
  Object.entries(gradeRecords.value).forEach(([key, record]) => {
    nextValues[key] = record.value
    nextComments[key] = record.comments
  })
  draftValues.value = nextValues
  draftComments.value = nextComments
  activeCellKey.value = null
  saveErrors.value = {}
  savedKeys.value = {}
  savedTimers.forEach(timer => clearTimeout(timer))
  savedTimers.clear()
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
  // Every cell has its comment now, read-only ones included.
  const comment = student ? draftComment(student.id, column.assignment.id).trim() : ''
  if (comment) lines.push(`${t('studentGrades.comment')}: ${comment}`)
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

const roster = useClassRoster()

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const [assignments, students] = await Promise.all([
      getAllOfferingGradesApi(props.offeringId, {
        category: props.category || undefined,
        date_from: props.dateFrom || undefined,
        date_to: props.dateTo || undefined,
      }),
      roster.get(props.classGroupId),
    ])
    const { grid, records } = buildGradeGrid(assignments, students)
    loadedAssignments.value = assignments
    data.value = grid
    gradeRecords.value = records
    resetDrafts()
  } catch {
    data.value = null
    loadedAssignments.value = []
    gradeRecords.value = {}
    resetDrafts()
    loadError.value = true
  } finally {
    loading.value = false
  }
}

// ─── Saving one cell ─────────────────────────────────────────────────────────
//
// A mark is saved the moment the teacher leaves the cell — one request per
// cell, rather than one batch for the whole grid. It is more requests, but it
// is the only shape that matches how the table is actually used: a teacher
// types down a column and looks away, and anything that waits for a separate
// "save" press is a mark that quietly never left the browser.

/** How long the tick stays up after a mark lands. */
const SAVED_FLASH_MS = 1500

function flashSaved(key: string) {
  savedKeys.value = { ...savedKeys.value, [key]: true }
  clearTimeout(savedTimers.get(key))
  savedTimers.set(
    key,
    setTimeout(() => {
      const { [key]: _removed, ...rest } = savedKeys.value
      savedKeys.value = rest
      savedTimers.delete(key)
    }, SAVED_FLASH_MS),
  )
}

/**
 * Leaving the cell commits it — but focus moving from the mark into the cell's
 * own comment box is not leaving, or a teacher could never write a comment.
 */
function onCellFocusOut(studentId: number, assignmentId: number, event: FocusEvent) {
  const cell = event.currentTarget as HTMLElement
  const next = event.relatedTarget as Node | null
  if (next && cell.contains(next)) return
  if (activeCellKey.value === cellKey(assignmentId, studentId)) activeCellKey.value = null
  void commitCell(studentId, assignmentId)
}

/** Escape puts the cell back to what the server holds. */
function revertCell(studentId: number, assignmentId: number, event: KeyboardEvent) {
  const key = cellKey(assignmentId, studentId)
  const original = gradeRecords.value[key] ?? { gradeId: null, value: '', comments: '' }
  draftValues.value = { ...draftValues.value, [key]: original.value }
  draftComments.value = { ...draftComments.value, [key]: original.comments }
  const { [key]: _removed, ...rest } = saveErrors.value
  saveErrors.value = rest
  ;(event.target as HTMLInputElement).blur()
}

async function commitCell(studentId: number, assignmentId: number) {
  const key = cellKey(assignmentId, studentId)
  if (key in savingKeys.value || validationErrors.value[key]) return

  const original = gradeRecords.value[key] ?? { gradeId: null, value: '', comments: '' }
  const value = (draftValues.value[key] ?? '').trim()
  const comments = (draftComments.value[key] ?? '').trim()
  if (value === original.value && comments === original.comments) return

  savingKeys.value = { ...savingKeys.value, [key]: true }
  const { [key]: _cleared, ...remainingErrors } = saveErrors.value
  saveErrors.value = remainingErrors

  try {
    // An emptied cell is a mark withdrawn, not a mark of nothing — the row goes.
    // A comment with no mark is still a row, so only both being empty deletes.
    if (value === '' && comments === '') {
      if (original.gradeId !== null) await deleteSubjectGradeApi(original.gradeId)
      setGradeRecord(key, { gradeId: null, value: '', comments: '' })
    } else if (original.gradeId === null) {
      const { data: created } = await createAssignmentGradeApi(assignmentId, {
        student: studentId,
        grade: value === '' ? null : Number(value),
        comments,
      })
      setGradeRecord(key, { gradeId: created.id, value, comments })
    } else {
      await updateSubjectGradeApi(original.gradeId, {
        grade: value === '' ? null : Number(value),
        comments,
      })
      setGradeRecord(key, { gradeId: original.gradeId, value, comments })
    }
    applyGradeToGrid(assignmentId, studentId, value)
    flashSaved(key)
  } catch {
    // The draft keeps what was typed, so the teacher can fix it and leave the
    // cell again rather than retyping a mark the server rejected.
    saveErrors.value = { ...saveErrors.value, [key]: t('assignments.gradeSaveFailed') }
  } finally {
    const { [key]: _done, ...rest } = savingKeys.value
    savingKeys.value = rest
  }
}

/**
 * Records what the server now holds, and normalises the draft to match it — but
 * only where the draft is still the one that was sent. A teacher who typed
 * again while the request was in flight keeps their newer mark, which the next
 * commit then saves over this one.
 */
function setGradeRecord(key: string, record: GradeCellRecord) {
  gradeRecords.value = { ...gradeRecords.value, [key]: record }
  if ((draftValues.value[key] ?? '').trim() === record.value) {
    draftValues.value = { ...draftValues.value, [key]: record.value }
  }
  if ((draftComments.value[key] ?? '').trim() === record.comments) {
    draftComments.value = { ...draftComments.value, [key]: record.comments }
  }
}

/**
 * The grid is built once per load, so a saved mark has to be written
 * back into it by hand — refetching the whole table after every cell would
 * throw away the teacher's place in it.
 */
function applyGradeToGrid(assignmentId: number, studentId: number, value: string) {
  const grid = data.value
  const row = rowIndexByStudent.value.get(studentId)
  const column = columnIndexByAssignment.value.get(assignmentId)
  if (!grid || row === undefined || column === undefined) return

  const assignment = grid.assignments[column]
  const wasGraded = grid.graded[row]?.[column] === true
  const graded = value !== ''
  const raw = graded ? Number(value) : null

  if (grid.raw_grades[row]) grid.raw_grades[row][column] = raw
  if (grid.graded[row]) grid.graded[row][column] = graded
  if (grid.matrix[row]) {
    grid.matrix[row][column] = graded && assignment?.max_grade
      ? (Number(value) / assignment.max_grade) * 100
      : 0
  }
  if (assignment && wasGraded !== graded) {
    assignment.graded_count = Math.max(0, assignment.graded_count + (graded ? 1 : -1))
  }
}

watch(
  () => [
    props.offeringId,
    props.classGroupId,
    props.category,
    props.dateFrom,
    props.dateTo,
    props.reloadToken,
  ],
  load,
  { immediate: true },
)
</script>
