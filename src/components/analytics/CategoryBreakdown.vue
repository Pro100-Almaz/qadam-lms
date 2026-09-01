<template>
  <div v-if="rows.length" class="flex flex-wrap gap-2">
    <div
      v-for="row in rows"
      :key="row.category"
      class="flex items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800"
    >
      <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="DOTS[row.category]"></span>
      <span class="text-xs text-gray-500 dark:text-gray-400">
        {{ t(`assignments.categories.${row.category}`) }}
      </span>
      <span class="text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">
        {{ row.value.toFixed(1) }}%
      </span>
      <span class="text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
        {{ row.graded_count }} / {{ row.assignment_count }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ASSIGNMENT_CATEGORIES,
  type AssignmentCategory,
  type AssignmentCategoryBreakdown,
} from '@/api/analytics'

/**
 * The three assignment categories beside a mean that blends them.
 *
 * A single average over classwork, exams and finals is a weak number: those are
 * different kinds of work, weighted differently, and a student can be well
 * ahead on one and behind on another with the blended figure showing neither.
 *
 * Categories with nothing in them are dropped rather than shown at `0.0%` — the
 * API always sends all three, and an empty one printed as a zero reads as a
 * failing mark in a category the student was never set work in.
 */
const props = defineProps<{ breakdown: AssignmentCategoryBreakdown }>()

const { t } = useI18n()

/** Same hues as `AssignmentCategoryBadge`, so a category keeps one colour. */
const DOTS: Record<AssignmentCategory, string> = {
  lesson: 'bg-blue-light-500',
  exam: 'bg-warning-500',
  final: 'bg-error-500',
}

const rows = computed(() =>
  ASSIGNMENT_CATEGORIES.map(category => ({
    category,
    ...(props.breakdown?.[category] ?? { assignment_count: 0, graded_count: 0, value: 0 }),
  })).filter(row => row.assignment_count > 0),
)
</script>
