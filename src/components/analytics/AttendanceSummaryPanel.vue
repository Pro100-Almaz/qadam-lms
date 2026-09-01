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
        <p class="mt-1 text-lg font-semibold tabular-nums" :class="tile.tone">{{ tile.value }}</p>
        <p v-if="tile.hint" class="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
          {{ tile.hint }}
        </p>
      </div>
    </div>

    <template v-if="totals.recorded">
      <!-- Weekday. The one cut that finds a pattern rather than a total: a
           student who only ever misses Mondays is a different problem from one
           who misses evenly. -->
      <div v-if="weekdayRows.length">
        <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {{ t('statistics.byWeekday') }}
        </p>
        <VueApexCharts type="bar" height="220" :options="weekdayOptions" :series="weekdaySeries" />
      </div>

      <!-- Month, only once there is more than one to compare. -->
      <div v-if="monthRows.length > 1">
        <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {{ t('statistics.byMonth') }}
        </p>
        <VueApexCharts type="line" height="220" :options="monthOptions" :series="monthSeries" />
      </div>

      <!-- Subject -->
      <div
        v-if="data.by_subject?.length"
        class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800"
      >
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="w-full min-w-[480px]">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {{ t('statistics.subject') }}
                </th>
                <th class="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {{ t('statistics.present') }}
                </th>
                <th class="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {{ t('statistics.absent') }}
                </th>
                <th class="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {{ t('statistics.attendanceRate') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in data.by_subject"
                :key="row.offering_id ?? row.subject"
                class="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                <td class="px-4 py-2.5 text-sm text-gray-800 dark:text-white/90">{{ row.subject }}</td>
                <td class="px-4 py-2.5 text-right text-sm tabular-nums text-gray-600 dark:text-gray-400">
                  {{ row.present }}
                </td>
                <td class="px-4 py-2.5 text-right text-sm tabular-nums text-gray-600 dark:text-gray-400">
                  {{ row.absent }}
                </td>
                <td class="px-4 py-2.5 text-right text-sm font-medium tabular-nums" :class="rateTone(row)">
                  {{ row.recorded ? `${row.attendance_rate.toFixed(1)}%` : '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Two class rates on purpose, and they are not the same question. -->
      <p
        v-if="comparison"
        class="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-400"
      >
        <Info class="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          {{
            t('statistics.classRatesNote', {
              pooled: comparison.class_attendance_rate.toFixed(1),
              mean: comparison.class_mean_rate.toFixed(1),
            })
          }}
        </span>
      </p>
    </template>

    <p v-else class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
      {{ t('statistics.noRegisters') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Info } from 'lucide-vue-next'
import VueApexCharts from 'vue3-apexcharts'
import type { AttendanceCounts, AttendanceSummaryResponse } from '@/api/analytics'
import {
  SERIES_STUDENT,
  baseChartOptions,
  useChartTheme,
} from '@/components/analytics/chartTheme'

/**
 * One student's attendance: the totals, then the three cuts the register
 * supports — weekday, month and subject.
 *
 * Every rate here is `present / (present + absent)`, so a slot nobody took the
 * register for counts as neither. That makes `recorded` load-bearing: a row with
 * `recorded: 0` still arrives with `attendance_rate: 0.0`, which reads as a
 * total absence rather than as silence. Nothing in this panel plots a rate
 * without checking `recorded` first — the weekday chart sends those days in as
 * `null` so the bar is missing rather than floor-height, and the tables show a
 * dash.
 */
const props = defineProps<{ data: AttendanceSummaryResponse }>()

const { t } = useI18n()
const { chrome } = useChartTheme()

const totals = computed<AttendanceCounts>(
  () => props.data.totals ?? { recorded: 0, present: 0, absent: 0, attendance_rate: 0 },
)

const comparison = computed(() => props.data.class_comparison ?? null)

const weekdayRows = computed(() => props.data.by_weekday ?? [])
const monthRows = computed(() => props.data.by_month ?? [])

/** Rates are a health signal, so they carry a colour — but only when real. */
function rateTone(row: AttendanceCounts): string {
  if (!row.recorded) return 'text-gray-400 dark:text-gray-500'
  if (row.attendance_rate >= 90) return 'text-success-600 dark:text-success-500'
  if (row.attendance_rate >= 75) return 'text-gray-800 dark:text-white/90'
  return 'text-error-600 dark:text-error-500'
}

// ─── Weekday ─────────────────────────────────────────────────────────────────

/** 0 = Monday, as the API sends it — not JavaScript's Sunday-first weekday. */
const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

/** Weekends only appear once the register says something happened on one. */
const visibleWeekdays = computed(() =>
  weekdayRows.value.filter(row => row.weekday < 5 || row.recorded > 0),
)

const weekdaySeries = computed(() => [
  {
    name: t('statistics.attendanceRate'),
    data: visibleWeekdays.value.map(row => (row.recorded ? Number(row.attendance_rate.toFixed(1)) : null)),
  },
])

const weekdayOptions = computed(() => ({
  chart: { ...baseChartOptions(), type: 'bar' },
  colors: [SERIES_STUDENT],
  plotOptions: { bar: { borderRadius: 4, columnWidth: '48%' } },
  dataLabels: { enabled: false },
  grid: { borderColor: chrome.value.grid, strokeDashArray: 4, xaxis: { lines: { show: false } } },
  xaxis: {
    categories: visibleWeekdays.value.map(row => t(`statistics.weekday_${WEEKDAY_KEYS[row.weekday]}`)),
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { fontSize: '11px', colors: chrome.value.label } },
  },
  yaxis: {
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
    y: {
      formatter: (value: number, { dataPointIndex }: { dataPointIndex: number }) => {
        const row = visibleWeekdays.value[dataPointIndex]
        if (!row?.recorded) return t('statistics.noRegisters')
        return `${value.toFixed(1)}% · ${row.present}/${row.recorded}`
      },
    },
  },
}))

// ─── Month ───────────────────────────────────────────────────────────────────

const monthSeries = computed(() => [
  {
    name: t('statistics.attendanceRate'),
    data: monthRows.value.map(row => (row.recorded ? Number(row.attendance_rate.toFixed(1)) : null)),
  },
])

const monthOptions = computed(() => ({
  chart: { ...baseChartOptions(), type: 'line' },
  colors: [SERIES_STUDENT],
  stroke: { curve: 'smooth' as const, width: 2.5 },
  markers: { size: 4, strokeWidth: 2, strokeColors: chrome.value.surface },
  dataLabels: { enabled: false },
  grid: { borderColor: chrome.value.grid, strokeDashArray: 4, xaxis: { lines: { show: false } } },
  xaxis: {
    categories: monthRows.value.map(row => row.month),
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { fontSize: '11px', colors: chrome.value.label } },
  },
  yaxis: {
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
    y: { formatter: (value: number) => `${value.toFixed(1)}%` },
  },
}))

// ─── Tiles ───────────────────────────────────────────────────────────────────

const tiles = computed(() => {
  const neutral = 'text-gray-800 dark:text-white/90'
  const built = [
    {
      label: t('statistics.attendanceRate'),
      value: totals.value.recorded ? `${totals.value.attendance_rate.toFixed(1)}%` : '—',
      hint: t('statistics.overRecorded', { count: totals.value.recorded }),
      tone: totals.value.recorded ? rateTone(totals.value) : neutral,
    },
    {
      label: t('statistics.present'),
      value: String(totals.value.present),
      hint: props.data.class_group?.name ?? '',
      tone: neutral,
    },
    {
      label: t('statistics.absent'),
      value: String(totals.value.absent),
      hint: t('statistics.lessonsMissed'),
      tone: totals.value.absent ? 'text-error-600 dark:text-error-500' : neutral,
    },
  ]

  if (comparison.value) {
    const delta = comparison.value.delta
    built.push({
      label: t('statistics.vsClass'),
      value: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`,
      // Against the mean of per-student rates, which is what the rank is over.
      hint: t('statistics.rankOf', {
        rank: comparison.value.rank,
        size: comparison.value.class_size,
      }),
      tone: delta >= 0 ? 'text-success-600 dark:text-success-500' : 'text-error-600 dark:text-error-500',
    })
  }

  return built
})
</script>
