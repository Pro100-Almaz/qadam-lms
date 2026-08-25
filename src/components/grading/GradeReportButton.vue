<template>
  <button type="button" v-bind="$attrs" :class="buttonClass" @click="open = true">
    <Download :class="iconClass" />
    <span v-if="!iconOnly">{{ label ?? t('gradeReport.button') }}</span>
  </button>

  <GradeReportModal
    :open="open"
    :student="student"
    :subjects="subjects"
    :classes="classes"
    :default-class-group-id="defaultClassGroupId"
    :allow-student-scope="allowStudentScope"
    :allow-layout-choice="allowLayoutChoice"
    :classes-loading="classesLoading"
    @close="open = false"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download } from 'lucide-vue-next'
import GradeReportModal, {
  type GradeReportClassOption,
  type GradeReportStudentTarget,
  type GradeReportSubjectOption,
} from '@/components/grading/GradeReportModal.vue'

/**
 * The download entry point: a button that owns the report modal, so a screen
 * adds the feature in one tag. Everything but the styling is handed straight to
 * `GradeReportModal`, which is where the shape of the report is decided.
 */
const props = withDefaults(
  defineProps<{
    student?: GradeReportStudentTarget | null
    subjects?: GradeReportSubjectOption[]
    classes?: GradeReportClassOption[]
    defaultClassGroupId?: number | null
    allowStudentScope?: boolean
    /** Homeroom screens only — see `GradeReportModal`. */
    allowLayoutChoice?: boolean
    classesLoading?: boolean
    /** `primary` for a page header's own action, `outline` next to other controls. */
    variant?: 'primary' | 'outline'
    size?: 'md' | 'sm'
    iconOnly?: boolean
    label?: string
  }>(),
  { variant: 'outline', size: 'md' },
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
