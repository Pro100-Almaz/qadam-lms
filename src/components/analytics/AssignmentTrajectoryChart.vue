<template>
  <div class="space-y-4">
    <!-- Summary tiles. The delta is the headline: a mean means little without
         the class it is being measured against. -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        v-for="tile in tiles"
        :key="tile.label"
        class="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800"
      >
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ tile.label }}</p>
        <p class="mt-1 text-lg font-semibold tabular-nums" :class="tile.tone">{{ tile.value }}</p>
        <p v-if="tile.hint" class="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
          {{ tile.hint }}
        </p>
      </div>
    </div>

    <!-- Per category. An exam average and a classwork average are different
         claims, and the line above blends them into one. -->
    <CategoryBreakdown :breakdown="data.summary.by_category" />

    <VueApexCharts
      v-if="points.length"
      type="rangeArea"
      height="340"
      :options="chartOptions"
      :series="series"
    />
    <p v-else class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
      {{ t('common.noData') }}
    </p>

    <p
      v-if="ungradedCount"
      class="flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400"
    >
      <TriangleAlert class="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{{ ungradedWarning }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TriangleAlert } from 'lucide-vue-next'
import VueApexCharts from 'vue3-apexcharts'
import type { AssignmentTrajectoryResponse } from '@/api/analytics'
import CategoryBreakdown from '@/components/analytics/CategoryBreakdown.vue'
import {
  SERIES_CLASS,
  SERIES_STUDENT,
  baseChartOptions,
  useChartTheme,
} from '@/components/analytics/chartTheme'

/**
 * A student's assignments in one subject as a line, over the class's middle
 * half.
 *
 * Everything is a percent of each assignment's own `max_grade`, which is what
 * makes a 41/50 exam and an 18/20 quiz comparable on one axis at all — the raw
 * points only appear in the tooltip, where the scale can be stated.
 *
 * The hard case is an assignment with no mark. It arrives as `percent: 0.0`
 * with `graded: false`, and those two are the *only* thing separating it from a
 * genuine zero. Which way it should be drawn depends on the rule the response
 * was computed under, so the chart follows `grading.missing_grades_as` rather
 * than picking one:
 *
 * - `excluded` — the value never entered the mean, so it is not plotted either.
 *   The line skips it and the tooltip says why.
 * - `zero` — the zero *is* what the mean was taken over, so it is plotted, but
 *   hollow, because it is still not a mark anyone earned.
 */
const props = defineProps<{ data: AssignmentTrajectoryResponse }>()

const { t } = useI18n()
const { chrome } = useChartTheme()

const points = computed(() => props.data.points)

/** Absent, not null, when the caller asked for no class stats. */
const hasClassStats = computed(() => points.value.some(point => point.class_mean !== undefined))

/** Whether the response counted an unmarked assignment as a zero. */
const zeroFilled = computed(() => props.data.grading.missing_grades_as === 'zero')

const ungradedIndices = computed(() =>
  points.value.reduce<number[]>((indices, point, index) => {
    if (!point.graded) indices.push(index)
    return indices
  }, []),
)

const ungradedCount = computed(() => ungradedIndices.value.length)

const ungradedWarning = computed(() =>
  zeroFilled.value
    ? t('statistics.ungradedZeroWarning', { count: ungradedCount.value })
    : t('statistics.ungradedExcludedWarning', { count: ungradedCount.value }),
)

// ─── Series ──────────────────────────────────────────────────────────────────

/** What the student's line plots for one assignment — see the block comment. */
function studentValue(point: (typeof points.value)[number]): number | null {
  if (point.graded) return point.percent
  return zeroFilled.value ? 0 : null
}

const series = computed(() => {
  const built: Record<string, unknown>[] = []

  if (hasClassStats.value) {
    built.push({
      name: t('statistics.classBand'),
      type: 'rangeArea',
      data: points.value.map(point => ({
        x: point.title,
        y: [point.p25 ?? point.class_min ?? 0, point.p75 ?? point.class_max ?? 0],
      })),
    })
    built.push({
      name: t('statistics.classMean'),
      type: 'line',
      data: points.value.map(point => ({ x: point.title, y: point.class_mean ?? null })),
    })
  }

  built.push({
    name: props.data.student.short_name,
    type: 'line',
    data: points.value.map(point => ({ x: point.title, y: studentValue(point) })),
  })

  return built
})

/**
 * Series colours follow the series' job, so they must be listed in the same
 * order the series are built — and that order changes with `include_class_stats`.
 */
const colors = computed(() =>
  hasClassStats.value ? [chrome.value.neutral, SERIES_CLASS, SERIES_STUDENT] : [SERIES_STUDENT],
)

/**
 * Per-point marker overrides for the student's line — Apex's only hook for
 * styling one point differently from its neighbours.
 *
 * Only reachable under `zero`: under `exclude` an ungraded point is `null` and
 * has no marker to override.
 */
const discreteMarkers = computed(() => {
  if (!zeroFilled.value) return []
  const seriesIndex = hasClassStats.value ? 2 : 0
  return ungradedIndices.value.map(dataPointIndex => ({
    seriesIndex,
    dataPointIndex,
    fillColor: chrome.value.surface,
    strokeColor: SERIES_STUDENT,
    size: 6,
    shape: 'circle' as const,
  }))
})

const chartOptions = computed(() => ({
  chart: { ...baseChartOptions(), type: 'rangeArea' },
  colors: colors.value,
  // The band is a wash; the lines sit on top of it at full strength.
  fill: { opacity: hasClassStats.value ? [0.24, 1, 1] : [1] },
  stroke: {
    curve: 'smooth' as const,
    // A stroke on the band would read as a fourth series.
    width: hasClassStats.value ? [0, 2, 2.5] : [2.5],
    dashArray: hasClassStats.value ? [0, 4, 0] : [0],
  },
  markers: {
    size: hasClassStats.value ? [0, 0, 5] : [5],
    strokeWidth: 2,
    strokeColors: chrome.value.surface,
    discrete: discreteMarkers.value,
    hover: { sizeOffset: 3 },
  },
  legend: {
    show: true,
    position: 'top' as const,
    horizontalAlign: 'left' as const,
    fontSize: '12px',
    markers: { width: 10, height: 10, radius: 3 },
    labels: { colors: chrome.value.label },
    itemMargin: { horizontal: 10 },
  },
  dataLabels: { enabled: false },
  grid: {
    borderColor: chrome.value.grid,
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
    // An angled label runs down and to the left of its tick, so the first
    // category overhangs the plot; without the left inset it gets clipped.
    padding: { left: 34, right: 24, bottom: 0 },
  },
  xaxis: {
    type: 'category' as const,
    categories: points.value.map(point => point.title),
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      rotate: -40,
      rotateAlways: true,
      hideOverlappingLabels: false,
      trim: false,
      maxHeight: 110,
      style: { fontSize: '11px', colors: chrome.value.label },
    },
    tooltip: { enabled: false },
  },
  yaxis: {
    // Percent of each assignment's own maximum — a fixed scale, unlike the
    // lesson trajectory's, which reads its ceiling off the offering.
    min: 0,
    max: 100,
    tickAmount: 4,
    labels: {
      style: { fontSize: '11px', colors: chrome.value.label },
      formatter: (value: number) => `${Math.round(value)}%`,
    },
  },
  tooltip: {
    theme: chrome.value.tooltip,
    shared: true,
    intersect: false,
    custom: renderTooltip,
  },
}))

/**
 * Apex hands the tooltip a data-point index; everything worth saying about the
 * point is on the original response, so it is looked up there rather than
 * reassembled from the series.
 */
function renderTooltip({ dataPointIndex }: { dataPointIndex: number }): string {
  const point = points.value[dataPointIndex]
  if (!point) return ''

  const line = (label: string, value: string) =>
    `<div class="flex items-center justify-between gap-6"><span class="text-gray-500 dark:text-gray-400">${label}</span><span class="font-medium tabular-nums text-gray-800 dark:text-white/90">${value}</span></div>`

  const rows: string[] = []
  if (point.graded) {
    rows.push(
      line(
        escape(props.data.student.short_name),
        `${point.percent.toFixed(1)}% · ${point.grade}/${point.max_grade}`,
      ),
    )
  } else {
    rows.push(line(escape(props.data.student.short_name), escape(t('statistics.notGraded'))))
  }
  if (point.class_mean !== undefined) {
    rows.push(line(escape(t('statistics.classMean')), `${point.class_mean.toFixed(1)}%`))
  }
  // rank 0 means "no mark", not "first" — showing it would invert the ranking.
  if (point.rank !== undefined && point.rank > 0 && point.class_size !== undefined) {
    rows.push(line(escape(t('statistics.rank')), `${point.rank} / ${point.class_size}`))
  }
  if (point.graded_class_count !== undefined && point.class_size !== undefined) {
    rows.push(
      line(escape(t('statistics.graded')), `${point.graded_class_count} / ${point.class_size}`),
    )
  }

  const caveat = point.graded
    ? ''
    : `<p class="mt-2 border-t border-gray-200 pt-2 text-[11px] text-warning-600 dark:border-gray-700 dark:text-warning-400">${escape(
        zeroFilled.value ? t('statistics.ungradedZeroPoint') : t('statistics.ungradedExcludedPoint'),
      )}</p>`

  return `
    <div class="rounded-lg bg-white p-3 text-xs shadow-theme-md dark:bg-gray-900">
      <p class="font-semibold text-gray-800 dark:text-white/90">${escape(point.title)}</p>
      <p class="mb-2 text-[11px] text-gray-400 dark:text-gray-500">${escape(point.date)} · ${escape(
        t(`assignments.categories.${point.category}`),
      )}</p>
      <div class="space-y-1">${rows.join('')}</div>
      ${caveat}
    </div>`
}

/** Assignment titles are teacher-entered free text and land in an HTML string. */
function escape(value: string): string {
  return value.replace(
    /[&<>"']/g,
    character =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
  )
}

// ─── Summary tiles ───────────────────────────────────────────────────────────

const tiles = computed(() => {
  const summary = props.data.summary
  const neutral = 'text-gray-800 dark:text-white/90'

  const built = [
    {
      label: t('statistics.studentMean'),
      value: `${summary.student_mean.toFixed(1)}%`,
      hint: t('statistics.overAssignments', { count: summary.graded_count }),
      tone: neutral,
    },
  ]

  if (summary.delta !== null) {
    built.push({
      label: t('statistics.vsClass'),
      value: `${summary.delta >= 0 ? '+' : ''}${summary.delta.toFixed(1)}`,
      hint:
        summary.class_mean !== null
          ? t('statistics.classMeanValue', { value: `${summary.class_mean.toFixed(1)}%` })
          : '',
      tone:
        summary.delta >= 0
          ? 'text-success-600 dark:text-success-500'
          : 'text-error-600 dark:text-error-500',
    })
  }

  built.push({
    label: t('statistics.trend'),
    value: `${summary.trend_slope >= 0 ? '+' : ''}${summary.trend_slope.toFixed(2)}`,
    hint: t('statistics.perAssignment'),
    // Not coloured good/bad: over a handful of assignments the slope swings on
    // one mark, and under `zero` an unmarked stretch tips it negative by itself.
    tone: neutral,
  })

  built.push({
    label: t('statistics.graded'),
    value: `${summary.coverage.graded_count} / ${summary.coverage.possible_count}`,
    hint: t('statistics.gradedShare', { value: summary.coverage.graded_share.toFixed(0) }),
    tone:
      summary.coverage.graded_count < summary.coverage.possible_count
        ? 'text-warning-600 dark:text-warning-400'
        : neutral,
  })

  return built
})
</script>
