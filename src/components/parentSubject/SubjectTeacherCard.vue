<template>
  <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
    <h3 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
      {{ t('parentChildSubject.teacher') }}
    </h3>

    <div v-if="teacher" class="flex items-start gap-4">
      <div class="shrink-0">
        <img
          v-if="teacher.avatar"
          :src="teacher.avatar"
          :alt="teacher.full_name"
          class="h-14 w-14 rounded-full object-cover"
        />
        <div
          v-else
          class="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-base font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
        >
          {{ initials(teacher.full_name) }}
        </div>
      </div>

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
          {{ teacher.full_name }}
        </p>
        <p v-if="teacher.occupation" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {{ teacher.occupation }}
        </p>
        <a
          v-if="teacher.email"
          :href="`mailto:${teacher.email}`"
          class="mt-2 inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          <Mail class="h-3.5 w-3.5" />
          <span class="truncate">{{ teacher.email }}</span>
        </a>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-6 text-center">
      <div class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <GraduationCap class="h-6 w-6 text-gray-400 dark:text-gray-500" />
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('subjects.noTeacher') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Mail, GraduationCap } from 'lucide-vue-next'
import type { ParentChildSubjectTeacher } from '@/types/parentSelf'

defineProps<{
  teacher: ParentChildSubjectTeacher | null
}>()

const { t } = useI18n()

function initials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
</script>
