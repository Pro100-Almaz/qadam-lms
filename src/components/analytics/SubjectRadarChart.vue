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

    <VueApexCharts
      v-if="axes.length"
      type="radar"
      height="360"
      :options="chartOptions"
      :series="series"
    />
    <p v-else class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
      {{ t('common.noData') }}
    </p>

    <!-- The same numbers as a table. The polygon shows the shape; only this
         shows which axis is a snapshot, and by how much a subject is ahead. -->
    <div v-if="axes.length" class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="w-full min-w-[520px]">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('statistics.subject') }}
              </th>
              <th class="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('statistics.score') }}
              </th>
              <th class="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('statistics.classMean') }}
              </th>
              <th class="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('statistics.percentile') }}
              </th>
              <th class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('statistics.source') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="axis in axes"
              :key="axis.offering_id"
              class="border-b border-gray-100 last:border-0 dark:border-gray-800"
            >
              <td class="px-4 py-2.5">
                <span class="flex items-center gap-2">
                  <span
                    class="h-2 w-2 shrink-0 rounded-full"
                    :style="{ backgroundColor: hasLessons(axis) ? SERIES_STUDENT : 'transparent', boxShadow: hasLessons(axis) ? 'none' : `inset 0 0 0 1.5px ${SERIES_STUDENT}` }"
                  ></span>
                  <span class="text-sm text-gray-800 dark:text-white/90">{{ axis.subject }}</span>
                  <span
                    v-if="axis.letter_grade"
                    class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300"
                  >
                    {{ axis.letter_grade }}
                  </span>
                </span>
              </td>
              <td class="px-4 py-2.5 text-right text-sm tabular-nums text-gray-800 dark:text-white/90">
                <!-- A zero on an axis with no lessons is filler, not a mark. -->
                <span v-if="hasLessons(axis)">{{ axis.value.toFixed(1) }}</span>
                <span v-else class="text-gray-400 dark:text-gray-500">{{ t('statistics.noLessons') }}</span>
              </td>
              <td class="px-4 py-2.5 text-right text-sm tabular-nums text-gray-600 dark:text-gray-400">
                {{ axis.class_mean !== undefined && hasLessons(axis) ? axis.class_mean.toFixed(1) : '—' }}
              </td>
              <td class="px-4 py-2.5 text-right text-sm tabular-nums text-gray-600 dark:text-gray-400">
                {{ axis.percentile !== undefined && hasLessons(axis) ? `${axis.percentile}%` : '—' }}
              </td>
              <td class="px-4 py-2.5">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  :class="
                    axis.source === 'snapshot'
                      ? 'bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/10 dark:text-blue-light-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'
                  "
                >
                  <Lock v-if="axis.source === 'snapshot'" class="h-2.5 w-2.5" />
                  <Activity v-else class="h-2.5 w-2.5" />
                  {{ t(`statistics.source_${axis.source}`) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p
      v-if="emptyAxes.length"
      class="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-400"
    >
      <Info class="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{{ t('statistics.emptyAxes', { subjects: emptyAxes.join(', ') }) }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Activity, Info, Lock } from 'lucide-vue-next'
import VueApexCharts from 'vue3-apexcharts'
import type { RadarAxis, SubjectRadarResponse } from '@/api/analytics'
import {
  SERIES_CLASS,
  SERIES_STUDENT,
  baseChartOptions,
  useChartTheme,
} from '@/components/analytics/chartTheme'

/**
 * Every subject a student takes on one polygon, with the class's polygon behind
 * it.
 *
 * The endpoint keeps the vertex count steady across quarters so the shape stays
 * comparable, which means an axis can be present with no lessons behind it. It
 * arrives as `value: 0`, and a reader will read that as "scored nothing" unless
 * told otherwise — so those axes are named under the chart and their score cell
 * says so rather than showing the zero.
 */
const props = defineProps<{ data: SubjectRadarResponse }>()

const { t } = useI18n()
const { chrome } = useChartTheme()

const axes = computed(() => props.data.axes)

/** An axis with no lessons is "nothing scheduled", not a score of zero. */
function hasLessons(axis: RadarAxis): boolean {
  return axis.lesson_count > 0
}

const emptyAxes = computed(() => axes.value.filter(axis => !hasLessons(axis)).map(axis => axis.subject))

const hasClassMean = computed(() => axes.value.some(axis => axis.class_mean !== undefined))

const series = computed(() => {
  const built = [
    {
      name: props.data.student.short_name,
      data: axes.value.map(axis => Number(axis.value.toFixed(1))),
    },
  ]
  if (hasClassMean.value) {
    built.push({
      name: t('statistics.classMean'),
      data: axes.value.map(axis => Number((axis.class_mean ?? 0).toFixed(1))),
    })
  }
  return built
})

/** The scale's ceiling — radar has no `max_points` of its own to read. */
const maxValue = computed(() => {
  const highest = axes.value.reduce(
    (top, axis) => Math.max(top, axis.value, axis.class_mean ?? 0),
    0,
  )
  return highest > 100 ? Math.ceil(highest / 10) * 10 : 100
})

const chartOptions = computed(() => ({
  chart: { ...baseChartOptions(), type: 'radar', dropShadow: { enabled: false } },
  colors: hasClassMean.value ? [SERIES_STUDENT, SERIES_CLASS] : [SERIES_STUDENT],
  // Two translucent polygons stack; the class's has to stay readable underneath.
  fill: { opacity: hasClassMean.value ? [0.2, 0.1] : [0.2] },
  stroke: { width: hasClassMean.value ? [2.5, 2] : [2.5], dashArray: hasClassMean.value ? [0, 4] : [0] },
  markers: {
    size: 4,
    strokeWidth: 2,
    strokeColors: chrome.value.surface,
    hover: { sizeOffset: 3 },
  },
  legend: {
    show: series.value.length > 1,
    position: 'top' as const,
    horizontalAlign: 'left' as const,
    fontSize: '12px',
    markers: { width: 10, height: 10, radius: 3 },
    labels: { colors: chrome.value.label },
    itemMargin: { horizontal: 10 },
  },
  dataLabels: { enabled: false },
  plotOptions: {
    radar: {
      // Apex sizes a radar from the plot box, and with long subject labels on
      // the axes it can solve to nothing — every label then stacks in the
      // centre and no polygon is drawn. Pinning the radius avoids that.
      size: 130,
      polygons: {
        strokeColors: chrome.value.grid,
        connectorColors: chrome.value.grid,
      },
    },
  },
  xaxis: {
    // An axis with nothing behind it is flagged on its own label, so the
    // polygon's dent is explained where the reader is looking.
    categories: axes.value.map(axis => (hasLessons(axis) ? axis.subject : `${axis.subject} *`)),
    labels: { style: { fontSize: '12px', colors: axes.value.map(() => chrome.value.label) } },
  },
  yaxis: {
    min: 0,
    max: maxValue.value,
    tickAmount: 4,
    labels: { style: { fontSize: '10px', colors: [chrome.value.label] } },
  },
  tooltip: {
    theme: chrome.value.tooltip,
    y: { formatter: (value: number) => value.toFixed(1) },
  },
}))

const tiles = computed(() => {
  const summary = props.data.summary
  return [
    {
      label: t('statistics.overallMean'),
      value: summary.overall_mean.toFixed(1),
      // Drawn axes vs the ones the average could actually use.
      hint: t('statistics.acrossSubjects', {
        used: summary.subject_count,
        total: summary.axis_count,
      }),
    },
    {
      label: t('statistics.classOverall'),
      value: summary.class_overall_mean !== null ? summary.class_overall_mean.toFixed(1) : '—',
      hint: props.data.class_group,
    },
    {
      label: t('statistics.strongest'),
      value: summary.strongest ? summary.strongest.subject : '—',
      hint: summary.strongest ? summary.strongest.value.toFixed(1) : '',
    },
    {
      label: t('statistics.weakest'),
      value: summary.weakest ? summary.weakest.subject : '—',
      hint: summary.weakest ? summary.weakest.value.toFixed(1) : '',
    },
  ]
})
</script>
