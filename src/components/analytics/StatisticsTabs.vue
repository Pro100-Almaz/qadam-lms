<template>
  <!-- Segmented: the record on offer — lesson marks, assignment marks, the
       register. A pill group, because the three are alternatives of equal
       standing rather than sections of one thing. -->
  <div
    v-if="variant === 'segmented'"
    class="inline-flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1 dark:bg-white/5"
    role="tablist"
  >
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      role="tab"
      :aria-selected="item.value === modelValue"
      class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition"
      :class="
        item.value === modelValue
          ? 'bg-white text-gray-800 shadow-theme-xs dark:bg-gray-900 dark:text-white/90'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
      "
      @click="emit('update:modelValue', item.value)"
    >
      <component :is="item.icon" v-if="item.icon" class="h-3.5 w-3.5" />
      {{ item.label }}
    </button>
  </div>

  <!-- Underline: the view within a record. Sections of one thing, so they read
       as tabs of the panel below rather than as a second choice of subject. -->
  <template v-else>
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      role="tab"
      :aria-selected="item.value === modelValue"
      class="-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition"
      :class="
        item.value === modelValue
          ? 'border-brand-500 text-brand-600 dark:text-brand-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
      "
      @click="emit('update:modelValue', item.value)"
    >
      {{ item.label }}
    </button>
  </template>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

export interface StatisticsTabItem {
  value: string
  label: string
  /** Segmented only — an underline tab is wide enough to say it in words. */
  icon?: Component
}

/**
 * The two switchers the statistics modals share.
 *
 * `segmented` is the outer one and `underline` the inner one, and which is which
 * carries meaning: the outer switch changes *which record* is being read — a
 * different endpoint family, different counting rules, numbers that will not
 * agree with the previous panel's — while the inner one only re-cuts the record
 * already chosen. Using the same control for both would hide that.
 */
withDefaults(
  defineProps<{
    modelValue: string
    items: StatisticsTabItem[]
    variant?: 'segmented' | 'underline'
  }>(),
  { variant: 'underline' },
)

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>
