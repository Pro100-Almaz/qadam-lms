<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[100000] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-3 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @mousedown="backdrop.onMouseDown"
        @mouseup="backdrop.onMouseUp"
      >
        <!-- Below `sm` the panel grows with its content and the backdrop
             scrolls: a phone has no height to spare for a fixed header stack
             above a body that would be left a sliver. From `sm` up only the
             body scrolls. -->
        <div
          class="flex w-full flex-col rounded-xl bg-white shadow-xl sm:max-h-[calc(100dvh-2rem)] dark:bg-gray-900"
          :class="widthClass"
        >
          <!-- Header -->
          <!-- Every row but the body is `shrink-0`: the body's flex basis is
               its content, so a tall chart would otherwise squeeze them — the
               tab row, whose sideways overflow lets it shrink to nothing,
               first of all. -->
          <div
            class="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 sm:px-6 dark:border-gray-800"
          >
            <div class="min-w-0">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ title }}</h3>
              <p class="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
              :aria-label="t('common.cancel')"
              @click="emit('close')"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <!-- Optional switchers. Two rows at most: the record on offer, then
               the view within it — filters below are always the third row. -->
          <div
            v-if="$slots.modes"
            class="shrink-0 border-b border-gray-200 px-4 py-3 sm:px-6 dark:border-gray-800"
          >
            <slot name="modes" />
          </div>

          <!-- Scrolls sideways rather than wrapping: a wrapped tab row on a
               narrow screen reads as two rows of unrelated tabs. -->
          <div
            v-if="$slots.tabs"
            class="flex shrink-0 gap-1 overflow-x-auto border-b border-gray-200 px-4 no-scrollbar sm:px-6 dark:border-gray-800"
          >
            <slot name="tabs" />
          </div>

          <div
            v-if="$slots.filters"
            class="grid shrink-0 grid-cols-2 items-end gap-3 border-b border-gray-200 px-4 py-4 sm:flex sm:flex-wrap sm:px-6 dark:border-gray-800"
          >
            <slot name="filters" />
          </div>

          <!-- Body. The only scrolling region, so the filters stay reachable
               however tall a heatmap grows. -->
          <div class="px-4 py-5 sm:min-h-0 sm:flex-1 sm:overflow-y-auto sm:px-6">
            <slot />
          </div>

          <!-- Footer -->
          <div
            class="flex shrink-0 flex-col items-stretch gap-3 border-t border-gray-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-800"
          >
            <p class="text-[11px] text-gray-400 dark:text-gray-500">{{ note }}</p>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              @click="emit('close')"
            >
              {{ t('statistics.close') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'
import { useBackdropClose } from '@/composables/useBackdropClose'

/**
 * The chrome every statistics modal wears: title, optional switcher rows, a
 * filter strip, one scrolling body, and a footer carrying the counting rule.
 *
 * It exists because the caveat line in the footer is not decoration — each of
 * the three records counts missing data differently, and a modal that dropped
 * the note would be showing numbers without the rule they were computed under.
 * Making it a required prop of the shell means a new modal cannot forget it.
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    subtitle: string
    /** The footer caveat — how this modal's endpoint treats what is missing. */
    note: string
    /** Heatmaps need the room; a single chart looks lost in it. */
    size?: 'md' | 'lg' | 'xl'
  }>(),
  { size: 'lg' },
)

const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n()
const backdrop = useBackdropClose(() => emit('close'))

const WIDTHS = { md: 'max-w-3xl', lg: 'max-w-4xl', xl: 'max-w-6xl' } as const

const widthClass = computed(() => WIDTHS[props.size])
</script>
