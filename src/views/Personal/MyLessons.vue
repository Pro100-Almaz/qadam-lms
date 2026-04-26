<template>
  <AdminLayout>
    <div class="flex flex-col items-center justify-center py-20">
      <ClipboardList class="h-16 w-16 text-gray-300 dark:text-gray-600" />
      <h1 class="mt-4 text-xl font-semibold text-gray-800 dark:text-white/90">
        {{ $t('nav.myLessons') }}
      </h1>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ $t('common.noData') }}</p>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ClipboardList } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
</script>
