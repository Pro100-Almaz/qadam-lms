<template>
  <div ref="dropdownRef" class="relative">
    <button
      type="button"
      class="flex h-11 w-full items-center justify-between gap-3 rounded-lg border px-3.5 text-left shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
      :class="[statusSelectClasses[modelValue], { '!border-error-500': error }]"
      :aria-label="ariaLabel"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="open = !open"
      @keydown.esc="open = false"
    >
      <span class="text-sm font-medium">{{ t(`clubs.statuses.${modelValue}`) }}</span>
      <ChevronDown
        class="h-4 w-4 shrink-0 text-current opacity-60 transition-transform"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <div
      v-if="open"
      class="absolute left-0 top-full z-50 mt-1 w-full max-w-[calc(100vw-2rem)] divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-md dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-900"
      role="listbox"
    >
      <button
        v-for="status in statuses"
        :key="status"
        type="button"
        role="option"
        :aria-selected="status === modelValue"
        class="flex min-h-11 w-full items-center self-stretch px-3.5 text-left text-sm font-medium transition focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-brand-500/30"
        :class="[
          statusSelectClasses[status],
          { 'font-semibold': status === modelValue },
        ]"
        @click="selectStatus(status)"
      >
        {{ t(`clubs.statuses.${status}`) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import type { ClubStatus } from '@/api/clubs'

defineProps<{
  modelValue: ClubStatus
  ariaLabel?: string
  error?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [status: ClubStatus]
}>()

const { t } = useI18n()
const statuses: ClubStatus[] = ['pending', 'active', 'finished']
const statusSelectClasses: Record<ClubStatus, string> = {
  pending:
    'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400',
  active:
    'border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400',
  deleted:
    'border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400',
  finished:
    'border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function selectStatus(status: ClubStatus) {
  emit('update:modelValue', status)
  open.value = false
}

function closeOnOutsideClick(event: MouseEvent) {
  if (!dropdownRef.value?.contains(event.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', closeOnOutsideClick))
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutsideClick))
</script>
