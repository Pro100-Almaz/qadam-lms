<template>
  <StatisticsModalShell
    :open="open"
    :title="t('statistics.studentTitle')"
    :subtitle="headerSubtitle"
    :note="footerNote"
    @close="emit('close')"
  >
    <!-- Which record is being read. Not a tab: crossing this line changes the
         endpoint family, the counting rule and the meaning of the numbers. -->
    <template #modes>
      <StatisticsTabs v-model="modeModel" :items="modes" variant="segmented" />
    </template>

    <!-- How to cut it. Attendance has one view, so it shows no tab row at all
         rather than a single dead tab. -->
    <template v-if="tabs.length" #tabs>
      <StatisticsTabs v-model="tabModel" :items="tabs" />
    </template>

    <template #filters>
      <!-- The assignment trajectory takes dates, not a quarter, so the control
           is hidden there rather than left on screen doing nothing. -->
      <div v-if="showQuarter" class="w-full sm:w-40">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('statistics.quarter') }}
        </label>
        <SelectMenu
          v-model="quarterModel"
          :options="quarterOptions"
          :aria-label="t('statistics.quarter')"
        />
      </div>

      <div v-if="mode === 'lessons' && tab === 'subjects'" class="w-full sm:w-44">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('statistics.source') }}
        </label>
        <SelectMenu v-model="sourceModel" :options="sourceOptions" :aria-label="t('statistics.source')" />
      </div>

      <!-- Subject picker: the trajectory tabs need an offering, and attendance
           can optionally be narrowed to one. -->
      <div v-if="showSubjectPicker" class="w-full sm:w-56">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('statistics.subject') }}
        </label>
        <SelectMenu
          v-model="offeringModel"
          :options="offeringOptions"
          :placeholder="subjectPlaceholder"
          :aria-label="t('statistics.subject')"
          :disabled="offeringsLoading || !offeringOptions.length"
          :clearable="mode === 'attendance'"
          :clear-label="t('statistics.allSubjects')"
        />
      </div>

      <div v-if="mode === 'assignments'" class="w-full sm:w-40">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('assignments.category') }}
        </label>
        <SelectMenu
          v-model="categoryModel"
          :options="categoryOptions"
          :placeholder="t('statistics.allCategories')"
          :aria-label="t('assignments.category')"
          clearable
          :clear-label="t('statistics.allCategories')"
        />
      </div>

      <div v-if="mode === 'assignments'" class="w-full sm:w-48">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('statistics.missing') }}
        </label>
        <SelectMenu v-model="missingModel" :options="missingOptions" :aria-label="t('statistics.missing')" />
      </div>

      <label
        v-if="tab === 'trajectory'"
        class="flex cursor-pointer items-center gap-2 py-2.5 text-sm text-gray-600 dark:text-gray-400"
      >
        <input
          v-model="includeClassStats"
          type="checkbox"
          class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
        />
        {{ t('statistics.compareToClass') }}
      </label>
    </template>

    <!-- ── Lesson grades ──────────────────────────────────────────────────── -->
    <template v-if="mode === 'lessons'">
      <div v-if="tab === 'subjects'">
        <StatePanel :loading="radarLoading" :error="radarError" @retry="loadRadar" />
        <SubjectRadarChart v-if="!radarLoading && !radarError && radar" :data="radar" />
      </div>
      <div v-else>
        <StatePanel :loading="trajectoryLoading" :error="trajectoryError" @retry="loadTrajectory" />
        <p
          v-if="!trajectoryLoading && !trajectoryError && !lessonOfferingId"
          class="py-16 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          {{ t('statistics.pickSubject') }}
        </p>
        <TrajectoryChart
          v-else-if="!trajectoryLoading && !trajectoryError && trajectory"
          :data="trajectory"
        />
      </div>
    </template>

    <!-- ── Assignment grades ──────────────────────────────────────────────── -->
    <template v-else-if="mode === 'assignments'">
      <div v-if="tab === 'subjects'">
        <StatePanel :loading="summaryLoading" :error="summaryError" @retry="loadSummary" />
        <AssignmentRadarChart v-if="!summaryLoading && !summaryError && summary" :data="summary" />
      </div>
      <div v-else>
        <StatePanel
          :loading="assignmentTrajectoryLoading"
          :error="assignmentTrajectoryError"
          @retry="loadAssignmentTrajectory"
        />
        <p
          v-if="!assignmentTrajectoryLoading && !assignmentTrajectoryError && !assignmentOfferingId"
          class="py-16 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          {{ t('statistics.pickSubject') }}
        </p>
        <AssignmentTrajectoryChart
          v-else-if="!assignmentTrajectoryLoading && !assignmentTrajectoryError && assignmentTrajectory"
          :data="assignmentTrajectory"
        />
      </div>
    </template>

    <!-- ── Attendance ─────────────────────────────────────────────────────── -->
    <template v-else>
      <StatePanel :loading="attendanceLoading" :error="attendanceError" @retry="loadAttendance" />
      <AttendanceSummaryPanel
        v-if="!attendanceLoading && !attendanceError && attendance"
        :data="attendance"
      />
    </template>
  </StatisticsModalShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarCheck, ClipboardList, NotebookPen } from 'lucide-vue-next'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import StatePanel from '@/components/analytics/StatePanel.vue'
import StatisticsModalShell from '@/components/analytics/StatisticsModalShell.vue'
import StatisticsTabs, { type StatisticsTabItem } from '@/components/analytics/StatisticsTabs.vue'
import SubjectRadarChart from '@/components/analytics/SubjectRadarChart.vue'
import TrajectoryChart from '@/components/analytics/TrajectoryChart.vue'
import AssignmentRadarChart from '@/components/analytics/AssignmentRadarChart.vue'
import AssignmentTrajectoryChart from '@/components/analytics/AssignmentTrajectoryChart.vue'
import AttendanceSummaryPanel from '@/components/analytics/AttendanceSummaryPanel.vue'
import {
  ASSIGNMENT_CATEGORIES,
  getAssignmentSummaryApi,
  getAssignmentTrajectoryApi,
  getAttendanceSummaryApi,
  getStudentTrajectoryApi,
  getSubjectRadarApi,
  readAnalyticsError,
  type AssignmentCategory,
  type AssignmentSummaryResponse,
  type AssignmentTrajectoryResponse,
  type AttendanceSummaryResponse,
  type MissingMode,
  type RadarSource,
  type SubjectRadarResponse,
  type TrajectoryResponse,
} from '@/api/analytics'
import { useCurrentQuarter } from '@/composables/useCurrentQuarter'

export interface StatisticsStudentTarget {
  /** Student **profile** id — what `/analytics/students/<id>/` expects. */
  id: number
  name?: string
}

/**
 * One student, across the three records the school keeps on them: lesson marks,
 * assignment marks, and the register.
 *
 * The outer switch is the important control. Those are separate gradebooks —
 * the lesson marks behind a subject's own page, the assignments behind the
 * grading page — computed under opposite conventions for missing work: lesson
 * analytics zero-fill an unmarked topic, assignment analytics exclude it. So the
 * two will not agree, should not be averaged together, and the footer restates
 * the rule in force every time the switch moves.
 *
 * Within a grade record the tabs go widest-first — "how is this student doing?",
 * then "what happened in the subject that stands out?" — and the first feeds the
 * second: the radar's axes are the only place the `offering_id` a trajectory
 * needs can be had from a screen that knows only a student id.
 */
const props = defineProps<{
  open: boolean
  student: StatisticsStudentTarget
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n()
const { quarter: currentQuarter, load: loadCurrentQuarter } = useCurrentQuarter()

type Mode = 'lessons' | 'assignments' | 'attendance'
type Tab = 'subjects' | 'trajectory'

const mode = ref<Mode>('lessons')
const tab = ref<Tab>('subjects')

const quarter = ref(currentQuarter.value)
const source = ref<RadarSource>('auto')
const category = ref<AssignmentCategory | null>(null)
const missing = ref<MissingMode>('exclude')
const includeClassStats = ref(true)

/**
 * One picked subject per record, not one shared.
 *
 * The three offering lists come from three different responses and rarely match
 * — a subject with assignments need not have lesson marks — so a single ref
 * would carry an offering into a mode that cannot chart it and 404.
 */
const lessonOfferingId = ref<number | null>(null)
const assignmentOfferingId = ref<number | null>(null)
const attendanceOfferingId = ref<number | null>(null)

const radar = ref<SubjectRadarResponse | null>(null)
const radarLoading = ref(false)
const radarError = ref('')

const trajectory = ref<TrajectoryResponse | null>(null)
const trajectoryLoading = ref(false)
const trajectoryError = ref('')

const summary = ref<AssignmentSummaryResponse | null>(null)
const summaryLoading = ref(false)
const summaryError = ref('')

const assignmentTrajectory = ref<AssignmentTrajectoryResponse | null>(null)
const assignmentTrajectoryLoading = ref(false)
const assignmentTrajectoryError = ref('')

const attendance = ref<AttendanceSummaryResponse | null>(null)
const attendanceLoading = ref(false)
const attendanceError = ref('')
/** The subject picker's options, held apart from the filtered response. */
const attendanceSubjects = ref<{ offering_id: number; subject: string }[]>([])

// ─── Switchers ───────────────────────────────────────────────────────────────

const modes = computed<StatisticsTabItem[]>(() => [
  { value: 'lessons', label: t('statistics.modeLessons'), icon: NotebookPen },
  { value: 'assignments', label: t('statistics.modeAssignments'), icon: ClipboardList },
  { value: 'attendance', label: t('statistics.modeAttendance'), icon: CalendarCheck },
])

const modeModel = computed<string>({
  get: () => mode.value,
  set: value => {
    mode.value = value as Mode
    // The two grade records share tab names but not state; start each at the
    // overview, which is also what populates its subject picker.
    tab.value = 'subjects'
  },
})

const tabs = computed<StatisticsTabItem[]>(() => {
  if (mode.value === 'attendance') return []
  return [
    { value: 'subjects', label: t('statistics.tabSubjects') },
    { value: 'trajectory', label: t('statistics.tabTrajectory') },
  ]
})

const tabModel = computed<string>({
  get: () => tab.value,
  set: value => {
    tab.value = value as Tab
  },
})

const headerSubtitle = computed(() => {
  const name =
    radar.value?.student.full_name ??
    summary.value?.student.full_name ??
    attendance.value?.student.full_name ??
    props.student.name
  const group =
    radar.value?.class_group ??
    summary.value?.class_group?.name ??
    attendance.value?.class_group?.name
  return [name, group].filter(Boolean).join(' · ') || t('statistics.studentSubtitle')
})

/** Each record counts what is missing differently; the footer says which. */
const footerNote = computed(() => {
  if (mode.value === 'attendance') return t('statistics.attendanceNote')
  if (mode.value === 'assignments') {
    return missing.value === 'zero'
      ? t('statistics.assignmentZeroNote')
      : t('statistics.assignmentExcludeNote')
  }
  return t('statistics.zeroFillNote')
})

// ─── Filter models ───────────────────────────────────────────────────────────

/** The assignment trajectory endpoint has no quarter parameter of its own. */
const showQuarter = computed(() => !(mode.value === 'assignments' && tab.value === 'trajectory'))

const showSubjectPicker = computed(
  () => mode.value === 'attendance' || tab.value === 'trajectory',
)

const quarterOptions = computed<SelectOption[]>(() =>
  [1, 2, 3, 4].map(value => ({ value, label: t('gradeReport.quarterOption', { quarter: value }) })),
)

const quarterModel = computed<number | string | null>({
  get: () => quarter.value,
  set: value => {
    const picked = Number(value)
    if (picked >= 1 && picked <= 4) quarter.value = picked
  },
})

const sourceOptions = computed<SelectOption[]>(() => [
  { value: 'auto', label: t('statistics.source_auto'), sublabel: t('statistics.source_autoHint') },
  { value: 'snapshot', label: t('statistics.source_snapshot') },
  { value: 'live', label: t('statistics.source_live') },
])

const sourceModel = computed<number | string | null>({
  get: () => source.value,
  set: value => {
    source.value = (value as RadarSource) ?? 'auto'
  },
})

const categoryOptions = computed<SelectOption[]>(() =>
  ASSIGNMENT_CATEGORIES.map(value => ({ value, label: t(`assignments.categories.${value}`) })),
)

const categoryModel = computed<number | string | null>({
  get: () => category.value,
  set: value => {
    category.value = (value as AssignmentCategory | null) ?? null
  },
})

const missingOptions = computed<SelectOption[]>(() => [
  {
    value: 'exclude',
    label: t('statistics.missing_exclude'),
    sublabel: t('statistics.missing_excludeHint'),
  },
  { value: 'zero', label: t('statistics.missing_zero'), sublabel: t('statistics.missing_zeroHint') },
])

const missingModel = computed<number | string | null>({
  get: () => missing.value,
  set: value => {
    missing.value = (value as MissingMode) ?? 'exclude'
  },
})

/**
 * The subjects on offer, taken from whichever overview this mode already loaded.
 *
 * For the grade records, axes with no work in them are left out: asking for a
 * trajectory there returns an empty series, which looks like a failure rather
 * than an empty timetable.
 */
const offeringOptions = computed<SelectOption[]>(() => {
  if (mode.value === 'lessons') {
    return (radar.value?.axes ?? [])
      .filter(axis => axis.lesson_count > 0)
      .map(axis => ({ value: axis.offering_id, label: axis.subject }))
  }
  if (mode.value === 'assignments') {
    return (summary.value?.axes ?? [])
      .filter(axis => axis.assignment_count > 0)
      .map(axis => ({ value: axis.offering_id, label: axis.subject }))
  }
  return attendanceSubjects.value.map(row => ({ value: row.offering_id, label: row.subject }))
})

const offeringsLoading = computed(() => {
  if (mode.value === 'lessons') return radarLoading.value
  if (mode.value === 'assignments') return summaryLoading.value
  return attendanceLoading.value
})

const offeringModel = computed<number | string | null>({
  get: () => {
    if (mode.value === 'lessons') return lessonOfferingId.value
    if (mode.value === 'assignments') return assignmentOfferingId.value
    return attendanceOfferingId.value
  },
  set: value => {
    const picked = value === null ? null : Number(value)
    if (mode.value === 'lessons') lessonOfferingId.value = picked
    else if (mode.value === 'assignments') assignmentOfferingId.value = picked
    else attendanceOfferingId.value = picked
  },
})

const subjectPlaceholder = computed(() => {
  if (offeringsLoading.value) return t('common.loading')
  if (mode.value === 'attendance') return t('statistics.allSubjects')
  return t('statistics.selectSubject')
})

// ─── Loading ─────────────────────────────────────────────────────────────────

async function loadRadar() {
  radarLoading.value = true
  radarError.value = ''
  try {
    const { data } = await getSubjectRadarApi(props.student.id, {
      quarter: quarter.value,
      source: source.value,
    })
    radar.value = data
    // Keep a subject the reader already chose if the new quarter still has it.
    const stillOffered = data.axes.some(
      axis => axis.offering_id === lessonOfferingId.value && axis.lesson_count > 0,
    )
    if (!stillOffered) {
      lessonOfferingId.value = (offeringOptions.value[0]?.value as number | undefined) ?? null
    }
  } catch (error) {
    radar.value = null
    radarError.value = readAnalyticsError(error) || t('statistics.loadError')
  } finally {
    radarLoading.value = false
  }
}

async function loadTrajectory() {
  if (!lessonOfferingId.value) {
    trajectory.value = null
    return
  }
  trajectoryLoading.value = true
  trajectoryError.value = ''
  try {
    const { data } = await getStudentTrajectoryApi(props.student.id, lessonOfferingId.value, {
      quarter: quarter.value,
      include_class_stats: includeClassStats.value,
    })
    trajectory.value = data
  } catch (error) {
    trajectory.value = null
    trajectoryError.value = readAnalyticsError(error) || t('statistics.loadError')
  } finally {
    trajectoryLoading.value = false
  }
}

async function loadSummary() {
  summaryLoading.value = true
  summaryError.value = ''
  try {
    const { data } = await getAssignmentSummaryApi(props.student.id, {
      quarter: quarter.value,
      category: category.value ?? undefined,
      missing: missing.value,
    })
    summary.value = data
    const stillOffered = data.axes.some(
      axis => axis.offering_id === assignmentOfferingId.value && axis.assignment_count > 0,
    )
    if (!stillOffered) {
      assignmentOfferingId.value = (offeringOptions.value[0]?.value as number | undefined) ?? null
    }
  } catch (error) {
    summary.value = null
    summaryError.value = readAnalyticsError(error) || t('statistics.loadError')
  } finally {
    summaryLoading.value = false
  }
}

async function loadAssignmentTrajectory() {
  if (!assignmentOfferingId.value) {
    assignmentTrajectory.value = null
    return
  }
  assignmentTrajectoryLoading.value = true
  assignmentTrajectoryError.value = ''
  try {
    const { data } = await getAssignmentTrajectoryApi(
      props.student.id,
      assignmentOfferingId.value,
      {
        category: category.value ?? undefined,
        missing: missing.value,
        include_class_stats: includeClassStats.value,
      },
    )
    assignmentTrajectory.value = data
  } catch (error) {
    assignmentTrajectory.value = null
    assignmentTrajectoryError.value = readAnalyticsError(error) || t('statistics.loadError')
  } finally {
    assignmentTrajectoryLoading.value = false
  }
}

async function loadAttendance() {
  attendanceLoading.value = true
  attendanceError.value = ''
  try {
    const { data } = await getAttendanceSummaryApi(props.student.id, {
      quarter: quarter.value,
      offering: attendanceOfferingId.value ?? undefined,
    })
    attendance.value = data
    // `by_subject` is the picker's only source, and narrowing to one subject
    // shrinks it to that subject alone — which would leave the reader unable to
    // pick anything else back. So the list is only ever taken from an
    // unfiltered answer, and kept while a filter is applied.
    if (!attendanceOfferingId.value) {
      // A break or a club has no offering, so there is nothing to filter by —
      // those rows stay in the table but never reach the picker.
      attendanceSubjects.value = (data.by_subject ?? [])
        .filter((row): row is typeof row & { offering_id: number } => row.offering_id !== null)
        .map(row => ({ offering_id: row.offering_id, subject: row.subject }))
    }
  } catch (error) {
    attendance.value = null
    attendanceError.value = readAnalyticsError(error) || t('statistics.loadError')
  } finally {
    attendanceLoading.value = false
  }
}

// ─── Open / refetch ──────────────────────────────────────────────────────────

watch(
  () => props.open,
  isOpen => {
    if (!isOpen) return
    mode.value = 'lessons'
    tab.value = 'subjects'
    source.value = 'auto'
    category.value = null
    missing.value = 'exclude'
    lessonOfferingId.value = null
    assignmentOfferingId.value = null
    attendanceOfferingId.value = null
    attendanceSubjects.value = []
    trajectory.value = null
    assignmentTrajectory.value = null

    // The calendar's guess shows immediately; the academic year's own answer
    // replaces it when it lands, unless the reader has already picked one.
    // The panel watchers below see `open` flip and do the first fetch — calling
    // it here as well would be the same request twice.
    const seeded = currentQuarter.value
    quarter.value = seeded
    loadCurrentQuarter().then(() => {
      if (quarter.value === seeded && currentQuarter.value !== seeded) {
        quarter.value = currentQuarter.value
      }
    })
  },
)

/**
 * Each panel fetches only while it is the one on screen — the modal covers five
 * endpoints, and loading all of them on open would be four wasted requests for
 * the reader who never leaves the first chart.
 */
watch([() => props.open, mode, quarter, source], () => {
  if (props.open && mode.value === 'lessons') loadRadar()
})

watch([() => props.open, mode, tab, lessonOfferingId, quarter, includeClassStats], () => {
  if (props.open && mode.value === 'lessons' && tab.value === 'trajectory') loadTrajectory()
})

watch([() => props.open, mode, quarter, category, missing], () => {
  if (props.open && mode.value === 'assignments') loadSummary()
})

watch([() => props.open, mode, tab, assignmentOfferingId, category, missing, includeClassStats], () => {
  if (props.open && mode.value === 'assignments' && tab.value === 'trajectory') {
    loadAssignmentTrajectory()
  }
})

watch([() => props.open, mode, quarter, attendanceOfferingId], () => {
  if (props.open && mode.value === 'attendance') loadAttendance()
})
</script>
