<template>
  <div v-if="loading" class="space-y-3" role="status" :aria-label="t('common.loading')">
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        v-for="index in 4"
        :key="index"
        class="h-[76px] animate-pulse rounded-lg bg-gray-100 dark:bg-white/5"
      ></div>
    </div>
    <div class="h-[340px] animate-pulse rounded-lg bg-gray-100 dark:bg-white/5"></div>
  </div>

  <div
    v-else-if="error"
    class="rounded-xl border border-error-200 bg-error-50 px-6 py-10 text-center dark:border-error-500/20 dark:bg-error-500/10"
  >
    <CircleAlert class="mx-auto h-8 w-8 text-error-500" />
    <p class="mt-3 text-sm text-error-600 dark:text-error-400">{{ error }}</p>
    <button
      type="button"
      class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-error-600"
      @click="emit('retry')"
    >
      {{ t('assignments.tryAgain') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CircleAlert } from 'lucide-vue-next'

/**
 * The loading and failure states every analytics panel shares.
 *
 * The skeleton mirrors the tiles-over-chart layout the real panels use, so the
 * modal does not resize when the data lands.
 */
defineProps<{ loading: boolean; error: string }>()

const emit = defineEmits<{ (e: 'retry'): void }>()

const { t } = useI18n()
</script>
