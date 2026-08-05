<template>
  <label class="block w-full">
    <span class="sr-only">{{ label }}</span>
    <span class="relative block">
      <flat-pickr
        v-model="selectedPeriod"
        :config="pickerConfig"
        class="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm text-gray-700 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
      />
      <CalendarDays
        class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      />
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import flatPickr from 'vue-flatpickr-component'
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect'
import { Kazakh } from 'flatpickr/dist/l10n/kz'
import { Russian } from 'flatpickr/dist/l10n/ru'
import { CalendarDays } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
  minDate: string
  maxDate: string
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [period: string]
}>()

const { locale } = useI18n()
const selectedPeriod = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
const pickerLocale = computed(() =>
  locale.value === 'kz' ? Kazakh : locale.value === 'ru' ? Russian : undefined,
)
const pickerConfig = computed(() => ({
  altInput: true,
  allowInput: false,
  disableMobile: true,
  minDate: `${props.minDate.slice(0, 7)}-01`,
  maxDate: monthLastDate(
    Number(props.maxDate.slice(0, 4)),
    Number(props.maxDate.slice(5, 7)),
  ),
  locale: pickerLocale.value,
  onReady: [
    (_dates: Date[], _dateString: string, instance: { calendarContainer: HTMLElement }) => {
      instance.calendarContainer.classList.add('club-history-month-picker')
    },
  ],
  plugins: [
    monthSelectPlugin({
      shorthand: false,
      dateFormat: 'Y-m',
      altFormat: 'F Y',
    }),
  ],
}))

function monthLastDate(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
}
</script>
