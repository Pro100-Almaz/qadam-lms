<template>
  <div ref="dropdownRef" class="relative min-w-0">
    <button
      type="button"
      class="flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-3 text-left text-sm text-gray-700 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
      class="absolute left-0 top-full z-50 mt-1 max-h-60 w-full max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
      role="listbox"
    >
      <button
        type="button"
        role="option"
        :aria-selected="modelValue === ''"
        class="flex min-h-10 w-full items-center px-3 text-left text-sm text-gray-700 transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden dark:text-gray-300 dark:hover:bg-white/5 dark:focus:bg-white/5"
        :class="{ 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400': modelValue === '' }"
        @click="selectClassGroup('')"
      >
        {{ allLabel }}
      </button>
      <button
        v-for="classGroup in classGroups"
        :key="classGroup.id"
        type="button"
        role="option"
        :aria-selected="classGroup.id === modelValue"
        class="flex min-h-10 w-full items-center px-3 text-left text-sm text-gray-700 transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden dark:text-gray-300 dark:hover:bg-white/5 dark:focus:bg-white/5"
        :class="{ 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400': classGroup.id === modelValue }"
        @click="selectClassGroup(classGroup.id)"
      >
        {{ classGroup.display_name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { ClassGroup } from '@/types/academic'

const props = defineProps<{
  modelValue: number | ''
  classGroups: ClassGroup[]
  allLabel: string
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [classGroupId: number | '']
}>()

const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const selectedLabel = computed(() => {
  if (props.modelValue === '') return props.allLabel
  return props.classGroups.find(classGroup => classGroup.id === props.modelValue)?.display_name ?? props.allLabel
})

function selectClassGroup(classGroupId: number | '') {
  emit('update:modelValue', classGroupId)
  open.value = false
}

function closeOnOutsideClick(event: MouseEvent) {
  if (!dropdownRef.value?.contains(event.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', closeOnOutsideClick))
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutsideClick))
</script>
