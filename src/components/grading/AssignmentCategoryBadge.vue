<template>
  <span
    class="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
    :class="style.chip"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="style.dot"></span>
    {{ t(`assignments.categories.${category}`) }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SubjectAssignmentCategory } from '@/api/subjectAssignments'

/** Weight rises with the category: a lesson mark is routine, a final is not. */
const STYLES: Record<SubjectAssignmentCategory, { chip: string; dot: string }> = {
  lesson: {
    chip: 'bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/10 dark:text-blue-light-400',
    dot: 'bg-blue-light-500',
  },
  exam: {
    chip: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400',
    dot: 'bg-warning-500',
  },
  final: {
    chip: 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400',
    dot: 'bg-error-500',
  },
}

const props = defineProps<{ category: SubjectAssignmentCategory }>()

const { t } = useI18n()

const style = computed(() => STYLES[props.category] ?? STYLES.lesson)
</script>
