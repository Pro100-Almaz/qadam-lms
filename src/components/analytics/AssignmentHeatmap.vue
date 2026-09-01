<template>
  <div class="space-y-4">
    <!-- Summary tiles -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        v-for="tile in tiles"
        :key="tile.label"
        class="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800"
      >
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ tile.label }}</p>
        <p class="mt-1 truncate text-lg font-semibold tabular-nums" :class="tile.tone">
          {{ tile.value }}
        </p>
        <p v-if="tile.hint" class="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">
          {{ tile.hint }}
        </p>
      </div>
    </div>

    <!-- The grid. A real table, not a canvas: it scrolls, it reads out to a
         screen reader, and a cell can carry a texture a chart library cannot. -->
    <div
      v-if="students.length && assignments.length"
      class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800"
    >
      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th
                scope="col"
                class="sticky left-0 z-10 border-b border-gray-200 bg-white px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
              >
                {{ t('statistics.student') }}
              </th>
              <th
                v-for="assignment in assignments"
                :key="assignment.id"
                scope="col"
                class="border-b border-gray-200 px-2 py-2.5 text-center text-[11px] font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400"
                :title="assignmentTitle(assignment)"
              >
                <span class="mx-auto mb-0.5 block h-1 w-6 rounded-full" :class="DOTS[assignment.category]"></span>
                <span class="block max-w-[120px] truncate">{{ assignment.title }}</span>
                <span class="block text-[10px] font-normal text-gray-400 dark:text-gray-500">
                  {{ assignment.max_grade }}
                </span>
              </th>
              <th
                scope="col"
                class="border-b border-l border-gray-200 px-3 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-gray-400"
              >
                {{ t('statistics.mean') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(student, rowIndex) in students" :key="student.id">
              <th
                scope="row"
                class="sticky left-0 z-10 whitespace-nowrap border-b border-gray-100 bg-white px-4 py-2 text-left text-sm font-normal text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
                :title="student.full_name"
              >
                {{ student.short_name }}
              </th>
              <td
                v-for="(assignment, columnIndex) in assignments"
                :key="assignment.id"
                class="border-b border-gray-100 p-0.5 text-center dark:border-gray-800"
              >
                <span
                  class="flex h-9 min-w-[52px] items-center justify-center rounded text-xs font-medium tabular-nums"
                  :style="cellStyle(rowIndex, columnIndex)"
                  :title="cellTitle(rowIndex, columnIndex)"
                >
                  {{ cellLabel(rowIndex, columnIndex) }}
                </span>
              </td>
              <td
                class="border-b border-l border-gray-100 px-3 py-2 text-center text-xs font-semibold tabular-nums dark:border-gray-800"
                :class="
                  rowGraded(rowIndex)
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-400 dark:text-gray-500'
                "
                :title="rowMeanTitle(rowIndex)"
              >
                {{ rowGraded(rowIndex) ? `${formatValue(rowMeans[rowIndex])}%` : '—' }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th
                scope="row"
                class="sticky left-0 z-10 bg-gray-50 px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:bg-white/5 dark:text-gray-400"
              >
                {{ t('statistics.mean') }}
              </th>
              <td
                v-for="(assignment, columnIndex) in assignments"
                :key="assignment.id"
                class="bg-gray-50 px-2 py-2.5 text-center text-xs font-semibold tabular-nums dark:bg-white/5"
                :class="
                  weakestColumn === columnIndex
                    ? 'text-error-600 dark:text-error-400'
                    : 'text-gray-700 dark:text-gray-300'
                "
              >
                {{ assignment.graded_count ? `${formatValue(columnMeans[columnIndex])}%` : '—' }}
              </td>
              <td class="bg-gray-50 px-3 py-2.5 dark:bg-white/5"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    <p v-else class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
      {{ t('common.noData') }}
    </p>

    <!-- Legend. The scale is bands, not a gradient, so it is drawn as the same
         five swatches the cells use. -->
    <div
      v-if="students.length && assignments.length"
      class="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-gray-500 dark:text-gray-400"
    >
      <span class="flex items-center gap-1.5">
        <span>{{ scale.min }}%</span>
        <span
          v-for="(color, index) in ramp.colors"
          :key="index"
          class="h-3 w-6 rounded-sm"
          :style="{ backgroundColor: color }"
        ></span>
        <span>{{ scale.max }}%</span>
      </span>
      <span class="flex items-center gap-1.5">
        <span class="h-3 w-6 rounded-sm" :style="hatchStyle"></span>
        {{ t('statistics.legendNotGraded') }}
      </span>
    </div>

    <p
      v-if="data.truncated"
      class="flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400"
    >
      <TriangleAlert class="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{{ t('statistics.truncatedAssignments') }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TriangleAlert } from 'lucide-vue-next'
import type {
  AssignmentCategory,
  AssignmentHeatmapResponse,
  HeatmapAssignment,
} from '@/api/analytics'
import { magnitudeStep, useChartTheme } from '@/components/analytics/chartTheme'

/**
 * A class against the assignments they were set, as percentages of each
 * assignment's own maximum.
 *
 * Built as a table rather than a chart library's heatmap for one reason: the
 * interesting cells here are the ones with **no mark behind them**, and those
 * have to look different in kind, not just in colour. An ungraded cell arrives
 * as `matrix: 0.0` with `graded: false`, and on a sequential ramp a 0.0 is
 * indistinguishable from a genuine fail — the single misreading this grid exists
 * to prevent. So ungraded cells are hatched and show a dash, and never take a
 * colour from the scale.
 *
 * The row and column means come from the server under whichever `missing` rule
 * was asked for, and under the default `exclude` their divisor is the marks
 * entered, not the column count — a row with one mark of 60% means 60, not 30.
 * `rowMeanTitle` spells that out rather than leaving the reader to assume.
 */
const props = defineProps<{ data: AssignmentHeatmapResponse }>()

const { t } = useI18n()
const { chrome } = useChartTheme()

const students = computed(() => props.data.students)
const assignments = computed(() => props.data.assignments)
const scale = computed(() => props.data.scale ?? { min: 0, max: 100 })
const rowMeans = computed(() => props.data.row_means ?? [])
const columnMeans = computed(() => props.data.column_means ?? [])

/** Same hues as `AssignmentCategoryBadge`, so a category keeps one colour. */
const DOTS: Record<AssignmentCategory, string> = {
  lesson: 'bg-blue-light-500',
  exam: 'bg-warning-500',
  final: 'bg-error-500',
}

function isGraded(rowIndex: number, columnIndex: number): boolean {
  return props.data.graded?.[rowIndex]?.[columnIndex] === true
}

function valueOf(rowIndex: number, columnIndex: number): number {
  return props.data.matrix?.[rowIndex]?.[columnIndex] ?? 0
}

function rawOf(rowIndex: number, columnIndex: number): number | null {
  return props.data.raw_grades?.[rowIndex]?.[columnIndex] ?? null
}

/** How many marks a student actually has — the divisor behind their row mean. */
function rowGradedCount(rowIndex: number): number {
  return assignments.value.reduce(
    (count, _assignment, columnIndex) => count + (isGraded(rowIndex, columnIndex) ? 1 : 0),
    0,
  )
}

/** A row with no marks has a mean of `0.0` that means nothing. */
function rowGraded(rowIndex: number): boolean {
  return rowGradedCount(rowIndex) > 0
}

/** A 45° tone-on-tone texture — the channel that survives greyscale and CVD. */
const hatchStyle = computed(() => ({
  backgroundColor: chrome.value.surface,
  backgroundImage: `repeating-linear-gradient(45deg, ${chrome.value.neutral} 0 2px, transparent 2px 6px)`,
}))

/** The ramp stepped for the mode in force — see `chartTheme`. */
const ramp = computed(() => chrome.value.magnitude)

function cellStyle(rowIndex: number, columnIndex: number) {
  // No mark: there is no magnitude to paint, so the cell shows texture only and
  // stays out of the colour scale entirely.
  if (!isGraded(rowIndex, columnIndex)) {
    return { ...hatchStyle.value, color: chrome.value.label }
  }

  const step = magnitudeStep(
    valueOf(rowIndex, columnIndex),
    scale.value.min,
    scale.value.max,
    ramp.value.colors.length,
  )
  return { backgroundColor: ramp.value.colors[step], color: ramp.value.inks[step] }
}

function cellLabel(rowIndex: number, columnIndex: number): string {
  if (!isGraded(rowIndex, columnIndex)) return '—'
  return valueOf(rowIndex, columnIndex).toFixed(0)
}

function cellTitle(rowIndex: number, columnIndex: number): string {
  const student = students.value[rowIndex]
  const assignment = assignments.value[columnIndex]

  const lines = [`${student?.full_name ?? ''} · ${assignment?.title ?? ''}`]
  if (isGraded(rowIndex, columnIndex)) {
    lines.push(`${t('statistics.score')}: ${valueOf(rowIndex, columnIndex).toFixed(1)}%`)
    lines.push(`${t('statistics.points')}: ${rawOf(rowIndex, columnIndex)} / ${assignment?.max_grade ?? '—'}`)
  } else {
    lines.push(t('statistics.notGraded'))
  }
  return lines.join('\n')
}

function rowMeanTitle(rowIndex: number): string {
  const graded = rowGradedCount(rowIndex)
  if (!graded) return t('statistics.notGraded')
  return t('statistics.rowMeanHint', { graded, total: assignments.value.length })
}

function assignmentTitle(assignment: HeatmapAssignment): string {
  return [
    assignment.title,
    `${t('assignments.category')}: ${t(`assignments.categories.${assignment.category}`)}`,
    `${t('assignments.date')}: ${assignment.date}`,
    `${t('assignments.maxGrade')}: ${assignment.max_grade}`,
    `${t('statistics.graded')}: ${assignment.graded_count} / ${props.data.class_size}`,
  ].join('\n')
}

function formatValue(value: number | undefined): string {
  return value === undefined ? '—' : value.toFixed(1)
}

/**
 * The assignment the class did worst on. Called out because a class-wide dip on
 * one task is the finding this grid is read for, and it is easy to miss among
 * the rows. Only marked assignments qualify: an unmarked column's `0.0` would
 * otherwise always win.
 */
const weakestColumn = computed(() => {
  let lowest = -1
  assignments.value.forEach((assignment, index) => {
    if (!assignment.graded_count) return
    if (lowest < 0 || (columnMeans.value[index] ?? 0) < (columnMeans.value[lowest] ?? 0)) {
      lowest = index
    }
  })
  // With one marked column there is no "worst" worth naming.
  return assignments.value.filter(assignment => assignment.graded_count).length > 1 ? lowest : -1
})

const tiles = computed(() => {
  const coverage = props.data.coverage
  const neutral = 'text-gray-800 dark:text-white/90'

  // Over the students who have a mark at all — a row of dashes is not a zero.
  const gradedRows = students.value
    .map((_student, rowIndex) => rowIndex)
    .filter(rowIndex => rowGraded(rowIndex))
  const classMean = gradedRows.length
    ? gradedRows.reduce((total, rowIndex) => total + (rowMeans.value[rowIndex] ?? 0), 0) /
      gradedRows.length
    : 0

  const weakest = weakestColumn.value >= 0 ? assignments.value[weakestColumn.value] : null

  return [
    {
      label: t('statistics.classMean'),
      value: gradedRows.length ? `${classMean.toFixed(1)}%` : '—',
      hint: props.data.offering.class_group,
      tone: neutral,
    },
    {
      label: t('statistics.students'),
      value: String(props.data.class_size),
      hint: t('statistics.assignmentsCount', { count: props.data.assignment_count }),
      tone: neutral,
    },
    {
      label: t('statistics.weakestAssignment'),
      value: weakest ? weakest.title : '—',
      hint:
        weakest && columnMeans.value[weakestColumn.value] !== undefined
          ? `${columnMeans.value[weakestColumn.value].toFixed(1)}%`
          : '',
      tone: neutral,
    },
    {
      label: t('statistics.graded'),
      value: `${coverage?.graded_count ?? 0} / ${coverage?.possible_count ?? 0}`,
      hint: t('statistics.gradedShare', { value: (coverage?.graded_share ?? 0).toFixed(0) }),
      tone:
        coverage && coverage.graded_count < coverage.possible_count
          ? 'text-warning-600 dark:text-warning-400'
          : neutral,
    },
  ]
})
</script>
