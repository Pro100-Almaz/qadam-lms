<template>
  <div ref="dropdownRef" class="relative min-w-0">
    <button
      type="button"
      class="flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-3 text-left text-sm text-gray-700 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 sm:min-w-48"
      :disabled="disabled"
      :aria-label="ariaLabel"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="open = !open"
      @keydown.esc="open = false"
    >
      <span class="min-w-0 truncate">{{ selectedLabel }}</span>
      <ChevronDown
        class="h-4 w-4 shrink-0 text-gray-400 transition-transform"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <div
      v-if="open"
      class="absolute left-0 top-full z-50 mt-1 max-h-60 w-full min-w-48 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
      role="listbox"
    >
      <button
        v-if="allowEmpty"
        type="button"
        role="option"
        :aria-selected="modelValue === ''"
        class="flex min-h-10 w-full items-center px-3 text-left text-sm text-gray-700 transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden dark:text-gray-300 dark:hover:bg-white/5 dark:focus:bg-white/5"
        :class="{ 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400': modelValue === '' }"
        @click="selectYear('')"
      >
        {{ allLabel }}
      </button>
      <button
        v-for="year in years"
        :key="year.id"
        type="button"
        role="option"
        :aria-selected="String(year.id) === modelValue"
        class="flex min-h-10 w-full items-center px-3 text-left text-sm text-gray-700 transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden dark:text-gray-300 dark:hover:bg-white/5 dark:focus:bg-white/5"
        :class="{ 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400': String(year.id) === modelValue }"
        @click="selectYear(String(year.id))"
      >
        {{ year.year }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { ClubAcademicYear } from '@/api/clubs'

const props = withDefaults(
  defineProps<{
    modelValue: string
    years: ClubAcademicYear[]
    allLabel: string
    ariaLabel?: string
    allowEmpty?: boolean
    disabled?: boolean
  }>(),
  {
    allowEmpty: true,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [yearId: string]
}>()

const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const selectedLabel = computed(() => {
  if (!props.modelValue) return props.allLabel
  return props.years.find(year => String(year.id) === props.modelValue)?.year ?? props.allLabel
})

function selectYear(yearId: string) {
  emit('update:modelValue', yearId)
  open.value = false
}

function closeOnOutsideClick(event: MouseEvent) {
  if (!dropdownRef.value?.contains(event.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', closeOnOutsideClick))
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutsideClick))
</script>
