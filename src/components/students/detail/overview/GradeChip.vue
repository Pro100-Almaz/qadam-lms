<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums"
    :class="[sizeClass, toneClass]"
  >
    {{ grade ?? '—' }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** A 2–5 quarter grade as a chip. The number is always visible; colour only reinforces it. */
const props = withDefaults(defineProps<{ value: number | null; size?: 'sm' | 'md' }>(), { size: 'md' })

const grade = computed(() => (props.value ? Math.round(props.value) : null))

const sizeClass = computed(() => (props.size === 'sm' ? 'h-6 w-6 text-theme-xs' : 'h-8 w-8 text-theme-sm'))

const toneClass = computed(() => {
  const g = grade.value
  if (g === null) return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
  if (g >= 5) return 'bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400'
  if (g >= 4) return 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
  if (g >= 3) return 'bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
  return 'bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400'
})
</script>
