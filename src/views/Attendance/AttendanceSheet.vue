<template>
  <AdminLayout>
    <!-- Role mismatch -->
    <div v-if="!canView" class="flex flex-col items-center justify-center gap-4 py-24">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/10">
        <ShieldAlert class="h-8 w-8 text-orange-500" />
      </div>
      <p class="text-base font-medium text-gray-800 dark:text-white/90">
        {{ t('attendance.teachersOnly') }}
      </p>
    </div>

    <!-- Initial load -->
    <div v-else-if="classesLoading" class="flex items-center justify-center py-24">
      <Loader2 class="h-7 w-7 animate-spin text-brand-500" />
    </div>

    <div v-else-if="loadError" class="flex flex-col items-center justify-center gap-4 py-24">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
        <AlertCircle class="h-8 w-8 text-red-500" />
      </div>
      <p class="text-base font-medium text-gray-800 dark:text-white/90">{{ loadError }}</p>
    </div>

    <div v-else class="space-y-5">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-800 dark:text-white/90">{{ t('attendance.title') }}</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('attendance.subtitle') }}</p>
        </div>
        <!-- The registers behind this sheet, read back: the class's grid lesson
             by lesson, or the whole class group ranked. Both name every student,
             which this page's own role gate already allows for. -->
        <StatisticsButton
          v-if="classrooms.length"
          kind="attendance"
          :offerings="statisticsOfferings"
          :class-groups="statisticsClassGroups"
          :default-class-group-id="classroomId"
          :offerings-loading="sheetLoading"
        />
      </div>

      <AttendanceToolbar
        :classrooms="classrooms"
        :classroom-id="classroomId"
        :quarters="quarters"
        :quarter="selectedQuarter"
        :period="period"
        :weeks="weeks"
        :week-id="weekId"
        :calendar-locale="calendarLocale"
        @update:classroom-id="classroomId = $event"
        @update:quarter="onQuarterChange"
        @update:period="onPeriodChange"
        @update:week-id="weekId = $event"
        @shift-week="shiftWeek"
        @go-to-today="goToToday"
      />

      <div
        v-if="!classrooms.length"
        class="rounded-xl border border-gray-200 bg-white px-5 py-16 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
      >
        {{ t('attendance.noClasses') }}
      </div>

      <template v-else>
        <!-- Day summary -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('attendance.students') }}</p>
            <p class="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">{{ students.length }}</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('attendance.weekRange') }}</p>
            <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
              {{ selectedWeek ? formatWeekRange(selectedWeek, calendarLocale) : '—' }}
            </p>
          </div>
          <div class="rounded-xl border border-success-200 bg-success-50 p-4 dark:border-success-500/20 dark:bg-success-500/10">
            <p class="text-xs text-success-700 dark:text-success-400">{{ t('attendance.markedPresent') }}</p>
            <p class="mt-1 text-xl font-semibold text-success-700 dark:text-success-400">{{ dayPresentCount }}</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('attendance.dayRate') }}</p>
            <p class="mt-1 text-xl font-semibold text-gray-700 dark:text-gray-300">{{ dayRate }}%</p>
          </div>
        </div>

        <!-- Day tabs -->
        <div class="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5 custom-scrollbar dark:border-gray-800 dark:bg-gray-900">
          <button
            v-for="day in schoolDays"
            :key="day"
            type="button"
            :class="[
              'flex min-w-[104px] flex-1 flex-col items-center rounded-lg px-3 py-2 text-sm transition',
              day === selectedDay
                ? 'bg-brand-500 text-white shadow-theme-xs'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800',
            ]"
            @click="selectedDay = day"
          >
            <span class="font-medium capitalize">{{ weekdayName(day) }}</span>
            <span :class="['text-xs', day === selectedDay ? 'text-white/80' : 'text-gray-400']">
              {{ formatDayMonth(day) }}
            </span>
          </button>
        </div>

        <!-- Attendance sheet -->
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 class="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-white/90">
                {{ selectedClassroom?.display_name }}
                <span
                  v-if="hasUnsavedChanges"
                  class="rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-medium text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
                >
                  {{ t('attendance.unsaved') }}
                </span>
              </h2>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ t('attendance.legend') }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                :disabled="!students.length || !editableLessons.length"
                class="h-9 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                @click="setAllForDay(true)"
              >
                {{ t('attendance.markAll') }}
              </button>
              <button
                type="button"
                :disabled="!students.length || !editableLessons.length"
                class="h-9 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                @click="setAllForDay(false)"
              >
                {{ t('attendance.clearAll') }}
              </button>
              <button
                type="button"
                :disabled="!canSubmit"
                class="flex h-9 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                @click="submitDay"
              >
                <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
                <Check v-else class="h-4 w-4" />
                {{ t('attendance.submit') }}
              </button>
            </div>
          </div>

          <div v-if="sheetLoading" class="flex min-h-52 items-center justify-center">
            <Loader2 class="h-6 w-6 animate-spin text-brand-500" />
          </div>

          <div
            v-else-if="sheetError"
            class="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center"
          >
            <CircleAlert class="h-7 w-7 text-red-500" />
            <p class="text-sm text-gray-600 dark:text-gray-300">{{ sheetError }}</p>
            <button
              type="button"
              class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              @click="reloadSheet"
            >
              {{ t('attendance.retry') }}
            </button>
          </div>

          <div
            v-else-if="!students.length"
            class="px-5 py-16 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            {{ t('attendance.noStudents') }}
          </div>

          <!-- Holiday weeks sit outside every quarter, so no schedule applies. -->
          <div
            v-else-if="selectedQuarter === null"
            class="px-5 py-16 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            {{ t('attendance.noQuarter') }}
          </div>

          <div
            v-else-if="!scheduledLessons.length"
            class="px-5 py-16 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            {{ t('attendance.noLessons') }}
          </div>

          <div v-else class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="w-full min-w-[900px] border-collapse">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-800">
                  <th
                    class="sticky left-0 z-10 bg-gray-50 px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:bg-gray-800/60 dark:text-gray-400"
                  >
                    {{ t('attendance.studentsColumn') }}
                  </th>
                  <!-- One column per lesson actually scheduled that day, in time order. -->
                  <th
                    v-for="lesson in dayLessons"
                    :key="lesson.sessionId"
                    :class="[
                      'min-w-[100px] border-l border-gray-100 px-2 py-2 text-center text-[11px] font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400',
                      lesson.editable ? 'bg-gray-50 dark:bg-gray-800/60' : 'bg-gray-100/70 dark:bg-gray-800/30',
                    ]"
                  >
                    <span
                      class="block whitespace-nowrap text-sm font-semibold tabular-nums text-gray-600 dark:text-gray-300"
                      :title="formatTimeRange(lesson.timeStart, lesson.timeEnd)"
                    >
                      {{ formatTimeLabel(lesson.timeStart) }}
                    </span>
                    <span
                      class="mt-0.5 block truncate text-[11px] font-normal text-gray-500 dark:text-gray-400"
                      :title="lesson.subjectName"
                    >
                      {{ lesson.subjectName || '—' }}
                    </span>
                    <input
                      v-if="lesson.editable"
                      type="checkbox"
                      class="mt-1.5 h-3.5 w-3.5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
                      :checked="isColumnFull(lesson.sessionId)"
                      :aria-label="`${t('attendance.markColumn')} ${lesson.subjectName}`"
                      @change="toggleColumn(lesson.sessionId, ($event.target as HTMLInputElement).checked)"
                    />
                    <!-- Keeps every header the same height with or without a checkbox. -->
                    <span v-else class="mt-1.5 block h-3.5" aria-hidden="true"></span>
                  </th>
                  <th
                    class="border-l border-gray-100 bg-gray-50 px-3 py-3 text-center text-[11px] font-medium uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400"
                  >
                    {{ t('attendance.total') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="student in students"
                  :key="student.student_id"
                  class="border-b border-gray-100 last:border-0 hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-gray-800/40"
                >
                  <td class="sticky left-0 z-10 bg-white px-5 py-2.5 dark:bg-gray-900">
                    <div class="flex items-center gap-3">
                      <input
                        type="checkbox"
                        class="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
                        :checked="isRowFull(student.student_id)"
                        :aria-label="`${t('attendance.markRow')} ${student.full_name}`"
                        :title="t('attendance.markRow')"
                        @change="toggleRow(student.student_id, ($event.target as HTMLInputElement).checked)"
                      />
                      <img
                        v-if="student.avatar"
                        :src="student.avatar"
                        :alt="student.full_name"
                        class="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                      <span
                        v-else
                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                      >
                        {{ initials(student.full_name) }}
                      </span>
                      <span class="whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white/90">
                        {{ student.full_name }}
                      </span>
                    </div>
                  </td>
                  <td
                    v-for="lesson in dayLessons"
                    :key="lesson.sessionId"
                    :class="[
                      'border-l border-gray-100 px-2 py-2.5 text-center dark:border-gray-800',
                      isPresent(lesson.sessionId, student.student_id)
                        ? 'bg-success-50/60 dark:bg-success-500/5'
                        : '',
                    ]"
                  >
                    <input
                      type="checkbox"
                      :class="[
                        'h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900',
                        lesson.editable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
                      ]"
                      :checked="isPresent(lesson.sessionId, student.student_id)"
                      :disabled="!lesson.editable"
                      :title="lesson.editable ? undefined : t('attendance.otherTeacher')"
                      :aria-label="`${student.full_name} — ${lesson.subjectName}`"
                      @change="setPresent(lesson.sessionId, student.student_id, ($event.target as HTMLInputElement).checked)"
                    />
                  </td>
                  <td class="border-l border-gray-100 px-3 py-2.5 text-center dark:border-gray-800">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {{ rowCount(student.student_id) }}/{{ scheduledLessons.length }}
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/60">
                  <td class="sticky left-0 z-10 bg-gray-50 px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                    {{ t('attendance.presentPerLesson') }}
                  </td>
                  <td
                    v-for="lesson in dayLessons"
                    :key="lesson.sessionId"
                    class="border-l border-gray-100 px-2 py-3 text-center text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-300"
                  >
                    {{ columnCount(lesson.sessionId) }}
                  </td>
                  <td class="border-l border-gray-100 px-3 py-3 text-center text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-300">
                    {{ dayPresentCount }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </template>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertCircle, Check, CircleAlert, Loader2, ShieldAlert } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AttendanceToolbar from '@/components/attendance/AttendanceToolbar.vue'
import StatisticsButton from '@/components/analytics/StatisticsButton.vue'
import type { StatisticsOfferingOption } from '@/components/analytics/ClassStatisticsModal.vue'
import type { StatisticsClassGroupOption } from '@/components/analytics/AttendanceStatisticsModal.vue'
import { useAuth } from '@/composables/useAuth'
import { getTeacherMyClassesApi, getClassStudentsApi } from '@/api/teacherDashboard'
import { getAcademicYearsApi } from '@/api/academic'
import {
  formatTimeLabel,
  formatTimeRange,
  getSubjectSchedulesApi,
  timeToMinutes,
  type SubjectSchedule,
} from '@/api/schedule'
import {
  createSessionAttendanceApi,
  getSessionAttendanceApi,
  updateAttendanceRecordApi,
  type AttendanceStatus,
} from '@/api/attendance'
import { useToast } from '@/composables/useToast'
import type { UserRole } from '@/types/auth'
import type { ClassStudent, TeacherClassGroup } from '@/types/teacherDashboard'
import type { QuarterDates } from '@/types/academic'
import {
  currentPeriod,
  formatDayMonth,
  formatWeekRange,
  formatWeekday,
  parseIsoDate,
  startOfWeek,
  toCalendarLocale,
  toIsoDate,
  weeksOfMonth,
} from '@/utils/attendanceWeeks'

const { t, locale } = useI18n()
const { user } = useAuth()
const toast = useToast()

const roles = computed(() => user.value?.roles)
const canView = computed(() =>
  (['teacher', 'homeroom_teacher'] as UserRole[]).some(role => roles.value?.includes(role)),
)

const calendarLocale = computed(() => toCalendarLocale(locale.value))

/** One page has to cover a class group's whole quarter / a lesson's whole day. */
const PAGE_SIZE = 200
/** The API writes one attendance row at a time, so a sheet is many small calls. */
const WRITE_CONCURRENCY = 6

const classesLoading = ref(true)
const sheetLoading = ref(false)
const submitting = ref(false)
const loadError = ref<string | null>(null)
/** Sheet-level failure — leaves the toolbar usable so another day can be picked. */
const sheetError = ref<string | null>(null)
/** Dates with edits that have not been submitted yet. */
const unsavedDays = ref<Set<string>>(new Set())

const classrooms = ref<TeacherClassGroup[]>([])
const classroomId = ref<number | null>(null)
const students = ref<ClassStudent[]>([])
const schedules = ref<SubjectSchedule[]>([])

const period = ref(currentPeriod())
const weeks = computed(() => weeksOfMonth(period.value))
const weekId = ref(toIsoDate(startOfWeek(new Date())))
const selectedDay = ref('')

/** Term dates of the active academic year; empty if the backend doesn't send them. */
const quarters = ref<QuarterDates[]>([])
const academicYearId = ref<number | null>(null)

const selectedClassroom = computed(
  () => classrooms.value.find(item => item.class_group_id === classroomId.value) ?? null,
)
/** Free entries belong to the class group, so its homeroom teacher marks them. */
const isHomeroomOfSelected = computed(() => selectedClassroom.value?.is_homeroom === true)
const selectedWeek = computed(
  () => weeks.value.find(week => week.id === weekId.value) ?? weeks.value[0],
)
const schoolDays = computed(() => selectedWeek.value?.days.slice(0, 5) ?? [])

/** Term dates are optional on the backend — only dated quarters can be matched. */
type DatedQuarter = QuarterDates & { start: string; end: string }

const datedQuarters = computed(() =>
  quarters.value.filter((item): item is DatedQuarter => Boolean(item.start && item.end)),
)

/**
 * The quarter the visible week belongs to. Quarters rarely start on a Monday,
 * so a week can straddle a boundary: match the selected day first, and fall
 * back to any quarter the week overlaps.
 */
const weekQuarter = computed(() => {
  const day = selectedDay.value
  const exact = day && datedQuarters.value.find(item => day >= item.start && day <= item.end)
  if (exact) return exact.quarter

  const week = selectedWeek.value
  if (!week) return null
  return (
    datedQuarters.value.find(item => week.start <= item.end && week.end >= item.start)?.quarter ??
    null
  )
})

/** Set by the select; cleared again as soon as the dates can answer for themselves. */
const quarterOverride = ref<number | null>(null)
/** `current_quarter` of the active year — the fallback when no term dates exist. */
const currentQuarter = ref<number | null>(null)

/**
 * Which schedules the sheet is built from. Prefers the week's own quarter so the
 * value always agrees with what's on screen, but stays selectable when the
 * backend sends quarters without dates.
 */
const selectedQuarter = computed(
  () =>
    quarterOverride.value ??
    weekQuarter.value ??
    currentQuarter.value ??
    quarters.value[0]?.quarter ??
    null,
)

/**
 * The offerings the register grid may be asked for — the caller's own lessons
 * in the class on screen. `other_sessions` are deliberately not here: those are
 * another teacher's lessons, shown read-only on the sheet, and the analytics
 * endpoint would 403 them.
 *
 * Deduplicated, because `schedules` holds one row per quarter and a subject
 * taught all year appears in each.
 */
const statisticsOfferings = computed<StatisticsOfferingOption[]>(() => {
  const seen = new Map<number, StatisticsOfferingOption>()
  for (const schedule of schedules.value) {
    // A free entry — a break, a club — has no offering to run analytics over.
    if (schedule.offering_id === null || !schedule.offering) continue
    if (seen.has(schedule.offering_id)) continue
    seen.set(schedule.offering_id, {
      offeringId: schedule.offering_id,
      label: schedule.title || schedule.offering.subject_name,
      sublabel: schedule.class_group?.name ?? schedule.offering.class_group_name,
    })
  }
  return [...seen.values()]
})

/** Every class the caller teaches — the overview aggregates all their subjects. */
const statisticsClassGroups = computed<StatisticsClassGroupOption[]>(() =>
  classrooms.value.map(classroom => ({
    classGroupId: classroom.class_group_id,
    label: classroom.display_name,
  })),
)

/**
 * A column of the sheet — one lesson actually on the timetable that day. It is
 * either the caller's own (markable) or another teacher's (shown, read-only).
 */
interface DayLesson {
  sessionId: number
  /** `"09:00:00"`. Lessons are placed by time, so the range names the column. */
  timeStart: string
  timeEnd: string
  subjectName: string
  editable: boolean
}

/** Backend weekday of an ISO date: 0 = Monday … 6 = Sunday. */
function apiWeekdayOf(iso: string): number {
  return (parseIsoDate(iso).getDay() + 6) % 7
}

/**
 * The day's lessons in time order. `sessions` are the caller's own and
 * `other_sessions` the rest of the class group's timetable, so a lesson taken
 * by another teacher still shows its subject and marks — just not editable.
 *
 * Free entries now belong to the class group, so they arrive as schedules of
 * their own rather than only as foreign sessions: a break is a column like any
 * other, markable by the homeroom teacher who owns it.
 */
const dayLessons = computed<DayLesson[]>(() => {
  if (!selectedDay.value) return []
  const weekday = apiWeekdayOf(selectedDay.value)

  const byId = new Map<number, DayLesson>()
  for (const schedule of schedules.value) {
    for (const session of schedule.other_sessions ?? []) {
      if (session.weekday !== weekday) continue
      byId.set(session.id, {
        sessionId: session.id,
        timeStart: session.time_start,
        timeEnd: session.time_end,
        subjectName: session.subject_name,
        editable: false,
      })
    }
  }
  // Own lessons go in last: a session reachable both ways is the editable one,
  // and every schedule repeats the others under `other_sessions`.
  for (const schedule of schedules.value) {
    for (const session of schedule.sessions ?? []) {
      if (session.weekday !== weekday) continue
      byId.set(session.id, {
        sessionId: session.id,
        timeStart: session.time_start,
        timeEnd: session.time_end,
        subjectName: schedule.title || schedule.description || '',
        editable: schedule.type === 'other' ? isHomeroomOfSelected.value : true,
      })
    }
  }

  return [...byId.values()].sort(
    (a, b) =>
      timeToMinutes(a.timeStart) - timeToMinutes(b.timeStart) ||
      timeToMinutes(a.timeEnd) - timeToMinutes(b.timeEnd),
  )
})

/** Every lesson of the day — what attendance is loaded and counted for. */
const scheduledLessons = computed(() => dayLessons.value)

/** Lessons the caller may actually mark and submit. */
const editableLessons = computed(() =>
  scheduledLessons.value.filter(lesson => lesson.editable),
)

/** `${date}|${sessionId}|${studentId}` → present. What the checkboxes read. */
const marks = ref<Record<string, boolean>>({})
/** Same key → the row already on the backend, so submitting knows POST from PATCH. */
const saved = ref<Record<string, { id: number; status: AttendanceStatus }>>({})

function cellKey(sessionId: number, studentId: number, date = selectedDay.value): string {
  return `${date}|${sessionId}|${studentId}`
}

function isPresent(sessionId: number, studentId: number): boolean {
  return marks.value[cellKey(sessionId, studentId)] === true
}

async function loadClasses(): Promise<void> {
  classesLoading.value = true
  loadError.value = null
  try {
    const { data } = await getTeacherMyClassesApi()
    classrooms.value = Array.isArray(data) ? data : []
    if (classrooms.value.length) {
      const homeroom = classrooms.value.find(item => item.is_homeroom)
      classroomId.value = (homeroom ?? classrooms.value[0]).class_group_id
    }
  } catch {
    loadError.value = t('attendance.loadFailed')
  } finally {
    classesLoading.value = false
  }
}

/** Optional extra: without it the quarter select simply doesn't render. */
async function loadQuarters(): Promise<void> {
  try {
    const { data } = await getAcademicYearsApi()
    const active = data.find(year => year.is_active)
    academicYearId.value = active?.id ?? null
    currentQuarter.value = active?.current_quarter ?? null
    quarters.value = active?.quarters ?? []
  } catch {
    quarters.value = []
  }
}

async function loadStudents(): Promise<void> {
  const classGroup = classroomId.value
  if (!classGroup) return

  sheetLoading.value = true
  loadError.value = null
  try {
    const { data } = await getClassStudentsApi(classGroup)
    students.value = data.students ?? []
  } catch {
    students.value = []
    loadError.value = t('attendance.loadFailed')
  } finally {
    sheetLoading.value = false
  }
}

/** Every subject the class group is taught that quarter, with its weekly sessions. */
async function loadSchedules(): Promise<void> {
  const classGroup = classroomId.value
  if (!classGroup || selectedQuarter.value === null) {
    schedules.value = []
    console.log('No class group or quarter selected, skipping schedule load.')
    return
  }
  sheetLoading.value = true
  sheetError.value = null
  try {
    const { data } = await getSubjectSchedulesApi({
      class_group: classGroup,
      quarter: selectedQuarter.value,
      academic_year: academicYearId.value ?? undefined,
      page_size: PAGE_SIZE,
    })
    schedules.value = data
  } catch {
    schedules.value = []
    sheetError.value = t('attendance.loadFailed')
  } finally {
    sheetLoading.value = false
  }
}

/**
 * Attendance is fetched per lesson, so one day is one request per column.
 * Days with unsubmitted edits are left alone rather than overwritten.
 */
async function loadDay(): Promise<void> {
  const date = selectedDay.value
  // Other teachers' lessons are fetched too — they're displayed, just not editable.
  const lessons = scheduledLessons.value
  if (!date || !lessons.length || unsavedDays.value.has(date)) return

  sheetLoading.value = true
  sheetError.value = null
  try {
    const responses = await Promise.all(
      lessons.map(lesson =>
        getSessionAttendanceApi(lesson.sessionId, { date, page_size: PAGE_SIZE }),
      ),
    )
    const nextMarks = { ...marks.value }
    const nextSaved = { ...saved.value }
    for (const key of Object.keys(nextMarks)) if (key.startsWith(`${date}|`)) delete nextMarks[key]
    for (const key of Object.keys(nextSaved)) if (key.startsWith(`${date}|`)) delete nextSaved[key]
    responses.forEach(({ data }, index) => {
      const { sessionId } = lessons[index]
      for (const record of data) {
        const key = cellKey(sessionId, record.student, date)
        nextSaved[key] = { id: record.id, status: record.status }
        nextMarks[key] = record.status === 'present'
      }
    })
    marks.value = nextMarks
    saved.value = nextSaved
  } catch {
    sheetError.value = t('attendance.loadFailed')
  } finally {
    sheetLoading.value = false
  }
}

/** The day is normally refetched by the `dayKey` watcher; a retry has to ask. */
async function reloadSheet(): Promise<void> {
  await loadSchedules()
  await loadDay()
}

onMounted(async () => {
  if (!canView.value) {
    classesLoading.value = false
    return
  }
  await loadClasses()
  // Schedules need a quarter, so loading them is left to the `selectedQuarter`
  // watcher — it fires as soon as the quarters resolve.
  await Promise.all([loadStudents(), loadQuarters()])
})

watch(classroomId, (next, previous) => {
  if (classesLoading.value || next === previous) return
  // Marks belong to the class that was on screen — keeping them would both show
  // the wrong sheet and make `loadDay` skip the new class's dates as "unsaved".
  marks.value = {}
  saved.value = {}
  unsavedDays.value = new Set()
  loadStudents()
  loadSchedules()
})

watch(selectedQuarter, (next, previous) => {
  if (classesLoading.value || next === previous) return
  loadSchedules()
})

// Once the visible week identifies a quarter by itself, the explicit pick is
// redundant — dropping it keeps the select in step with the week navigation.
watch(weekId, () => {
  if (weekQuarter.value !== null) quarterOverride.value = null
})

// Keep the week selection inside the picked month, and the day inside the week.
watch(weeks, list => {
  if (!list.some(week => week.id === weekId.value)) weekId.value = list[0].id
})
watch(
  schoolDays,
  days => {
    if (!days.includes(selectedDay.value)) selectedDay.value = days[0] ?? ''
  },
  { immediate: true },
)

// One watcher for both, so switching day and loading schedules can't double-fetch.
const dayKey = computed(
  () => `${selectedDay.value}|${scheduledLessons.value.map(lesson => lesson.sessionId).join(',')}`,
)
watch(dayKey, () => {
  loadDay()
})

function markDirty(): void {
  unsavedDays.value = new Set(unsavedDays.value).add(selectedDay.value)
}

function setPresent(sessionId: number, studentId: number, value: boolean): void {
  marks.value = { ...marks.value, [cellKey(sessionId, studentId)]: value }
  markDirty()
}

function toggleColumn(sessionId: number, value: boolean): void {
  const next = { ...marks.value }
  for (const student of students.value) next[cellKey(sessionId, student.student_id)] = value
  marks.value = next
  markDirty()
}

/** Marks every markable lesson of the selected day for one student. */
function toggleRow(studentId: number, value: boolean): void {
  const next = { ...marks.value }
  for (const lesson of editableLessons.value) next[cellKey(lesson.sessionId, studentId)] = value
  marks.value = next
  markDirty()
}

function setAllForDay(value: boolean): void {
  const next = { ...marks.value }
  for (const student of students.value) {
    for (const lesson of editableLessons.value) {
      next[cellKey(lesson.sessionId, student.student_id)] = value
    }
  }
  marks.value = next
  markDirty()
}

const hasUnsavedChanges = computed(() => unsavedDays.value.has(selectedDay.value))

const canSubmit = computed(
  () =>
    !submitting.value &&
    !sheetLoading.value &&
    !sheetError.value &&
    hasUnsavedChanges.value &&
    classroomId.value !== null &&
    students.value.length > 0 &&
    editableLessons.value.length > 0,
)

/** Small pool so a full sheet doesn't fire hundreds of requests at once. */
async function runQueued(tasks: Array<() => Promise<unknown>>): Promise<number> {
  let cursor = 0
  let failed = 0
  const workers = Array.from({ length: Math.min(WRITE_CONCURRENCY, tasks.length) }, async () => {
    while (cursor < tasks.length) {
      const task = tasks[cursor]
      cursor += 1
      try {
        await task()
      } catch {
        failed += 1
      }
    }
  })
  await Promise.all(workers)
  return failed
}

/**
 * There is no bulk write, so the day is saved cell by cell: rows that don't
 * exist yet are created, rows whose status changed are patched, the rest skipped.
 */
async function submitDay(): Promise<void> {
  if (!canSubmit.value || classroomId.value === null) return
  const date = selectedDay.value
  submitting.value = true

  const tasks: Array<() => Promise<unknown>> = []
  for (const lesson of editableLessons.value) {
    for (const student of students.value) {
      const key = cellKey(lesson.sessionId, student.student_id, date)
      const status: AttendanceStatus = marks.value[key] ? 'present' : 'absent'
      const existing = saved.value[key]
      if (!existing) {
        tasks.push(() =>
          createSessionAttendanceApi(lesson.sessionId, {
            student: student.student_id,
            date,
            status,
          }),
        )
      } else if (existing.status !== status) {
        tasks.push(() => updateAttendanceRecordApi(existing.id, { status }))
      }
    }
  }

  const failed = await runQueued(tasks)
  submitting.value = false

  // Clear the flag first so the reload below is allowed to overwrite the day.
  const remaining = new Set(unsavedDays.value)
  remaining.delete(date)
  unsavedDays.value = remaining
  await loadDay()

  if (failed) toast.error(t('attendance.submitFailed'), t('attendance.submitPartial', { n: failed }))
  else toast.success(t('attendance.submitted'), formatDayMonth(date))
}

function isColumnFull(sessionId: number): boolean {
  return (
    students.value.length > 0 &&
    students.value.every(student => isPresent(sessionId, student.student_id))
  )
}

function columnCount(sessionId: number): number {
  return students.value.filter(student => isPresent(sessionId, student.student_id)).length
}

/** Counts every lesson on screen, including other teachers' — it's what's shown. */
function rowCount(studentId: number): number {
  return scheduledLessons.value.filter(lesson => isPresent(lesson.sessionId, studentId)).length
}

/** Drives the row checkbox, so it tracks only the lessons that toggle. */
function isRowFull(studentId: number): boolean {
  return (
    editableLessons.value.length > 0 &&
    editableLessons.value.every(lesson => isPresent(lesson.sessionId, studentId))
  )
}

const dayPresentCount = computed(() =>
  students.value.reduce((total, student) => total + rowCount(student.student_id), 0),
)

const dayRate = computed(() => {
  const cells = students.value.length * scheduledLessons.value.length
  return cells === 0 ? 0 : Math.round((dayPresentCount.value / cells) * 100)
})

function onPeriodChange(value: string): void {
  period.value = value || currentPeriod()
}

/**
 * Lands on today when it falls inside the quarter, otherwise on its first week.
 * Quarters can come back without dates, in which case the pick only re-filters
 * the schedules and the week selection is left where it is.
 */
function onQuarterChange(value: number): void {
  quarterOverride.value = value
  const target = quarters.value.find(item => item.quarter === value)
  if (!target?.start || !target.end) return

  const today = new Date()
  const iso = toIsoDate(today)
  const landing = iso >= target.start && iso <= target.end ? today : parseIsoDate(target.start)
  period.value = currentPeriod(landing)
  weekId.value = toIsoDate(startOfWeek(landing))
}

function shiftWeek(direction: number): void {
  const current = selectedWeek.value
  if (!current) return
  const monday = parseIsoDate(current.start)
  monday.setDate(monday.getDate() + direction * 7)
  period.value = `${monday.getFullYear()}-${`${monday.getMonth() + 1}`.padStart(2, '0')}`
  weekId.value = toIsoDate(monday)
}

function goToToday(): void {
  const today = new Date()
  period.value = currentPeriod(today)
  weekId.value = toIsoDate(startOfWeek(today))
  const iso = toIsoDate(today)
  if (schoolDays.value.includes(iso)) selectedDay.value = iso
}

function weekdayName(iso: string): string {
  return formatWeekday(iso, calendarLocale.value)
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
}
</script>
