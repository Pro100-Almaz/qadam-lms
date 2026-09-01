<template>
  <button type="button" v-bind="$attrs" :class="buttonClass" @click="open = true">
    <ChartColumnBig :class="iconClass" />
    <span v-if="!iconOnly">{{ label ?? t('statistics.button') }}</span>
  </button>

  <StudentStatisticsModal v-if="student" :open="open" :student="student" @close="open = false" />

  <AssignmentStatisticsModal
    v-else-if="kind === 'assignments'"
    :open="open"
    :offerings="offerings ?? []"
    :default-offering-id="defaultOfferingId"
    :offerings-loading="offeringsLoading"
    @close="open = false"
  />

  <AttendanceStatisticsModal
    v-else-if="kind === 'attendance'"
    :open="open"
    :offerings="offerings ?? []"
    :class-groups="classGroups ?? []"
    :default-offering-id="defaultOfferingId"
    :default-class-group-id="defaultClassGroupId"
    :offerings-loading="offeringsLoading"
    @close="open = false"
  />

  <ClassStatisticsModal
    v-else
    :open="open"
    :offerings="offerings ?? []"
    :default-offering-id="defaultOfferingId"
    :offerings-loading="offeringsLoading"
    @close="open = false"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChartColumnBig } from 'lucide-vue-next'
import StudentStatisticsModal, {
  type StatisticsStudentTarget,
} from '@/components/analytics/StudentStatisticsModal.vue'
import ClassStatisticsModal, {
  type StatisticsOfferingOption,
} from '@/components/analytics/ClassStatisticsModal.vue'
import AssignmentStatisticsModal from '@/components/analytics/AssignmentStatisticsModal.vue'
import AttendanceStatisticsModal, {
  type StatisticsClassGroupOption,
} from '@/components/analytics/AttendanceStatisticsModal.vue'

/**
 * The statistics entry point: a button that owns its modal, so a screen adds
 * the feature in one tag — the same shape as `GradeReportButton`.
 *
 * Which modal opens follows from the target rather than a separate prop: pass
 * `student` and it opens the per-student modal, which covers all three records
 * behind its own switcher. Pass `offerings` and it opens a class-wide grid, and
 * there `kind` picks the record — a class grid can only show one, because the
 * three have different columns, different filters and different counting rules.
 *
 * `kind` should follow what the host screen is *about*: a subject's page shows
 * its lesson-topic gradebook, the grading page its assignments, the attendance
 * page its registers. A button that showed a different record from the page
 * around it would read as a contradiction of the table beside it.
 */
const props = withDefaults(
  defineProps<{
    /** Charts one student, all three records. Mutually exclusive with `offerings`. */
    student?: StatisticsStudentTarget | null
    /**
     * Charts a class. Staff and the offering's own teachers only — the grids
     * name every student in the class, so a student or parent gets a 403.
     */
    offerings?: StatisticsOfferingOption[]
    /** Which class record to chart. Ignored when `student` is given. */
    kind?: 'topics' | 'assignments' | 'attendance'
    /** `attendance` only — the class groups its overview tab may aggregate. */
    classGroups?: StatisticsClassGroupOption[]
    defaultOfferingId?: number | null
    defaultClassGroupId?: number | null
    offeringsLoading?: boolean
    /** `primary` for a page header's own action, `outline` next to other controls. */
    variant?: 'primary' | 'outline'
    size?: 'md' | 'sm'
    iconOnly?: boolean
    label?: string
  }>(),
  { variant: 'outline', size: 'md', kind: 'topics' },
)

// Two roots — the button and the modal's teleport — so a host's `class` has to
// be routed to the button by hand rather than falling through to both.
defineOptions({ inheritAttrs: false })

const { t } = useI18n()
const open = ref(false)

const buttonClass = computed(() => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition'
  const size = props.size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'
  const variant =
    props.variant === 'primary'
      ? 'bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600'
      : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5'
  return `${base} ${size} ${variant}`
})

const iconClass = computed(() => (props.size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'))
</script>
