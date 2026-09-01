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
        <p class="mt-1 truncate text-lg font-semibold text-gray-800 tabular-nums dark:text-white/90">
          {{ tile.value }}
        </p>
        <p v-if="tile.hint" class="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">{{ tile.hint }}</p>
      </div>
    </div>

    <!-- The grid. A real table, not a canvas: it scrolls, it reads out to a
         screen reader, and a cell can carry a texture a chart library cannot. -->
    <div
      v-if="students.length && topics.length"
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
                v-for="topic in topics"
                :key="topic.key"
                scope="col"
                class="border-b border-gray-200 px-2 py-2.5 text-center text-[11px] font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400"
                :title="topicTitle(topic)"
              >
                <span class="block max-w-[120px] truncate">{{ topic.label }}</span>
                <span v-if="topic.weight" class="block text-[10px] font-normal text-gray-400 dark:text-gray-500">
                  {{ topic.weight }}%
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
                v-for="(topic, columnIndex) in topics"
                :key="topic.key"
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
                class="border-b border-l border-gray-100 px-3 py-2 text-center text-xs font-semibold tabular-nums text-gray-700 dark:border-gray-800 dark:text-gray-300"
              >
                {{ formatValue(rowMeans[rowIndex]) }}
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
                v-for="(mean, columnIndex) in columnMeans"
                :key="columnIndex"
                class="bg-gray-50 px-2 py-2.5 text-center text-xs font-semibold tabular-nums dark:bg-white/5"
                :class="
                  weakestColumn === columnIndex
                    ? 'text-error-600 dark:text-error-400'
                    : 'text-gray-700 dark:text-gray-300'
                "
              >
                {{ formatValue(mean) }}
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
    <div v-if="students.length && topics.length" class="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-gray-500 dark:text-gray-400">
      <span class="flex items-center gap-1.5">
        <span>{{ scale.min }}</span>
        <span
          v-for="(color, index) in ramp.colors"
          :key="index"
          class="h-3 w-6 rounded-sm"
          :style="{ backgroundColor: color }"
        ></span>
        <span>{{ scale.max }}</span>
      </span>
      <span class="flex items-center gap-1.5">
        <span class="h-3 w-6 rounded-sm" :style="hatchStyle"></span>
        {{ t('statistics.legendUngraded') }}
      </span>
      <span class="flex items-center gap-1.5">
        <span class="h-3 w-6 rounded-sm" :style="partialLegendStyle"></span>
        {{ t('statistics.legendPartial') }}
      </span>
    </div>

    <p
      v-if="data.truncated"
      class="flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400"
    >
      <TriangleAlert class="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{{ t('statistics.truncated') }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TriangleAlert } from 'lucide-vue-next'
import type { HeatmapTopic, TopicHeatmapResponse } from '@/api/analytics'
import { magnitudeStep, useChartTheme } from '@/components/analytics/chartTheme'

/**
 * The class against the topics they were marked on.
 *
 * Built as a table rather than a chart library's heatmap for one reason: the
 * interesting cells here are the ones with **no mark behind them**, and those
 * have to look different in kind, not just in colour. Apex paints a value; it
 * cannot hatch a cell. An unmarked cell arrives as a zero-filled `0.0`, which on
 * a sequential ramp is indistinguishable from a genuine fail — the single
 * misreading this whole screen exists to prevent.
 *
 * So: fully unmarked cells are hatched and show a dash, partly marked ones keep
 * their colour but carry the texture over it, and only fully marked cells get a
 * plain swatch.
 */
const props = defineProps<{ data: TopicHeatmapResponse }>()

const { t } = useI18n()
const { chrome } = useChartTheme()

const students = computed(() => props.data.students)
const topics = computed(() => props.data.topics)
const scale = computed(() => props.data.scale)
const rowMeans = computed(() => props.data.row_means ?? [])
const columnMeans = computed(() => props.data.column_means ?? [])

/** How many of a cell's topics carry a real mark, and out of how many. */
function coverageOf(rowIndex: number, columnIndex: number) {
  const graded = props.data.coverage?.[rowIndex]?.[columnIndex] ?? 0
  const total = topics.value[columnIndex]?.topic_count ?? 0
  return { graded, total }
}

function valueOf(rowIndex: number, columnIndex: number): number {
  return props.data.matrix?.[rowIndex]?.[columnIndex] ?? 0
}

/** A 45° tone-on-tone texture — the channel that survives greyscale and CVD. */
const hatchStyle = computed(() => ({
  backgroundColor: chrome.value.surface,
  backgroundImage: `repeating-linear-gradient(45deg, ${chrome.value.neutral} 0 2px, transparent 2px 6px)`,
}))

/** The ramp stepped for the mode in force — see `chartTheme`. */
const ramp = computed(() => chrome.value.magnitude)

const partialLegendStyle = computed(() => ({
  backgroundColor: ramp.value.colors[2],
  backgroundImage: `repeating-linear-gradient(45deg, ${ramp.value.hatch[2]} 0 2px, transparent 2px 6px)`,
}))

function cellStyle(rowIndex: number, columnIndex: number) {
  const { graded, total } = coverageOf(rowIndex, columnIndex)

  // Nothing was marked: there is no magnitude to paint, so the cell shows
  // texture only and stays out of the colour scale entirely.
  if (total > 0 && graded === 0) {
    return { ...hatchStyle.value, color: chrome.value.label }
  }

  const step = magnitudeStep(
    valueOf(rowIndex, columnIndex),
    scale.value.min,
    scale.value.max,
    ramp.value.colors.length,
  )
  const style: Record<string, string> = {
    backgroundColor: ramp.value.colors[step],
    color: ramp.value.inks[step],
  }

  // Part real mark, part zero-fill — keep the colour, add the texture over it.
  if (graded < total) {
    style.backgroundImage = `repeating-linear-gradient(45deg, ${ramp.value.hatch[step]} 0 2px, transparent 2px 6px)`
  }

  return style
}

function cellLabel(rowIndex: number, columnIndex: number): string {
  const { graded, total } = coverageOf(rowIndex, columnIndex)
  if (total > 0 && graded === 0) return '—'
  return valueOf(rowIndex, columnIndex).toFixed(1)
}

function cellTitle(rowIndex: number, columnIndex: number): string {
  const student = students.value[rowIndex]
  const topic = topics.value[columnIndex]
  const { graded, total } = coverageOf(rowIndex, columnIndex)

  const lines = [
    `${student?.full_name ?? ''} · ${topic?.label ?? ''}`,
    `${t('statistics.score')}: ${valueOf(rowIndex, columnIndex).toFixed(1)}`,
    `${t('statistics.graded')}: ${graded} / ${total}`,
  ]
  if (total > 0 && graded === 0) lines.push(t('statistics.cellUngraded'))
  else if (graded < total) lines.push(t('statistics.partialPoint'))
  return lines.join('\n')
}

function topicTitle(topic: HeatmapTopic): string {
  return [
    topic.label,
    `${t('statistics.lessons')}: ${topic.lesson_count}`,
    topic.parent ? `${t('statistics.parentTopic')}: ${topic.parent}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function formatValue(value: number | undefined): string {
  return value === undefined ? '—' : value.toFixed(1)
}

/**
 * The column the class did worst on. Called out because a topic-wide weakness
 * is the finding this grid is read for, and it is easy to miss among the rows.
 */
const weakestColumn = computed(() => {
  if (columnMeans.value.length < 2) return -1
  let lowest = 0
  columnMeans.value.forEach((mean, index) => {
    if (mean < columnMeans.value[lowest]) lowest = index
  })
  return lowest
})

const tiles = computed(() => {
  const means = columnMeans.value
  const weakest = weakestColumn.value >= 0 ? topics.value[weakestColumn.value] : null
  const classMean = means.length
    ? means.reduce((total, mean) => total + mean, 0) / means.length
    : 0

  // Rows where at least one cell is short of a full mark — the count that says
  // how much of this grid is standing on zero-fill.
  const partialCells = students.value.reduce((count, _student, rowIndex) => {
    const shortfall = topics.value.some((_topic, columnIndex) => {
      const { graded, total } = coverageOf(rowIndex, columnIndex)
      return total > 0 && graded < total
    })
    return count + (shortfall ? 1 : 0)
  }, 0)

  return [
    { label: t('statistics.classMean'), value: classMean.toFixed(1), hint: props.data.offering.class_group },
    { label: t('statistics.students'), value: String(props.data.class_size), hint: t('statistics.lessonsCount', { count: props.data.lesson_count }) },
    {
      label: t('statistics.weakestTopic'),
      value: weakest ? weakest.label : '—',
      hint: weakest && means[weakestColumn.value] !== undefined ? means[weakestColumn.value].toFixed(1) : '',
    },
    {
      label: t('statistics.incompleteRows'),
      value: `${partialCells} / ${students.value.length}`,
      hint: t('statistics.incompleteRowsHint'),
    },
  ]
})
</script>
