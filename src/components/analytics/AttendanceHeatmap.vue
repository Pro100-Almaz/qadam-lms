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

    <div
      v-if="students.length && slots.length"
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
                v-for="(slot, columnIndex) in slots"
                :key="slot.key"
                scope="col"
                class="border-b border-gray-200 px-1 py-2.5 text-center text-[10px] font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400"
                :title="slotTitle(slot, columnIndex)"
              >
                <span class="block whitespace-nowrap">{{ shortDate(slot.date) }}</span>
                <span class="block font-normal text-gray-400 dark:text-gray-500">
                  {{ formatTimeLabel(slot.time_start) }}
                </span>
              </th>
              <th
                scope="col"
                class="border-b border-l border-gray-200 px-3 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-gray-400"
              >
                {{ t('statistics.attendanceRate') }}
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
                v-for="(slot, columnIndex) in slots"
                :key="slot.key"
                class="border-b border-gray-100 p-0.5 text-center dark:border-gray-800"
              >
                <span
                  class="flex h-8 min-w-[34px] items-center justify-center rounded text-xs font-semibold"
                  :style="cellStyle(rowIndex, columnIndex)"
                  :title="cellTitle(rowIndex, columnIndex)"
                >
                  {{ cellLabel(rowIndex, columnIndex) }}
                </span>
              </td>
              <td
                class="border-b border-l border-gray-100 px-3 py-2 text-center text-xs font-semibold tabular-nums dark:border-gray-800"
                :class="rateTone(rowSummary[rowIndex])"
              >
                {{ formatRate(rowSummary[rowIndex]) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th
                scope="row"
                class="sticky left-0 z-10 bg-gray-50 px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:bg-white/5 dark:text-gray-400"
              >
                {{ t('statistics.attendanceRate') }}
              </th>
              <td
                v-for="(slot, columnIndex) in slots"
                :key="slot.key"
                class="bg-gray-50 px-1 py-2.5 text-center text-[11px] font-semibold tabular-nums dark:bg-white/5"
                :class="rateTone(columnSummary[columnIndex])"
              >
                {{ formatRate(columnSummary[columnIndex], 0) }}
              </td>
              <td class="bg-gray-50 px-3 py-2.5 dark:bg-white/5"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    <p v-else class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
      {{ t('statistics.noRegisters') }}
    </p>

    <div
      v-if="students.length && slots.length"
      class="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-gray-500 dark:text-gray-400"
    >
      <span class="flex items-center gap-1.5">
        <span
          class="flex h-4 w-7 items-center justify-center rounded-sm text-[10px] font-semibold"
          :style="{ backgroundColor: palette.present, color: palette.presentInk }"
          >P</span
        >
        {{ t('statistics.present') }}
      </span>
      <span class="flex items-center gap-1.5">
        <span
          class="flex h-4 w-7 items-center justify-center rounded-sm text-[10px] font-semibold"
          :style="{ backgroundColor: palette.absent, color: palette.absentInk }"
          >A</span
        >
        {{ t('statistics.absent') }}
      </span>
      <span class="flex items-center gap-1.5">
        <span class="h-4 w-7 rounded-sm" :style="hatchStyle"></span>
        {{ t('statistics.legendUnrecorded') }}
      </span>
    </div>

    <p
      v-if="data.truncated"
      class="flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400"
    >
      <TriangleAlert class="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{{ t('statistics.truncatedSlots') }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TriangleAlert } from 'lucide-vue-next'
import type {
  AttendanceCounts,
  AttendanceHeatmapResponse,
  AttendanceSlot,
} from '@/api/analytics'
import { formatTimeLabel, formatTimeRange } from '@/api/schedule'
import { useChartTheme } from '@/components/analytics/chartTheme'

/**
 * A class's register, one column per lesson.
 *
 * Attendance is categorical, so this grid does not use the magnitude ramp the
 * grade heatmaps share — present and absent are opposite outcomes, and a
 * sequential scale would imply one is "more" of the other.
 *
 * The third state is the reason the component exists. A `null` cell means nobody
 * took the register, which is a fact about the teacher, not the student; drawn
 * as an absence it would invent a truancy record. Those cells are hatched, blank
 * and outside both colours, exactly as an ungraded cell is in the mark grids.
 *
 * A column is one (date, session) pair, so a subject taught twice on a Tuesday
 * gets two columns — which is why the header shows the lesson number under the
 * date rather than the date alone.
 */
const props = defineProps<{ data: AttendanceHeatmapResponse }>()

const { t } = useI18n()
const { chrome } = useChartTheme()

const students = computed(() => props.data.students ?? [])
const slots = computed(() => props.data.slots ?? [])
const rowSummary = computed(() => props.data.row_summary ?? [])
const columnSummary = computed(() => props.data.column_summary ?? [])
const palette = computed(() => chrome.value.attendance)

/** A 45° tone-on-tone texture — the channel that survives greyscale and CVD. */
const hatchStyle = computed(() => ({
  backgroundColor: chrome.value.surface,
  backgroundImage: `repeating-linear-gradient(45deg, ${chrome.value.neutral} 0 2px, transparent 2px 6px)`,
}))

function statusOf(rowIndex: number, columnIndex: number) {
  return props.data.matrix?.[rowIndex]?.[columnIndex] ?? null
}

function cellStyle(rowIndex: number, columnIndex: number) {
  const status = statusOf(rowIndex, columnIndex)
  if (status === 'present') {
    return { backgroundColor: palette.value.present, color: palette.value.presentInk }
  }
  if (status === 'absent') {
    return { backgroundColor: palette.value.absent, color: palette.value.absentInk }
  }
  return hatchStyle.value
}

/**
 * A letter, not just a fill. Colour alone would leave the grid unreadable in
 * greyscale and to a red-green reader, and present/absent is exactly the pair
 * those two failure modes collapse.
 */
function cellLabel(rowIndex: number, columnIndex: number): string {
  const status = statusOf(rowIndex, columnIndex)
  if (status === 'present') return t('statistics.presentShort')
  if (status === 'absent') return t('statistics.absentShort')
  return ''
}

function cellTitle(rowIndex: number, columnIndex: number): string {
  const student = students.value[rowIndex]
  const slot = slots.value[columnIndex]
  const status = statusOf(rowIndex, columnIndex)
  const label =
    status === 'present'
      ? t('statistics.present')
      : status === 'absent'
        ? t('statistics.absent')
        : t('statistics.unrecordedCell')

  const when = slot ? `${slot.date} · ${formatTimeRange(slot.time_start, slot.time_end)}` : ''
  return `${student?.full_name ?? ''}\n${when}\n${label}`
}

function slotTitle(slot: AttendanceSlot, columnIndex: number): string {
  return [
    `${slot.date} · ${formatTimeRange(slot.time_start, slot.time_end)}`,
    `${t('statistics.quarter')}: ${slot.quarter}`,
    `${t('statistics.recorded')}: ${columnSummary.value[columnIndex]?.recorded ?? 0} / ${props.data.class_size}`,
  ].join('\n')
}

/** `2025-09-05` → `09-05`: the year is the same for every column on screen. */
function shortDate(date: string): string {
  return date.length >= 10 ? date.slice(5) : date
}

function formatRate(row: AttendanceCounts | undefined, digits = 1): string {
  if (!row?.recorded) return '—'
  return `${row.attendance_rate.toFixed(digits)}%`
}

function rateTone(row: AttendanceCounts | undefined): string {
  if (!row?.recorded) return 'text-gray-400 dark:text-gray-500'
  if (row.attendance_rate >= 90) return 'text-success-600 dark:text-success-500'
  if (row.attendance_rate >= 75) return 'text-gray-700 dark:text-gray-300'
  return 'text-error-600 dark:text-error-500'
}

const tiles = computed(() => {
  const totals = props.data.totals ?? { recorded: 0, present: 0, absent: 0, attendance_rate: 0 }
  const neutral = 'text-gray-800 dark:text-white/90'

  // How many of the cells on screen were ever filled in — the register's own
  // completeness, which caps how much any rate above can be trusted.
  const cells = students.value.length * slots.value.length
  const coverage = cells ? (totals.recorded / cells) * 100 : 0

  // The worst attender is what a teacher opens this grid to find.
  let weakest: { name: string; rate: number } | null = null
  rowSummary.value.forEach((row, index) => {
    if (!row?.recorded) return
    if (!weakest || row.attendance_rate < weakest.rate) {
      weakest = { name: students.value[index]?.short_name ?? '', rate: row.attendance_rate }
    }
  })
  const lowest = weakest as { name: string; rate: number } | null

  return [
    {
      label: t('statistics.attendanceRate'),
      value: formatRate(totals),
      hint: props.data.offering?.class_group ?? '',
      tone: rateTone(totals),
    },
    {
      label: t('statistics.absent'),
      value: String(totals.absent),
      hint: t('statistics.ofRecorded', { count: totals.recorded }),
      tone: totals.absent ? 'text-error-600 dark:text-error-500' : neutral,
    },
    {
      label: t('statistics.lowestAttender'),
      value: lowest ? lowest.name : '—',
      hint: lowest ? `${lowest.rate.toFixed(1)}%` : '',
      tone: neutral,
    },
    {
      label: t('statistics.registerCoverage'),
      value: `${coverage.toFixed(0)}%`,
      hint: t('statistics.slotsCount', { count: props.data.slot_count }),
      tone: coverage < 100 ? 'text-warning-600 dark:text-warning-400' : neutral,
    },
  ]
})
</script>
