<template>
  <span
    class="inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
    :class="statusClasses[status]"
  >
    {{ t(`clubs.statuses.${status}`) }}
  </span>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ClubStatus } from '@/api/clubs'

defineProps<{
  status: ClubStatus
}>()

const { t } = useI18n()

const statusClasses: Record<ClubStatus, string> = {
  pending:
    'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400',
  active:
    'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400',
  deleted: 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400',
  finished: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
}
</script>
