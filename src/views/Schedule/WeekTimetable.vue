<template>
  <AdminLayout>
    <div class="space-y-5">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-800 dark:text-white/90">{{ t('timetable.title') }}</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('timetable.subtitle') }}</p>
        </div>
        <router-link
          v-if="canEdit"
          to="/schedule-builder"
          class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <CalendarCog class="h-4 w-4" />
          {{ t('timetable.edit') }}
        </router-link>
      </div>

      <!-- Toolbar -->
      <div
        class="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-end dark:border-gray-800 dark:bg-gray-900"
      >
        <div v-if="showClassFilter" class="block w-full sm:w-56">
          <span class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {{ t('scheduleBuilder.classGroup') }}
          </span>
          <SelectMenu
            :model-value="classGroupId"
            :options="classGroupOptions"
            :disabled="!classGroups.length"
            :placeholder="t('timetable.allClasses')"
            :aria-label="t('scheduleBuilder.classGroup')"
            clearable
            :clear-label="t('timetable.allClasses')"
            @update:model-value="classGroupId = $event === null ? null : Number($event)"
          />
        </div>

        <div class="block w-full sm:w-40">
          <span class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {{ t('scheduleBuilder.quarter') }}
          </span>
          <SelectMenu
            :model-value="quarter"
            :options="quarterOptions"
            :aria-label="t('scheduleBuilder.quarter')"
            @update:model-value="quarter = Number($event)"
          />
        </div>
      </div>

      <div v-if="loading" class="flex min-h-52 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <Loader2 class="h-6 w-6 animate-spin text-brand-500" />
      </div>

      <div
        v-else-if="loadError"
        class="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-16 text-center dark:border-gray-800 dark:bg-gray-900"
      >
        <CircleAlert class="h-7 w-7 text-red-500" />
        <p class="text-sm text-gray-600 dark:text-gray-300">{{ loadError }}</p>
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          @click="loadSchedules"
        >
          {{ t('scheduleBuilder.retry') }}
        </button>
      </div>

      <div
        v-else-if="!events.length"
        class="rounded-xl border border-gray-200 bg-white px-5 py-16 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
      >
        {{ t('timetable.empty') }}
      </div>

      <WeekScheduleGrid
        v-else
        readonly
        :events="events"
        :day-start="dayWindow.start"
        :day-end="dayWindow.end"
        @select="selected = $event"
      />
    </div>

    <!-- Entry detail -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="selectedDetail"
          class="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-4 sm:items-center"
          @click.self="selected = null"
        >
          <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div class="flex items-start justify-between gap-3">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                {{ selectedDetail.schedule.title }}
              </h3>
              <button
                type="button"
                class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-white/5"
                :aria-label="t('common.cancel')"
                @click="selected = null"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex items-center gap-3">
                <Clock class="h-4 w-4 shrink-0 text-gray-400" />
                <span class="text-gray-700 dark:text-gray-300">
                  {{ t(`scheduleBuilder.weekdays.${fromApiWeekday(selectedDetail.session.weekday)}`) }},
                  {{ formatTimeRange(selectedDetail.session.time_start, selectedDetail.session.time_end) }}
                </span>
              </div>
              <div v-if="selectedDetail.schedule.class_group" class="flex items-center gap-3">
                <Users class="h-4 w-4 shrink-0 text-gray-400" />
                <span class="text-gray-700 dark:text-gray-300">
                  {{ selectedDetail.schedule.class_group.name }}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <CalendarDays class="h-4 w-4 shrink-0 text-gray-400" />
                <span class="text-gray-700 dark:text-gray-300">
                  {{ t('scheduleBuilder.quarterN', { n: selectedDetail.schedule.quarter }) }}
                </span>
              </div>
              <div v-if="selectedDetail.schedule.type === 'other'" class="flex items-center gap-3">
                <Info class="h-4 w-4 shrink-0 text-gray-400" />
                <span class="text-gray-700 dark:text-gray-300">{{ t('scheduleBuilder.kindOther') }}</span>
              </div>
            </dl>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarCog, CalendarDays, CircleAlert, Clock, Info, Loader2, Users, X } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import WeekScheduleGrid, { type ScheduleEvent } from '@/components/schedule/WeekScheduleGrid.vue'
import { useAuth } from '@/composables/useAuth'
import { getAcademicYearsApi, getClassGroupsApi } from '@/api/academic'
import {
  formatTimeRange,
  fromApiWeekday,
  getSubjectSchedulesApi,
  timeToMinutes,
  type ScheduleSession,
  type SubjectSchedule,
} from '@/api/schedule'
import type { UserRole } from '@/types/auth'
import type { ClassGroup } from '@/types/academic'

const { t } = useI18n()
const { user } = useAuth()

const roles = computed(() => user.value?.roles)
const isAdmin = computed(() =>
  (['admin', 'supervisor', 'principal'] as UserRole[]).some(role => roles.value?.includes(role)),
)
const isTeacher = computed(() =>
  (['teacher', 'homeroom_teacher'] as UserRole[]).some(role => roles.value?.includes(role)),
)
/** Students and parents see their own week; only staff choose whose to look at. */
const showClassFilter = computed(() => isAdmin.value || isTeacher.value)
/** Homeroom teachers may not place subjects, but the breaks are theirs to set. */
const canEdit = computed(() => isAdmin.value || (roles.value?.includes('homeroom_teacher') ?? false))

const QUARTERS = [1, 2, 3, 4]
const PAGE_SIZE = 200
const DEFAULT_DAY_START = 7 * 60
const DEFAULT_DAY_END = 19 * 60

const loading = ref(true)
const loadError = ref<string | null>(null)
const classGroups = ref<ClassGroup[]>([])
const academicYearId = ref<number | null>(null)
const classGroupId = ref<number | null>(null)
const quarter = ref(1)
const schedules = ref<SubjectSchedule[]>([])
const selected = ref<ScheduleEvent | null>(null)

const classGroupOptions = computed<SelectOption[]>(() =>
  classGroups.value.map(group => ({ value: group.id, label: group.display_name })),
)
const quarterOptions = computed<SelectOption[]>(() =>
  QUARTERS.map(value => ({ value, label: t('scheduleBuilder.quarterN', { n: value }) })),
)

const sessionIndex = computed(() => {
  const index = new Map<number, { schedule: SubjectSchedule; session: ScheduleSession }>()
  for (const schedule of schedules.value) {
    for (const session of schedule.sessions ?? []) index.set(session.id, { schedule, session })
  }
  return index
})

const selectedDetail = computed(() =>
  selected.value ? (sessionIndex.value.get(Number(selected.value.id)) ?? null) : null,
)

const events = computed<ScheduleEvent[]>(() =>
  schedules.value.flatMap(schedule =>
    (schedule.sessions ?? []).map(session => ({
      id: String(session.id),
      weekday: fromApiWeekday(session.weekday),
      start: timeToMinutes(session.time_start),
      end: timeToMinutes(session.time_end),
      title: schedule.title || schedule.description || '',
      // Every entry names its class now, so a break is no longer anonymous on
      // an all-classes week.
      subtitle: schedule.class_group?.name,
      tone: schedule.type === 'other' ? 'other' : 'subject',
      colorKey: String(schedule.offering_id ?? `other-${schedule.id}`),
    })),
  ),
)

const dayWindow = computed(() => {
  let start = DEFAULT_DAY_START
  let end = DEFAULT_DAY_END
  for (const event of events.value) {
    start = Math.min(start, Math.floor(event.start / 60) * 60)
    end = Math.max(end, Math.ceil(event.end / 60) * 60)
  }
  return { start, end }
})

/** Optional: without a year the class filter simply lists nothing. */
async function loadFilters(): Promise<void> {
  if (!showClassFilter.value) return
  try {
    const { data: years } = await getAcademicYearsApi()
    const activeYear = years.find(year => year.is_active)
    academicYearId.value = activeYear?.id ?? null
    quarter.value = activeYear?.current_quarter ?? quarter.value
    const { data } = await getClassGroupsApi(activeYear ? { year: activeYear.id } : undefined)
    classGroups.value = data
  } catch {
    classGroups.value = []
  }
}

async function loadSchedules(): Promise<void> {
  loading.value = true
  loadError.value = null
  try {
    // Free entries belong to a class group, so the class filter keeps them —
    // the one request is the whole week, breaks and clubs included.
    const { data } = await getSubjectSchedulesApi({
      quarter: quarter.value,
      class_group: classGroupId.value ?? undefined,
      academic_year: academicYearId.value ?? undefined,
      page_size: PAGE_SIZE,
    })
    schedules.value = data
  } catch {
    schedules.value = []
    loadError.value = t('scheduleBuilder.loadFailed')
  } finally {
    loading.value = false
  }
}

/** Set once the toolbar has settled, so its own defaults do not refetch. */
const ready = ref(false)

onMounted(async () => {
  await loadFilters()
  await loadSchedules()
  ready.value = true
})

watch([classGroupId, quarter], () => {
  if (!ready.value) return
  loadSchedules()
})
</script>
