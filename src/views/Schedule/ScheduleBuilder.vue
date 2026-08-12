<template>
  <AdminLayout>
    <!-- Role mismatch -->
    <div v-if="!canView" class="flex flex-col items-center justify-center gap-4 py-24">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/10">
        <ShieldAlert class="h-8 w-8 text-orange-500" />
      </div>
      <p class="text-base font-medium text-gray-800 dark:text-white/90">
        {{ t('scheduleBuilder.adminsOnly') }}
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
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('scheduleBuilder.subtitle') }}</p>
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
            :disabled="!filledCount || submitting"
            class="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 sm:flex-none dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            @click="clearAll"
          >
            {{ t('scheduleBuilder.clearAll') }}
          </button>
          <button
            type="button"
            :disabled="!canSubmit"
            class="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            @click="submitSchedule"
          >
            <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
            <Check v-else class="h-4 w-4" />
            {{ t('scheduleBuilder.submit') }}
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
        <!-- Grid -->
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 class="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-white/90">
                {{ selectedClassGroup?.display_name }}
                <span
                  v-if="dirty"
                  class="rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-medium text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
                >
                  {{ t('scheduleBuilder.unsaved') }}
                </span>
              </h2>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{ t('scheduleBuilder.hint') }} · {{ t('scheduleBuilder.filled', { n: filledCount }) }}
              </p>
            </div>
          </div>

          <div v-if="gridLoading" class="flex min-h-52 items-center justify-center">
            <Loader2 class="h-6 w-6 animate-spin text-brand-500" />
          </div>

          <div
            v-else-if="gridError"
            class="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center"
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

          <div
            v-else-if="!assignmentOptions.length"
            class="px-5 py-16 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            {{ t('scheduleBuilder.noAssignments') }}
          </div>

          <div v-else class="max-w-full overflow-x-auto custom-scrollbar">
            <!-- table-fixed + a sized first column splits the rest evenly across the 5 days. -->
            <table class="w-full min-w-[680px] table-fixed border-collapse">
              <colgroup>
                <col class="w-14 sm:w-20" />
                <col v-for="weekday in WEEKDAYS" :key="weekday" />
              </colgroup>
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-800">
                  <th
                    class="sticky left-0 z-10 bg-gray-50 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 dark:bg-gray-800/60 dark:text-gray-400"
                  >
                    {{ t('scheduleBuilder.lesson') }}
                  </th>
                  <th
                    v-for="weekday in WEEKDAYS"
                    :key="weekday"
                    class="border-l border-gray-100 bg-gray-50 px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-3 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400"
                  >
                    <span class="lg:hidden">{{ t(`scheduleBuilder.weekdaysShort.${weekday}`) }}</span>
                    <span class="hidden lg:inline">{{ t(`scheduleBuilder.weekdays.${weekday}`) }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="order in LESSON_ORDERS"
                  :key="order"
                  class="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td
                    class="sticky left-0 z-10 bg-white px-3 py-2 text-sm font-semibold text-gray-700 sm:px-4 dark:bg-gray-900 dark:text-gray-300"
                  >
                    {{ order }}
                  </td>
                  <td
                    v-for="weekday in WEEKDAYS"
                    :key="weekday"
                    class="border-l border-gray-100 p-1.5 align-middle dark:border-gray-800"
                  >
                    <SelectMenu
                      :model-value="assignmentIdAt(weekday, order) ?? null"
                      :options="assignmentOptions"
                      :placeholder="'+'"
                      :disabled="!assignmentOptions.length"
                      :aria-label="t('scheduleBuilder.addSubject')"
                      :trigger-class="cellTriggerClass(weekday, order)"
                      clearable
                      hide-chevron
                      :clear-label="t('scheduleBuilder.empty')"
                      @update:model-value="applyAssignment(weekday, order, $event)"
                    />
                  </td>
                </tr>
              </tbody>
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
import type { AxiosError } from 'axios'
import { AlertCircle, Check, CircleAlert, Loader2, ShieldAlert } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { getAcademicYearsApi, getClassGroupsApi } from '@/api/academic'
import { getTeachingAssignmentsApi } from '@/api/teachingAssignments'
import {
  createScheduleSessionApi,
  createSubjectScheduleApi,
  deleteScheduleSessionApi,
  fromApiWeekday,
  getSubjectSchedulesApi,
  toApiWeekday,
} from '@/api/schedule'
import type { UserRole } from '@/types/auth'
import type { ClassGroup } from '@/types/academic'
import type { TeachingAssignment } from '@/types/teachingAssignment'

const { t } = useI18n()
const { user } = useAuth()
const toast = useToast()

const roles = computed(() => user.value?.roles)
const canView = computed(() =>
  (['admin', 'supervisor', 'principal'] as UserRole[]).some(role => roles.value?.includes(role)),
)

/** Monday…Friday as the UI numbers them; the API is 0-based (see `toApiWeekday`). */
type Weekday = 1 | 2 | 3 | 4 | 5

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5]
const LESSON_ORDERS = Array.from({ length: 12 }, (_, index) => index + 1)
const QUARTERS = [1, 2, 3, 4]
/** One page has to cover every subject a class group is taught in a quarter. */
const PAGE_SIZE = 200

const initialLoading = ref(true)
const gridLoading = ref(false)
const submitting = ref(false)
const dirty = ref(false)
const loadError = ref<string | null>(null)
/** Grid-level failure — keeps the toolbar usable so another class can be picked. */
const gridError = ref<string | null>(null)

const classGroups = ref<ClassGroup[]>([])
/** Subject + teacher pairs the selected class group is actually taught. */
const assignments = ref<TeachingAssignment[]>([])
const academicYearId = ref<number | null>(null)
const classGroupId = ref<number | null>(null)
const quarter = ref(1)

/** A lesson as it exists on the backend: which offering, and the session row holding it. */
interface SavedCell {
  assignmentId: number
  sessionId: number
}

/** `${weekday}-${order}` → offering (teaching assignment) id. */
const grid = ref<Record<string, number>>({})
/** Last loaded backend state, diffed against `grid` on submit. */
const savedGrid = ref<Record<string, SavedCell>>({})
/** offering id → its schedule id for the selected quarter, filled as we load/create. */
const scheduleIdByOffering = ref<Record<number, number>>({})

const selectedClassGroup = computed(
  () => classGroups.value.find(group => group.id === classGroupId.value) ?? null,
)
const classGroupOptions = computed<SelectOption[]>(() =>
  classGroups.value.map(group => ({ value: group.id, label: group.display_name })),
)
const quarterOptions = computed<SelectOption[]>(() =>
  QUARTERS.map(value => ({ value, label: t('scheduleBuilder.quarterN', { n: value }) })),
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
const filledCount = computed(() => Object.keys(grid.value).length)
const canSubmit = computed(
  () =>
    !submitting.value &&
    !gridLoading.value &&
    !gridError.value &&
    dirty.value &&
    classGroupId.value !== null,
)

function cellKey(weekday: Weekday, order: number): string {
  return `${weekday}-${order}`
}

function parseCellKey(key: string): { weekday: Weekday; order: number } {
  const [weekday, order] = key.split('-').map(Number)
  return { weekday: weekday as Weekday, order }
}

function assignmentIdAt(weekday: Weekday, order: number): number | undefined {
  return grid.value[cellKey(weekday, order)]
}

/** Filled cells read as a chip, empty ones as a dashed placeholder. */
function cellTriggerClass(weekday: Weekday, order: number): string {
  const base =
    'flex min-h-12 w-full min-w-0 items-center justify-center rounded-lg px-2 py-1 text-xs font-medium transition sm:text-sm'
  return assignmentIdAt(weekday, order)
    ? `${base} bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20`
    : `${base} border border-dashed border-gray-300 text-gray-400 hover:border-brand-300 hover:text-brand-500 dark:border-gray-700 dark:text-gray-600 dark:hover:border-brand-500/40`
}

function applyAssignment(weekday: Weekday, order: number, value: number | string | null): void {
  const key = cellKey(weekday, order)
  const next = { ...grid.value }
  if (value === null) delete next[key]
  else next[key] = Number(value)
  grid.value = next
  dirty.value = true
}

function clearAll(): void {
  grid.value = {}
  dirty.value = true
}

async function loadFilters(): Promise<void> {
  initialLoading.value = true
  loadError.value = null
  try {
    const { data: years } = await getAcademicYearsApi()
    const activeYear = years.find(year => year.is_active)
    academicYearId.value = activeYear?.id ?? null
    const { data } = await getClassGroupsApi(activeYear ? { year: activeYear.id } : undefined)
    classGroups.value = data
    if (classGroups.value.length) classGroupId.value = classGroups.value[0].id
  } catch {
    loadError.value = t('scheduleBuilder.loadFailed')
  } finally {
    initialLoading.value = false
  }
}

/** Assignments are per class group, so they reload with the class selection. */
async function loadAssignments(): Promise<void> {
  if (classGroupId.value === null) {
    assignments.value = []
    return
  }
  gridLoading.value = true
  try {
    const { data } = await getTeachingAssignmentsApi({
      academic_year: academicYearId.value ?? undefined,
      class_group: classGroupId.value,
    })
    assignments.value = data
  } catch {
    assignments.value = []
  } finally {
    gridLoading.value = false
  }
}

/**
 * The grid is assembled from every schedule the class group has that quarter —
 * one per subject offering, each carrying its own sessions.
 */
async function loadGrid(): Promise<void> {
  if (classGroupId.value === null) return
  gridLoading.value = true
  gridError.value = null
  try {
    const { data } = await getSubjectSchedulesApi({
      class_group: classGroupId.value,
      quarter: quarter.value,
      academic_year: academicYearId.value ?? undefined,
      page_size: PAGE_SIZE,
    })
    const next: Record<string, number> = {}
    const saved: Record<string, SavedCell> = {}
    const schedules: Record<number, number> = {}
    for (const schedule of data) {
      schedules[schedule.offering_id] = schedule.id
      for (const session of schedule.sessions ?? []) {
        const key = cellKey(fromApiWeekday(session.weekday) as Weekday, session.order)
        next[key] = schedule.offering_id
        saved[key] = { assignmentId: schedule.offering_id, sessionId: session.id }
      }
    }
    scheduleIdByOffering.value = schedules
    grid.value = next
    savedGrid.value = saved
  } catch {
    // An empty grid here is indistinguishable from a failed load, so say so
    // rather than let a submit overwrite a schedule we never actually saw.
    grid.value = {}
    savedGrid.value = {}
    scheduleIdByOffering.value = {}
    gridError.value = t('scheduleBuilder.loadFailed')
  } finally {
    dirty.value = false
    gridLoading.value = false
  }
}

/** Schedules are created lazily — a subject only gets one once it's placed. */
async function ensureScheduleId(offeringId: number): Promise<number> {
  const known = scheduleIdByOffering.value[offeringId]
  if (known !== undefined) return known
  try {
    const { data } = await createSubjectScheduleApi({ offering: offeringId, quarter: quarter.value })
    scheduleIdByOffering.value = { ...scheduleIdByOffering.value, [offeringId]: data.id }
    return data.id
  } catch (error) {
    // 400 unique_together — someone else created it between our load and now.
    if ((error as AxiosError)?.response?.status !== 400) throw error
    const { data } = await getSubjectSchedulesApi({
      offering: offeringId,
      quarter: quarter.value,
      page_size: 1,
    })
    const existing = data[0]
    if (!existing) throw error
    scheduleIdByOffering.value = { ...scheduleIdByOffering.value, [offeringId]: existing.id }
    return existing.id
  }
}

/**
 * There is no bulk replace, so the grid is saved as a diff against what was
 * loaded: sessions that changed or went away are deleted, new ones created.
 */
async function submitSchedule(): Promise<void> {
  if (!canSubmit.value || classGroupId.value === null) return
  submitting.value = true

  const removed: number[] = []
  const added: Array<{ weekday: Weekday; order: number; assignmentId: number }> = []
  for (const [key, cell] of Object.entries(savedGrid.value)) {
    if (grid.value[key] !== cell.assignmentId) removed.push(cell.sessionId)
  }
  for (const [key, assignmentId] of Object.entries(grid.value)) {
    if (savedGrid.value[key]?.assignmentId === assignmentId) continue
    added.push({ ...parseCellKey(key), assignmentId })
  }

  try {
    // Deletes go first so a moved lesson frees its slot before the new one claims it.
    for (const sessionId of removed) await deleteScheduleSessionApi(sessionId)
    for (const cell of added) {
      const scheduleId = await ensureScheduleId(cell.assignmentId)
      await createScheduleSessionApi(scheduleId, {
        order: cell.order,
        weekday: toApiWeekday(cell.weekday),
      })
    }
    toast.success(t('scheduleBuilder.submitted'), selectedClassGroup.value?.display_name)
  } catch {
    toast.error(t('scheduleBuilder.submitFailed'))
  } finally {
    submitting.value = false
    // Resync either way: a partial failure leaves the backend holding some of the diff.
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
