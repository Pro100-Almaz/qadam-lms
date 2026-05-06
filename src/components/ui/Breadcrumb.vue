<template>
  <div class="flex items-center gap-3">
    <button
      @click="router.push(backTo)"
      class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
    >
      <ArrowLeft class="h-4 w-4" />
      {{ t('common.back') }}
    </button>
    <template v-for="(crumb, idx) in crumbs" :key="idx">
      <span class="text-sm text-gray-400 dark:text-gray-600">/</span>
      <router-link
        v-if="crumb.to"
        :to="crumb.to"
        class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        {{ crumb.label }}
      </router-link>
      <span v-else class="text-sm text-gray-800 dark:text-white/90">{{ crumb.label }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft } from 'lucide-vue-next'

defineProps<{
  backTo: string
  crumbs: Array<{ label: string; to?: string }>
}>()

const router = useRouter()
const { t } = useI18n()
</script>
