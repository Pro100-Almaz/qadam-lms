<template>
  <div
    class="rounded-lg border bg-white p-4 dark:bg-gray-900"
    :class="error ? 'border-error-500' : 'border-gray-300 dark:border-gray-700'"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-xs text-gray-500 dark:text-gray-400">
        {{ t('homeworks.selectedClasses', { count: modelValue.length }) }}
      </p>
      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="disabled || !options.length || allSelected"
          class="rounded-md px-2 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:bg-brand-500/10"
          @click="emit('update:modelValue', options.map(option => option.offeringId))"
        >
          {{ t('homeworks.selectAll') }}
        </button>
        <button
          type="button"
          :disabled="disabled || modelValue.length === 0"
          class="rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/5"
          @click="emit('update:modelValue', [])"
        >
          {{ t('common.reset') }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="mt-4 space-y-3">
      <div v-for="index in 2" :key="index" class="h-9 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"></div>
    </div>

    <p v-else-if="!options.length" class="mt-4 text-sm text-gray-500 dark:text-gray-400">
      {{ emptyLabel }}
    </p>

    <div v-else class="mt-4 max-h-72 space-y-4 overflow-y-auto pr-1">
      <div v-for="grade in gradeRows" :key="grade.number" class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          :disabled="disabled"
          class="w-16 shrink-0 rounded-md px-2 py-1 text-left text-xs font-semibold text-gray-600 transition hover:text-brand-500 disabled:cursor-not-allowed dark:text-gray-400"
          @click="toggleGrade(grade)"
        >
          {{ t('homeworks.gradeShort', { number: grade.number }) }}
        </button>
        <button
          v-for="option in grade.options"
          :key="option.offeringId"
          type="button"
          :disabled="disabled"
          :aria-pressed="isSelected(option.offeringId)"
          class="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          :class="isSelected(option.offeringId)
            ? 'border-brand-500 bg-brand-50 text-brand-600 dark:border-brand-500/50 dark:bg-brand-500/10 dark:text-brand-400'
            : 'border-gray-200 bg-white text-gray-600 hover:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'"
          @click="toggle(option.offeringId)"
        >
          <Check v-if="isSelected(option.offeringId)" class="h-3 w-3" />
          {{ option.displayName }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check } from 'lucide-vue-next'
import type { TeacherOfferingOption } from '@/composables/useTeacherOfferings'

interface GradeRow {
  number: number
  options: TeacherOfferingOption[]
}

const props = defineProps<{
  modelValue: number[]
  options: TeacherOfferingOption[]
  emptyLabel: string
  loading?: boolean
  disabled?: boolean
  error?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number[]] }>()

const { t } = useI18n()

const gradeRows = computed<GradeRow[]>(() => {
  const rows = new Map<number, TeacherOfferingOption[]>()
  props.options.forEach(option => {
    const existing = rows.get(option.gradeLevel)
    if (existing) existing.push(option)
    else rows.set(option.gradeLevel, [option])
  })
  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([number, options]) => ({ number, options }))
})

const allSelected = computed(
  () => props.options.length > 0 && props.options.every(option => isSelected(option.offeringId)),
)

function isSelected(offeringId: number): boolean {
  return props.modelValue.includes(offeringId)
}

function toggle(offeringId: number): void {
  emit(
    'update:modelValue',
    isSelected(offeringId)
      ? props.modelValue.filter(value => value !== offeringId)
      : [...props.modelValue, offeringId],
  )
}

function toggleGrade(grade: GradeRow): void {
  const ids = grade.options.map(option => option.offeringId)
  emit(
    'update:modelValue',
    ids.every(isSelected)
      ? props.modelValue.filter(value => !ids.includes(value))
      : [...new Set([...props.modelValue, ...ids])],
  )
}
</script>
