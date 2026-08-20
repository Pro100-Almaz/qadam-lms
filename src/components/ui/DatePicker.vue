<template>
  <span class="relative block">
    <flat-pickr
      :model-value="modelValue"
      :config="config"
      :disabled="disabled"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      :class="inputClass"
      @update:model-value="onUpdate"
    />
    <button
      v-if="clearable && modelValue"
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-300"
      :aria-label="t('common.reset')"
      @click="emit('update:modelValue', '')"
    >
      <X class="h-3.5 w-3.5" />
    </button>
    <CalendarDays
      v-else
      class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
    />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import flatPickr from 'vue-flatpickr-component'
import { Kazakh } from 'flatpickr/dist/l10n/kz'
import { Russian } from 'flatpickr/dist/l10n/ru'
import { CalendarDays, X } from 'lucide-vue-next'

/**
 * A single calendar-only date field. The model is always `YYYY-MM-DD` — the
 * format the API speaks — while the visible text is localised through
 * flatpickr's `altInput`.
 *
 * Typing is deliberately off (`allowInput: false`, `disableMobile: true`): the
 * date must be picked from the calendar, so a half-typed day can never reach a
 * filter or a form. That also means the field is read-only to the keyboard, and
 * clearing goes through the button rather than backspace.
 */
const props = withDefaults(
  defineProps<{
    /** `YYYY-MM-DD`, or `''` for no date. */
    modelValue: string
    /** `YYYY-MM-DD` bounds, e.g. one end of a range clamping the other. */
    minDate?: string
    maxDate?: string
    disabled?: boolean
    placeholder?: string
    ariaLabel?: string
    /** Shows an inline clear button in place of the calendar icon. */
    clearable?: boolean
    /** Height and border are the caller's, so filters and forms can differ. */
    inputClass?: string
  }>(),
  {
    minDate: '',
    maxDate: '',
    disabled: false,
    placeholder: '',
    ariaLabel: '',
    clearable: false,
    inputClass:
      'h-10 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 pr-9 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t, locale } = useI18n()

const pickerLocale = computed(() =>
  locale.value === 'kz' ? Kazakh : locale.value === 'ru' ? Russian : undefined,
)

const config = computed(() => ({
  altInput: true,
  altFormat: 'd M Y',
  dateFormat: 'Y-m-d',
  allowInput: false,
  disableMobile: true,
  minDate: props.minDate || undefined,
  maxDate: props.maxDate || undefined,
  locale: pickerLocale.value,
}))

/** flatpickr hands back `Date | string | Date[]`; the model stays a plain ISO day. */
function onUpdate(value: unknown) {
  emit('update:modelValue', typeof value === 'string' ? value : '')
}
</script>
