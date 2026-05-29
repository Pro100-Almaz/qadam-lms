<template>
  <div class="flex items-center gap-2">
    <button
      v-for="q in [1, 2, 3, 4]"
      :key="q"
      type="button"
      :aria-pressed="modelValue === q"
      @click="emit('update:modelValue', q)"
      :class="[
        'flex h-9 w-16 items-center justify-center rounded-lg text-sm font-medium transition',
        modelValue === q
          ? 'bg-brand-500 text-white shadow-sm'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5',
      ]"
    >
      Q{{ q }}
    </button>
    <span
      v-if="loading"
      class="ml-3 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500"
    >
      <Loader2 class="h-3.5 w-3.5 animate-spin" />
      {{ t('common.loading') }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

defineProps<{
  modelValue: number
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const { t } = useI18n()
</script>
