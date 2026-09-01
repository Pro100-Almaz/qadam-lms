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

    <!-- At risk. The list this screen is opened for, so it comes before the
         full ranking rather than under it. -->
    <div
      v-if="atRisk.length"
      class="rounded-lg border border-error-200 bg-error-50 px-4 py-3 dark:border-error-500/20 dark:bg-error-500/10"
    >
      <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-error-700 dark:text-error-400">
        <TriangleAlert class="h-3.5 w-3.5" />
        {{ t('statistics.atRisk', { threshold: threshold.toFixed(0) }) }}
      </p>
      <div class="mt-2.5 flex flex-wrap gap-2">
        <span
          v-for="row in atRisk"
          :key="row.student.id"
          class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs dark:bg-gray-900"
          :title="row.student.full_name"
        >
          <span class="text-gray-700 dark:text-gray-300">{{ row.student.short_name }}</span>
          <span class="font-semibold tabular-nums text-error-600 dark:text-error-400">
            {{ row.attendance_rate.toFixed(1) }}%
          </span>
        </span>
      </div>
      <!-- A student with no register rows at all is not here, and that absence
           is itself worth stating — it is not the same as good attendance. -->
      <p v-if="unrecordedCount" class="mt-2.5 text-[11px] text-error-600 dark:text-error-400">
        {{ t('statistics.atRiskExcluded', { count: unrecordedCount }) }}
      </p>
    </div>

    <!-- The class, ranked -->
    <div
      v-if="students.length"
      class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800"
    >
      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="w-full min-w-[520px]">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                #
              </th>
              <th class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('statistics.student') }}
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
              v-for="row in students"
              :key="row.student.id"
              class="border-b border-gray-100 last:border-0 dark:border-gray-800"
            >
              <td class="px-4 py-2.5 text-sm tabular-nums text-gray-400 dark:text-gray-500">
                {{ row.rank }}
              </td>
              <td class="px-4 py-2.5 text-sm text-gray-800 dark:text-white/90" :title="row.student.full_name">
                {{ row.student.short_name }}
              </td>
              <td class="px-4 py-2.5 text-right text-sm tabular-nums text-gray-600 dark:text-gray-400">
                {{ row.present }}
              </td>
              <td class="px-4 py-2.5 text-right text-sm tabular-nums text-gray-600 dark:text-gray-400">
                {{ row.absent }}
              </td>
              <td class="px-4 py-2.5 text-right text-sm font-medium tabular-nums" :class="rateTone(row)">
                <span v-if="row.recorded">{{ row.attendance_rate.toFixed(1) }}%</span>
                <span v-else :title="t('statistics.noRegistersFor')">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <p v-else class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
      {{ t('statistics.noRegisters') }}
    </p>

    <!-- Weekday and subject, as the two cuts that name a cause. -->
    <div v-if="visibleWeekdays.length" class="grid gap-4 lg:grid-cols-2">
      <div>
        <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {{ t('statistics.byWeekday') }}
        </p>
        <VueApexCharts type="bar" height="220" :options="weekdayOptions" :series="weekdaySeries" />
      </div>
      <div v-if="data.by_subject?.length">
        <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {{ t('statistics.bySubject') }}
        </p>
        <div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
          <table class="w-full">
            <tbody>
              <tr
                v-for="row in data.by_subject"
                :key="row.offering_id ?? row.subject"
                class="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                <td class="px-4 py-2 text-sm text-gray-800 dark:text-white/90">{{ row.subject }}</td>
                <td class="px-4 py-2 text-right text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
                  {{ row.present }} / {{ row.recorded }}
                </td>
                <td class="px-4 py-2 text-right text-sm font-medium tabular-nums" :class="rateTone(row)">
                  {{ row.recorded ? `${row.attendance_rate.toFixed(1)}%` : '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TriangleAlert } from 'lucide-vue-next'
import VueApexCharts from 'vue3-apexcharts'
import type { AttendanceCounts, ClassAttendanceOverviewResponse } from '@/api/analytics'
import {
  SERIES_STUDENT,
  baseChartOptions,
  useChartTheme,
} from '@/components/analytics/chartTheme'

/**
 * A whole class group's attendance: the totals, who is falling behind, and the
 * weekday and subject cuts that suggest why.
 *
 * Two totals are reported and they answer different questions.
 * `attendance_rate` is pooled over every register row in the class, so a student
 * with many lessons weighs more; `mean_student_rate` is the average of the
 * per-student rates, which is the one the ranking is taken over. Both are shown,
 * because a gap between them *is* the finding — it means the absences are
 * concentrated in the students with the fullest timetables.
 *
 * `at_risk` omits students with no register rows at all. That is deliberate on
 * the server's side — no rows is no evidence, not a 0% record — but it means the
 * list can understate the problem, so those students are counted underneath it.
 */
const props = defineProps<{ data: ClassAttendanceOverviewResponse }>()

const { t } = useI18n()
const { chrome } = useChartTheme()

const students = computed(() => props.data.students ?? [])
const atRisk = computed(() => props.data.at_risk ?? [])
const threshold = computed(() => props.data.filters?.at_risk_below ?? 90)

/** Enrolled, but nobody has taken a register for them — invisible to `at_risk`. */
const unrecordedCount = computed(() => students.value.filter(row => !row.recorded).length)

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
  (props.data.by_weekday ?? []).filter(row => row.weekday < 5 || row.recorded > 0),
)

const weekdaySeries = computed(() => [
  {
    name: t('statistics.attendanceRate'),
    // A day nobody was registered on is `null`, not a floor-height bar.
    data: visibleWeekdays.value.map(row =>
      row.recorded ? Number(row.attendance_rate.toFixed(1)) : null,
    ),
  },
])

const weekdayOptions = computed(() => ({
  chart: { ...baseChartOptions(), type: 'bar' },
  colors: [SERIES_STUDENT],
  plotOptions: { bar: { borderRadius: 4, columnWidth: '48%' } },
  dataLabels: { enabled: false },
  grid: { borderColor: chrome.value.grid, strokeDashArray: 4, xaxis: { lines: { show: false } } },
  xaxis: {
    categories: visibleWeekdays.value.map(row =>
      t(`statistics.weekday_${WEEKDAY_KEYS[row.weekday]}`),
    ),
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

// ─── Tiles ───────────────────────────────────────────────────────────────────

const tiles = computed(() => {
  const totals = props.data.totals
  const neutral = 'text-gray-800 dark:text-white/90'

  return [
    {
      label: t('statistics.classRate'),
      value: totals?.recorded ? `${totals.attendance_rate.toFixed(1)}%` : '—',
      hint: t('statistics.pooledHint'),
      tone: totals ? rateTone(totals) : neutral,
    },
    {
      label: t('statistics.meanStudentRate'),
      value: totals?.recorded ? `${totals.mean_student_rate.toFixed(1)}%` : '—',
      hint: t('statistics.meanStudentHint'),
      tone: neutral,
    },
    {
      label: t('statistics.absent'),
      value: String(totals?.absent ?? 0),
      hint: t('statistics.ofRecorded', { count: totals?.recorded ?? 0 }),
      tone: totals?.absent ? 'text-error-600 dark:text-error-500' : neutral,
    },
    {
      label: t('statistics.atRiskCount'),
      value: `${atRisk.value.length} / ${totals?.class_size ?? students.value.length}`,
      hint: t('statistics.belowThreshold', { threshold: threshold.value.toFixed(0) }),
      tone: atRisk.value.length ? 'text-error-600 dark:text-error-500' : neutral,
    },
  ]
})
</script>
