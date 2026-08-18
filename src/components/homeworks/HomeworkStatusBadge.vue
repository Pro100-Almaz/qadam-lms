<template>
  <span
    class="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
    :class="active
      ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
      : 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400'"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="active ? 'bg-success-500' : 'bg-warning-500'"></span>
    {{ active ? t('homeworks.statuses.active') : t('homeworks.statuses.pending') }}
  </span>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ active: boolean }>()

const { t } = useI18n()
</script>
