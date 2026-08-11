<template>
  <div
    class="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-end dark:border-gray-800 dark:bg-gray-900"
  >
    <!-- Classroom -->
    <label class="block w-full sm:w-52">
      <span class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {{ t('attendance.classroom') }}
      </span>
      <select
        :value="classroomId ?? ''"
        :disabled="!classrooms.length"
        class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        @change="emit('update:classroomId', Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-if="!classrooms.length" value="">—</option>
        <option
          v-for="classroom in classrooms"
          :key="classroom.class_group_id"
          :value="classroom.class_group_id"
        >
          {{ classroom.display_name }}
        </option>
      </select>
    </label>

    <!-- Quarter — jumps the month/week selection into that quarter. -->
    <label v-if="quarters.length" class="block w-full sm:w-40">
      <span class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {{ t('attendance.quarter') }}
      </span>
      <select
        :value="quarter ?? ''"
        class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        @change="emit('update:quarter', Number(($event.target as HTMLSelectElement).value))"
      >
        <!-- The selected week can sit outside every quarter (holidays). -->
        <option v-for="item in quarters" :key="item.quarter" :value="item.quarter">
          {{ t('attendance.quarterN', { n: item.quarter }) }}
        </option>
      </select>
    </label>

    <!-- Month + year -->
    <label class="block w-full sm:w-48">
      <span class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {{ t('attendance.month') }}
      </span>
      <span class="relative block">
        <flat-pickr
          v-model="selectedPeriod"
          :config="monthPickerConfig"
          class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        />
        <CalendarDays class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </span>
    </label>

    <!-- Week -->
    <label class="block w-full sm:w-64">
      <span class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {{ t('attendance.week') }}
      </span>
      <select
        :value="weekId"
        class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        @change="emit('update:weekId', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="week in weeks" :key="week.id" :value="week.id">
          {{ formatWeekRange(week, calendarLocale) }}
        </option>
      </select>
    </label>

    <div class="flex items-center gap-1 sm:ml-auto sm:pb-0.5">
      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white/90"
        :aria-label="t('attendance.previousWeek')"
        @click="emit('shiftWeek', -1)"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>
      <button
        type="button"
        class="h-10 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        @click="emit('goToToday')"
      >
        {{ t('attendance.today') }}
      </button>
      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white/90"
        :aria-label="t('attendance.nextWeek')"
        @click="emit('shiftWeek', 1)"
      >
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import flatPickr from 'vue-flatpickr-component'
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect'
import { Kazakh } from 'flatpickr/dist/l10n/kz'
import { Russian } from 'flatpickr/dist/l10n/ru'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { TeacherClassGroup } from '@/types/teacherDashboard'
import type { QuarterDates } from '@/types/academic'
import {
  formatWeekRange,
  type AttendanceWeek,
  type CalendarLocale,
} from '@/utils/attendanceWeeks'

const props = defineProps<{
  classrooms: TeacherClassGroup[]
  classroomId: number | null
  quarters: QuarterDates[]
  quarter: number | null
  period: string
  weeks: AttendanceWeek[]
  weekId: string
  calendarLocale: CalendarLocale
}>()

const emit = defineEmits<{
  'update:classroomId': [id: number]
  'update:quarter': [quarter: number]
  'update:period': [period: string]
  'update:weekId': [id: string]
  shiftWeek: [direction: number]
  goToToday: []
}>()

const { t, locale } = useI18n()

const selectedPeriod = computed({
  get: () => props.period,
  set: value => emit('update:period', value),
})

const pickerLocale = computed(() =>
  locale.value === 'kz' ? Kazakh : locale.value === 'ru' ? Russian : undefined,
)

const monthPickerConfig = computed(() => ({
  altInput: true,
  allowInput: false,
  disableMobile: true,
  locale: pickerLocale.value,
  plugins: [
    monthSelectPlugin({
      shorthand: false,
      dateFormat: 'Y-m',
      altFormat: 'F Y',
    }),
  ],
}))
</script>
