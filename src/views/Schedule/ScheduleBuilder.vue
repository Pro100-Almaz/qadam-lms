<template>
  <AdminLayout>
    <!-- Role mismatch -->
    <div v-if="!canView" class="flex flex-col items-center justify-center gap-4 py-24">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/10">
        <ShieldAlert class="h-8 w-8 text-orange-500" />
      </div>
      <p class="text-base font-medium text-gray-800 dark:text-white/90">
        {{ t('scheduleBuilder.noAccess') }}
      </p>
    </div>

    <div v-else-if="initialLoading" class="flex items-center justify-center py-24">
      <Loader2 class="h-7 w-7 animate-spin text-brand-500" />
    </div>

    <div v-else-if="loadError" class="flex flex-col items-center justify-center gap-4 py-24">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
        <AlertCircle class="h-8 w-8 text-red-500" />
      </div>
      <p class="text-base font-medium text-gray-800 dark:text-white/90">{{ loadError }}</p>
    </div>

    <div v-else class="space-y-5">
      <div>
        <h1 class="text-xl font-bold text-gray-800 dark:text-white/90">{{ t('scheduleBuilder.title') }}</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ canPlaceSubjects ? t('scheduleBuilder.subtitle') : t('scheduleBuilder.subtitleHomeroom') }}
        </p>
      </div>

      <!-- Toolbar -->
      <div
        class="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-end dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="block w-full sm:w-56">
          <span class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {{ t('scheduleBuilder.classGroup') }}
          </span>
          <SelectMenu
            :model-value="classGroupId"
            :options="classGroupOptions"
            :disabled="!classGroups.length"
            :placeholder="'—'"
            :aria-label="t('scheduleBuilder.classGroup')"
            @update:model-value="classGroupId = $event as number | null"
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

        <div class="flex items-center gap-2 sm:ml-auto sm:pb-0.5">
          <button
            type="button"
            class="flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
            @click="openCreate({ weekday: 1, start: 9 * 60, end: 9 * 60 + 45 })"
          >
            <Plus class="h-4 w-4" />
            {{ t('scheduleBuilder.addEntry') }}
          </button>
        </div>
      </div>

      <div
        v-if="!classGroups.length"
        class="rounded-xl border border-gray-200 bg-white px-5 py-16 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
      >
        {{ t('scheduleBuilder.noClassGroups') }}
      </div>

      <template v-else>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">
              {{ selectedClassGroup?.display_name }}
            </h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ t('scheduleBuilder.dragHint') }} · {{ t('scheduleBuilder.filled', { n: sessionCount }) }}
            </p>
          </div>
          <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span class="flex items-center gap-1.5">
              <span class="h-3 w-3 rounded-sm border border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/15"></span>
              {{ t('scheduleBuilder.legendSubject') }}
            </span>
            <span class="flex items-center gap-1.5">
              <span class="h-3 w-3 rounded-sm border border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"></span>
              {{ t('scheduleBuilder.legendOther') }}
            </span>
          </div>
        </div>

        <div v-if="gridLoading" class="flex min-h-52 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <Loader2 class="h-6 w-6 animate-spin text-brand-500" />
        </div>

        <div
          v-else-if="gridError"
          class="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-16 text-center dark:border-gray-800 dark:bg-gray-900"
        >
          <CircleAlert class="h-7 w-7 text-red-500" />
          <p class="text-sm text-gray-600 dark:text-gray-300">{{ gridError }}</p>
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            @click="loadGrid"
          >
            {{ t('scheduleBuilder.retry') }}
          </button>
        </div>

        <WeekScheduleGrid
          v-else
          :events="events"
          :pending-range="pendingRange"
          :day-start="dayWindow.start"
          :day-end="dayWindow.end"
          @create="openCreate"
          @select="openEdit"
        />
      </template>
    </div>

    <!-- Entry editor -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="editor"
          class="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-4 sm:items-center"
          @click.self="closeEditor"
        >
          <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div class="flex items-start justify-between">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                {{ editor.mode === 'create' ? t('scheduleBuilder.newEntry') : t('scheduleBuilder.editEntry') }}
              </h3>
              <button
                type="button"
                class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-white/5"
                :aria-label="t('common.cancel')"
                @click="closeEditor"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <div class="mt-5 space-y-4">
              <!-- A schedule is either a taught subject or a free entry; the
                   description only exists for the second. Homeroom teachers own
                   their class's free entries but never place subjects, so the
                   choice is not theirs to make. -->
              <div
                v-if="canPlaceSubjects"
                class="inline-flex w-full rounded-lg border border-gray-300 p-1 dark:border-gray-700"
              >
                <button
                  v-for="kind in (['subject', 'other'] as const)"
                  :key="kind"
                  type="button"
                  class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition"
                  :class="
                    editor.kind === kind
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                  "
                  @click="editor.kind = kind"
                >
                  {{ kind === 'subject' ? t('scheduleBuilder.kindSubject') : t('scheduleBuilder.kindOther') }}
                </button>
              </div>

              <div v-if="editor.kind === 'subject'">
                <label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {{ t('scheduleBuilder.addSubject') }}
                </label>
                <SelectMenu
                  :model-value="editor.offeringId"
                  :options="assignmentOptions"
                  :disabled="!assignmentOptions.length"
                  :placeholder="t('scheduleBuilder.pickSubject')"
                  :aria-label="t('scheduleBuilder.addSubject')"
                  @update:model-value="editor.offeringId = $event === null ? null : Number($event)"
                />
                <p v-if="!assignmentOptions.length" class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ t('scheduleBuilder.noAssignments') }}
                </p>
              </div>

              <div v-else>
                <label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {{ t('scheduleBuilder.description') }}
                </label>
                <input
                  v-model="editor.description"
                  type="text"
                  :placeholder="t('scheduleBuilder.descriptionPlaceholder')"
                  class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {{ t('scheduleBuilder.weekday') }}
                  </label>
                  <SelectMenu
                    :model-value="editor.weekday"
                    :options="weekdayOptions"
                    :aria-label="t('scheduleBuilder.weekday')"
                    @update:model-value="editor.weekday = Number($event)"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {{ t('scheduleBuilder.startTime') }}
                  </label>
                  <!-- `step` stays at a minute so typing "30" is not fought
                       digit by digit; the snap to five happens on blur. -->
                  <input
                    v-model="editor.start"
                    type="time"
                    step="60"
                    :class="[timeFieldClass, rangeError ? invalidFieldClass : validFieldClass]"
                    @blur="editor.start = snapTime(editor.start)"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {{ t('scheduleBuilder.endTime') }}
                  </label>
                  <input
                    v-model="editor.end"
                    type="time"
                    step="60"
                    :class="[timeFieldClass, rangeError ? invalidFieldClass : validFieldClass]"
                    @blur="editor.end = snapTime(editor.end)"
                  />
                </div>
              </div>

              <p v-if="rangeError" class="text-sm text-red-600 dark:text-red-400">{{ rangeError }}</p>

              <p v-if="editorError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                {{ editorError }}
              </p>
            </div>

            <div class="mt-6 flex flex-wrap items-center gap-3">
              <button
                v-if="editor.mode === 'edit'"
                type="button"
                :disabled="saving"
                class="flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                @click="removeEntry"
              >
                <Trash2 class="h-4 w-4" />
                {{ t('scheduleBuilder.delete') }}
              </button>
              <button
                type="button"
                :disabled="saving"
                class="ml-auto h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                @click="closeEditor"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="button"
                :disabled="saving || Boolean(rangeError)"
                class="flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                @click="saveEntry"
              >
                <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
                <Check v-else class="h-4 w-4" />
                {{ t('common.save') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AxiosError } from 'axios'
import {
  AlertCircle,
  Check,
  CircleAlert,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import WeekScheduleGrid, {
  type ScheduleEvent,
  type ScheduleRange,
} from '@/components/schedule/WeekScheduleGrid.vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { getAcademicYearsApi, getClassGroupsApi } from '@/api/academic'
import { getTeacherMyClassesApi } from '@/api/teacherDashboard'
import { getTeachingAssignmentsApi } from '@/api/teachingAssignments'
import {
  createScheduleSessionApi,
  createSubjectScheduleApi,
  deleteScheduleSessionApi,
  deleteSubjectScheduleApi,
  fromApiWeekday,
  getSubjectSchedulesApi,
  minutesToTime,
  timeToMinutes,
  toApiWeekday,
  updateScheduleSessionApi,
  updateSubjectScheduleApi,
  type ScheduleSession,
  type SubjectSchedule,
} from '@/api/schedule'
import type { UserRole } from '@/types/auth'
import type { TeachingAssignment } from '@/types/teachingAssignment'

const { t } = useI18n()
const { user } = useAuth()
const toast = useToast()

const roles = computed(() => user.value?.roles)
const isAdmin = computed(() =>
  (['admin', 'supervisor', 'principal'] as UserRole[]).some(role => roles.value?.includes(role)),
)
/**
 * Free entries belong to a class group, and its homeroom teacher may place them
 * — so the builder is theirs too, narrowed to their own class and to entries
 * that are not a taught subject.
 */
const isHomeroomTeacher = computed(() => roles.value?.includes('homeroom_teacher') ?? false)
const canView = computed(() => isAdmin.value || isHomeroomTeacher.value)
const canPlaceSubjects = computed(() => isAdmin.value)

const WEEKDAYS = [1, 2, 3, 4, 5]
const QUARTERS = [1, 2, 3, 4]
/** One page has to cover every subject a class group is taught in a quarter. */
const PAGE_SIZE = 200
/** The grid always shows at least a school day, and stretches to fit outliers. */
const DEFAULT_DAY_START = 7 * 60
const DEFAULT_DAY_END = 19 * 60
/** Lessons land on a five-minute mark — 16:15 or 16:20, never 16:17. */
const SNAP_MINUTES = 5

const initialLoading = ref(true)
const gridLoading = ref(false)
const saving = ref(false)
const loadError = ref<string | null>(null)
/** Grid-level failure — keeps the toolbar usable so another class can be picked. */
const gridError = ref<string | null>(null)

/**
 * The classes this user may build a week for: every class of the active year
 * for an admin, only the homeroom ones for a homeroom teacher. The two sources
 * name their fields differently, so both are mapped onto this shape.
 */
interface BuilderClassGroup {
  id: number
  display_name: string
}

const classGroups = ref<BuilderClassGroup[]>([])
/** Subject + teacher pairs the selected class group is actually taught. */
const assignments = ref<TeachingAssignment[]>([])
const academicYearId = ref<number | null>(null)
const classGroupId = ref<number | null>(null)
const quarter = ref(1)

/**
 * The selected class group's whole timetable for the quarter — taught subjects
 * and free entries alike. A break belongs to one class group, so it arrives
 * with the rest of that class's week instead of being fetched separately.
 */
const schedules = ref<SubjectSchedule[]>([])

const selectedClassGroup = computed(
  () => classGroups.value.find(group => group.id === classGroupId.value) ?? null,
)
const classGroupOptions = computed<SelectOption[]>(() =>
  classGroups.value.map(group => ({ value: group.id, label: group.display_name })),
)
const quarterOptions = computed<SelectOption[]>(() =>
  QUARTERS.map(value => ({ value, label: t('scheduleBuilder.quarterN', { n: value }) })),
)
const weekdayOptions = computed<SelectOption[]>(() =>
  WEEKDAYS.map(value => ({ value, label: t(`scheduleBuilder.weekdays.${value}`) })),
)
/**
 * One subject can be taught by several teachers, so each assignment is its own
 * option and the teacher is what tells two same-subject rows apart.
 */
const assignmentOptions = computed<SelectOption[]>(() =>
  [...assignments.value]
    .sort(
      (a, b) =>
        a.subject_name.localeCompare(b.subject_name) ||
        a.teacher_name.localeCompare(b.teacher_name),
    )
    .map(assignment => ({
      value: assignment.id,
      label: assignment.subject_name,
      sublabel: assignment.teacher_name,
    })),
)

/** session id → the session and the schedule it hangs off, for the editor. */
const sessionIndex = computed(() => {
  const index = new Map<number, { schedule: SubjectSchedule; session: ScheduleSession }>()
  for (const schedule of schedules.value) {
    for (const session of schedule.sessions ?? []) index.set(session.id, { schedule, session })
  }
  return index
})

const sessionCount = computed(() => sessionIndex.value.size)

const events = computed<ScheduleEvent[]>(() =>
  schedules.value.flatMap(schedule =>
    (schedule.sessions ?? []).map(session => ({
      id: String(session.id),
      weekday: fromApiWeekday(session.weekday),
      start: timeToMinutes(session.time_start),
      end: timeToMinutes(session.time_end),
      title: schedule.title || schedule.description || '',
      subtitle: teacherNameOf(schedule.offering_id),
      tone: schedule.type === 'other' ? 'other' : 'subject',
      colorKey: String(schedule.offering_id ?? `other-${schedule.id}`),
    })),
  ),
)

/** Lessons outside the default window still have to be reachable. */
const dayWindow = computed(() => {
  let start = DEFAULT_DAY_START
  let end = DEFAULT_DAY_END
  for (const event of events.value) {
    start = Math.min(start, Math.floor(event.start / 60) * 60)
    end = Math.max(end, Math.ceil(event.end / 60) * 60)
  }
  return { start, end }
})

function teacherNameOf(offeringId: number | null): string | undefined {
  if (offeringId === null) return undefined
  return assignments.value.find(assignment => assignment.id === offeringId)?.teacher_name
}

// ─── Loading ──────────────────────────────────────────────────────────────────

async function loadFilters(): Promise<void> {
  initialLoading.value = true
  loadError.value = null
  try {
    const { data: years } = await getAcademicYearsApi()
    const activeYear = years.find(year => year.is_active)
    academicYearId.value = activeYear?.id ?? null
    if (isAdmin.value) {
      const { data } = await getClassGroupsApi(activeYear ? { year: activeYear.id } : undefined)
      classGroups.value = data.map(group => ({ id: group.id, display_name: group.display_name }))
    } else {
      const { data } = await getTeacherMyClassesApi()
      classGroups.value = (Array.isArray(data) ? data : [])
        .filter(classroom => classroom.is_homeroom)
        .map(classroom => ({ id: classroom.class_group_id, display_name: classroom.display_name }))
    }
    if (classGroups.value.length) classGroupId.value = classGroups.value[0].id
  } catch {
    loadError.value = t('scheduleBuilder.loadFailed')
  } finally {
    initialLoading.value = false
  }
}

/** Assignments are per class group, so they reload with the class selection. */
async function loadAssignments(): Promise<void> {
  // Only subjects are placed from them, and only an admin places those.
  if (!canPlaceSubjects.value || classGroupId.value === null) {
    assignments.value = []
    return
  }
  try {
    const { data } = await getTeachingAssignmentsApi({
      academic_year: academicYearId.value ?? undefined,
      class_group: classGroupId.value,
    })
    assignments.value = data
  } catch {
    assignments.value = []
  }
}

async function loadGrid(): Promise<void> {
  if (classGroupId.value === null) return
  gridLoading.value = true
  gridError.value = null
  try {
    // One request is the whole week: the class filter is the schedule's own
    // class group now, so free entries come back with the subjects.
    const { data } = await getSubjectSchedulesApi({
      class_group: classGroupId.value,
      quarter: quarter.value,
      academic_year: academicYearId.value ?? undefined,
      page_size: PAGE_SIZE,
    })
    schedules.value = data
  } catch {
    // An empty grid is indistinguishable from a failed load, so say so rather
    // than let an edit sit on top of a schedule we never actually saw.
    schedules.value = []
    gridError.value = t('scheduleBuilder.loadFailed')
  } finally {
    gridLoading.value = false
  }
}

// ─── Editor ───────────────────────────────────────────────────────────────────

interface EditorState {
  mode: 'create' | 'edit'
  sessionId: number | null
  /** The schedule the session currently hangs off — `null` while creating. */
  scheduleId: number | null
  kind: 'subject' | 'other'
  offeringId: number | null
  description: string
  weekday: number
  /** `"HH:MM"`, as `<input type="time">` speaks it. */
  start: string
  end: string
}

const editor = ref<EditorState | null>(null)
const editorError = ref<string | null>(null)

/**
 * What the grid keeps highlighted while the editor is open — the range the drag
 * produced, and then whatever the time fields are edited to.
 */
const pendingRange = computed<ScheduleRange | null>(() => {
  const state = editor.value
  if (!state) return null
  const start = timeToMinutes(state.start)
  const end = timeToMinutes(state.end)
  if (end <= start) return null
  return { weekday: state.weekday, start, end }
})

function openCreate(range: ScheduleRange): void {
  editorError.value = null
  editor.value = {
    mode: 'create',
    sessionId: null,
    scheduleId: null,
    kind: canPlaceSubjects.value ? 'subject' : 'other',
    offeringId: assignmentOptions.value.length ? Number(assignmentOptions.value[0].value) : null,
    description: '',
    weekday: range.weekday,
    start: minutesToTime(range.start),
    end: minutesToTime(range.end),
  }
}

function openEdit(event: ScheduleEvent): void {
  const found = sessionIndex.value.get(Number(event.id))
  if (!found) return
  const { schedule, session } = found
  // A homeroom teacher sees the taught subjects on the week but cannot move
  // them — opening the editor over one would only earn a 403 on save.
  if (!canPlaceSubjects.value && schedule.type !== 'other') return
  editorError.value = null
  editor.value = {
    mode: 'edit',
    sessionId: session.id,
    scheduleId: schedule.id,
    kind: schedule.type === 'other' ? 'other' : 'subject',
    offeringId: schedule.offering_id,
    description: schedule.description ?? '',
    weekday: fromApiWeekday(session.weekday),
    start: minutesToTime(timeToMinutes(session.time_start)),
    end: minutesToTime(timeToMinutes(session.time_end)),
  }
}

/** `"16:17"` → `"16:15"`. Leaves an empty field alone for the save to reject. */
function snapTime(value: string): string {
  if (!value) return value
  return minutesToTime(Math.round(timeToMinutes(value) / SNAP_MINUTES) * SNAP_MINUTES)
}

const timeFieldClass =
  'h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-800 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:[color-scheme:dark]'
const validFieldClass =
  'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700'
const invalidFieldClass =
  'border-red-300 focus:border-red-400 focus:ring-red-500/10 dark:border-red-500/50'

/**
 * The range is checked as it is typed rather than only on save, so the Save
 * button is never live over a range the API would reject anyway.
 */
const rangeError = computed<string | null>(() => {
  const state = editor.value
  if (!state) return null
  if (!state.start || !state.end) return t('scheduleBuilder.timeRequired')
  if (timeToMinutes(state.end) <= timeToMinutes(state.start)) {
    return t('scheduleBuilder.invalidRange')
  }
  return null
})

function closeEditor(): void {
  editor.value = null
  editorError.value = null
}

/** The API answers per field; any of them is more useful than a generic line. */
function readScheduleError(error: unknown): string {
  const data = (error as AxiosError)?.response?.data
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    const first =
      record.non_field_errors ?? record.detail ?? record.time_end ?? Object.values(record)[0]
    if (typeof first === 'string') return first
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
  }
  return t('scheduleBuilder.saveFailed')
}

/** A subject only gets a schedule once something is placed on it. */
async function ensureSubjectSchedule(offeringId: number): Promise<number> {
  const known = schedules.value.find(
    schedule => schedule.offering_id === offeringId && schedule.quarter === quarter.value,
  )
  if (known) return known.id
  try {
    // The class group travels with the offering even though the API derives one
    // — it rejects a create without it. The assignments are loaded per class
    // group, so the offering is always taught to the one on screen.
    const { data } = await createSubjectScheduleApi({
      offering: offeringId,
      class_group: classGroupId.value as number,
      quarter: quarter.value,
    })
    return data.id
  } catch (error) {
    // 400 unique_together — someone else created it between our load and now.
    if ((error as AxiosError)?.response?.status !== 400) throw error
    const { data } = await getSubjectSchedulesApi({
      offering: offeringId,
      quarter: quarter.value,
      page_size: 1,
    })
    if (!data[0]) throw error
    return data[0].id
  }
}

/** A free entry has no offering at all, so its class group is all it is placed by. */
async function createFreeEntry(description: string): Promise<number> {
  const { data } = await createSubjectScheduleApi({
    class_group: classGroupId.value as number,
    description,
    quarter: quarter.value,
  })
  return data.id
}

async function saveEntry(): Promise<void> {
  const state = editor.value
  if (!state || saving.value || classGroupId.value === null) return

  // Snapped once more here: a field saved without ever losing focus, or a
  // browser whose time picker ignores `step`, would slip an odd minute through.
  state.start = snapTime(state.start)
  state.end = snapTime(state.end)
  if (rangeError.value) {
    editorError.value = rangeError.value
    return
  }
  if (state.kind === 'subject' && state.offeringId === null) {
    editorError.value = t('scheduleBuilder.subjectRequired')
    return
  }
  if (state.kind === 'other' && !state.description.trim()) {
    editorError.value = t('scheduleBuilder.descriptionRequired')
    return
  }

  saving.value = true
  editorError.value = null
  const payload = {
    weekday: toApiWeekday(state.weekday),
    time_start: state.start,
    time_end: state.end,
  }

  try {
    const current = state.sessionId === null ? null : sessionIndex.value.get(state.sessionId)
    const wasSameSchedule =
      current !== null &&
      current !== undefined &&
      ((state.kind === 'subject' && current.schedule.offering_id === state.offeringId) ||
        (state.kind === 'other' && current.schedule.type === 'other'))

    if (current && wasSameSchedule) {
      // Same schedule — only the times, and possibly a free entry's wording, moved.
      if (state.kind === 'other' && state.description.trim() !== (current.schedule.description ?? '')) {
        await updateSubjectScheduleApi(current.schedule.id, {
          description: state.description.trim(),
        })
      }
      await updateScheduleSessionApi(current.session.id, payload)
    } else {
      // A different subject, or a subject turned into a free entry: there is no
      // move endpoint, so the session is recreated under the new schedule.
      const scheduleId =
        state.kind === 'subject'
          ? await ensureSubjectSchedule(state.offeringId as number)
          : await createFreeEntry(state.description.trim())
      if (current) await deleteScheduleSessionApi(current.session.id)
      await createScheduleSessionApi(scheduleId, payload)
      if (current) await pruneEmptyFreeEntry(current.schedule, current.session.id)
    }

    toast.success(t('scheduleBuilder.saved'))
    closeEditor()
  } catch (error) {
    editorError.value = readScheduleError(error)
  } finally {
    saving.value = false
    await loadGrid()
  }
}

/**
 * A free entry exists only for its sessions — an empty one would linger on the
 * class group's timetable forever, so it goes when its last session does.
 */
async function pruneEmptyFreeEntry(schedule: SubjectSchedule, removedSessionId: number): Promise<void> {
  if (schedule.type !== 'other') return
  const remaining = (schedule.sessions ?? []).filter(session => session.id !== removedSessionId)
  if (remaining.length) return
  try {
    await deleteSubjectScheduleApi(schedule.id)
  } catch {
    // Not worth failing the edit over — the session it held is already gone.
  }
}

async function removeEntry(): Promise<void> {
  const state = editor.value
  if (!state || state.sessionId === null || saving.value) return
  const current = sessionIndex.value.get(state.sessionId)
  saving.value = true
  editorError.value = null
  try {
    await deleteScheduleSessionApi(state.sessionId)
    if (current) await pruneEmptyFreeEntry(current.schedule, state.sessionId)
    toast.success(t('scheduleBuilder.deleted'))
    closeEditor()
  } catch (error) {
    editorError.value = readScheduleError(error)
  } finally {
    saving.value = false
    await loadGrid()
  }
}

onMounted(async () => {
  if (!canView.value) {
    initialLoading.value = false
    return
  }
  await loadFilters()
  await loadAssignments()
  await loadGrid()
})

watch(classGroupId, async (next, previous) => {
  if (initialLoading.value || next === previous) return
  await loadAssignments()
  await loadGrid()
})

watch(quarter, (next, previous) => {
  if (initialLoading.value || next === previous) return
  loadGrid()
})
</script>
