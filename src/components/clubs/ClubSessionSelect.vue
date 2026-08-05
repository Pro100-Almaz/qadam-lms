<template>
  <div ref="dropdownRef" class="relative min-w-0">
    <button
      type="button"
      class="flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-3 text-left text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
      :disabled="disabled"
      :aria-label="ariaLabel"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="open = !open"
      @keydown.esc="open = false"
    >
      <span class="min-w-0 truncate">{{ selectedSessionLabel || placeholder }}</span>
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
        v-for="session in sessions"
        :key="session.id"
        type="button"
        role="option"
        :aria-selected="session.id === modelValue"
        class="flex min-h-11 w-full items-center px-3 text-left text-sm text-gray-700 transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden dark:text-gray-300 dark:hover:bg-white/5 dark:focus:bg-white/5"
        :class="{ 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400': session.id === modelValue }"
        @click="selectSession(session.id)"
      >
        <span class="min-w-0 break-words">{{ sessionLabel(session) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { ClubScheduleItem } from '@/api/clubs'

const props = defineProps<{
  modelValue: number | null
  sessions: ClubScheduleItem[]
  placeholder: string
  ariaLabel?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [sessionId: number]
}>()

const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const selectedSessionLabel = computed(() => {
  const session = props.sessions.find(item => item.id === props.modelValue)
  return session ? sessionLabel(session) : ''
})

function sessionLabel(session: ClubScheduleItem): string {
  const time = `${session.start_time.slice(0, 5)}–${session.end_time.slice(0, 5)}`
  return session.location ? `${time} · ${session.location}` : time
}

function selectSession(sessionId: number) {
  emit('update:modelValue', sessionId)
  open.value = false
}

function closeOnOutsideClick(event: MouseEvent) {
  if (!dropdownRef.value?.contains(event.target as Node)) open.value = false
}

watch(() => props.disabled, disabled => {
  if (disabled) open.value = false
})
onMounted(() => document.addEventListener('click', closeOnOutsideClick))
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutsideClick))
</script>
