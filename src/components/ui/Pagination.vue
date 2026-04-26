<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <!-- Page size selector -->
    <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <span>{{ $t('pagination.show') }}</span>
      <select
        :value="pageSize"
        @change="$emit('update:pageSize', Number(($event.target as HTMLSelectElement).value))"
        class="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
      >
        <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
      </select>
      <span>{{ $t('pagination.of') }} {{ total }} {{ $t('pagination.entries') }}</span>
    </div>

    <!-- Page buttons -->
    <div class="flex items-center gap-1">
      <button
        @click="$emit('update:currentPage', currentPage - 1)"
        :disabled="currentPage <= 1"
        class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>

      <template v-for="page in visiblePages" :key="page">
        <span
          v-if="page === '...'"
          class="flex h-9 w-9 items-center justify-center text-sm text-gray-400"
        >...</span>
        <button
          v-else
          @click="$emit('update:currentPage', page)"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition"
          :class="
            page === currentPage
              ? 'bg-brand-500 text-white'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5'
          "
        >
          {{ page }}
        </button>
      </template>

      <button
        @click="$emit('update:currentPage', currentPage + 1)"
        :disabled="currentPage >= totalPages"
        class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
      >
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    total: number
    currentPage: number
    pageSize: number
    pageSizes?: number[]
  }>(),
  {
    pageSizes: () => [10, 25, 50],
  }
)

defineEmits<{
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const tp = totalPages.value
  const cp = props.currentPage

  if (tp <= 7) {
    for (let i = 1; i <= tp; i++) pages.push(i)
    return pages
  }

  pages.push(1)

  if (cp > 3) pages.push('...')

  const start = Math.max(2, cp - 1)
  const end = Math.min(tp - 1, cp + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (cp < tp - 2) pages.push('...')

  pages.push(tp)

  return pages
})
</script>
