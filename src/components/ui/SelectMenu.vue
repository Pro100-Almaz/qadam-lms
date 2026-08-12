<template>
  <div ref="rootRef" class="relative min-w-0">
    <button
      ref="triggerRef"
      type="button"
      :class="triggerClass ?? defaultTriggerClass"
      :disabled="disabled"
      :aria-label="ariaLabel"
      :title="selectedTitle || placeholder"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="toggle"
      @keydown.esc="close"
    >
      <span class="flex min-w-0 flex-col">
        <span class="min-w-0 truncate">{{ selectedLabel || placeholder }}</span>
        <span v-if="selectedSublabel" class="min-w-0 truncate text-[11px] font-normal opacity-70">
          {{ selectedSublabel }}
        </span>
      </span>
      <ChevronDown
        v-if="!hideChevron"
        class="h-4 w-4 shrink-0 text-gray-400 transition-transform"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <!-- Teleported so the menu is never clipped by a scrolling table container. -->
    <Teleport to="body">
      <div
        v-if="open"
        ref="menuRef"
        class="fixed z-99999 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
        :style="menuStyle"
        role="listbox"
      >
        <button
          v-if="clearable"
          type="button"
          role="option"
          :aria-selected="modelValue === null || modelValue === undefined"
          class="flex min-h-10 w-full items-center px-3 text-left text-sm text-gray-500 transition hover:bg-gray-50 focus:outline-hidden dark:text-gray-400 dark:hover:bg-white/5"
          @click="pick(null)"
        >
          {{ clearLabel }}
        </button>
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          role="option"
          :aria-selected="option.value === modelValue"
          class="flex min-h-10 w-full flex-col items-start justify-center px-3 py-1.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 focus:outline-hidden dark:text-gray-300 dark:hover:bg-white/5"
          :class="{
            'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400':
              option.value === modelValue,
          }"
          @click="pick(option.value)"
        >
          <span class="min-w-0 break-words">{{ option.label }}</span>
          <span
            v-if="option.sublabel"
            class="min-w-0 break-words text-xs text-gray-500 dark:text-gray-400"
          >
            {{ option.sublabel }}
          </span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, type CSSProperties } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

export interface SelectOption {
  value: number | string
  label: string
  /** Secondary line under the label, e.g. the teacher behind a subject. */
  sublabel?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: number | string | null
    options: SelectOption[]
    placeholder?: string
    ariaLabel?: string
    disabled?: boolean
    clearable?: boolean
    clearLabel?: string
    /** Replaces the default trigger styling — used by grid cells. */
    triggerClass?: string
    hideChevron?: boolean
  }>(),
  { placeholder: '', clearLabel: '—' },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | string | null]
}>()

const defaultTriggerClass =
  'flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 text-left text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const MENU_MAX_HEIGHT = 280
const GAP = 4

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref<CSSProperties>({})

const selectedOption = computed(
  () => props.options.find(option => option.value === props.modelValue) ?? null,
)
const selectedLabel = computed(() => selectedOption.value?.label ?? '')
const selectedSublabel = computed(() => selectedOption.value?.sublabel ?? '')
const selectedTitle = computed(() =>
  [selectedLabel.value, selectedSublabel.value].filter(Boolean).join(' — '),
)

function updatePosition(): void {
  const trigger = triggerRef.value
  if (!trigger) return
  const rect = trigger.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom - GAP
  const spaceAbove = rect.top - GAP
  const dropDown = spaceBelow >= Math.min(MENU_MAX_HEIGHT, spaceAbove) || spaceBelow >= 180
  const maxHeight = Math.min(MENU_MAX_HEIGHT, dropDown ? spaceBelow : spaceAbove)

  const width = Math.max(rect.width, 160)
  const left = Math.min(Math.max(rect.left, 8), Math.max(window.innerWidth - width - 8, 8))

  menuStyle.value = {
    left: `${left}px`,
    width: `${width}px`,
    maxHeight: `${Math.max(maxHeight, 120)}px`,
    ...(dropDown
      ? { top: `${rect.bottom + GAP}px` }
      : { bottom: `${window.innerHeight - rect.top + GAP}px` }),
  }
}

function toggle(): void {
  if (props.disabled) return
  if (open.value) close()
  else openMenu()
}

function openMenu(): void {
  open.value = true
  updatePosition()
}

function close(): void {
  open.value = false
}

function pick(value: number | string | null): void {
  emit('update:modelValue', value)
  close()
}

function onDocumentClick(event: MouseEvent): void {
  const target = event.target as Node
  if (rootRef.value?.contains(target) || menuRef.value?.contains(target)) return
  close()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

watch(open, isOpen => {
  if (isOpen) {
    document.addEventListener('click', onDocumentClick, true)
    document.addEventListener('keydown', onKeydown)
    // `true` catches scrolling inside the table container, not just the page.
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
  } else {
    document.removeEventListener('click', onDocumentClick, true)
    document.removeEventListener('keydown', onKeydown)
    window.removeEventListener('scroll', updatePosition, true)
    window.removeEventListener('resize', updatePosition)
  }
})

watch(
  () => props.disabled,
  disabled => {
    if (disabled) close()
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick, true)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
})
</script>
