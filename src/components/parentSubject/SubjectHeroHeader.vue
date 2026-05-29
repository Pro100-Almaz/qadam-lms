<template>
  <div
    class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0 space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {{ subjectName }}
          </h1>
          <span :class="langBadgeClass(languageGroup)">
            {{ t('subjects.languages.' + languageGroup) }}
          </span>
          <span :class="statusBadgeClass(status)">
            {{ statusLabel(status) }}
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          <div class="flex items-center gap-1.5">
            <GraduationCap class="h-4 w-4" />
            <span>
              {{ teacherName || t('subjects.noTeacher') }}
            </span>
          </div>
          <div v-if="classGroupName" class="flex items-center gap-1.5">
            <Users class="h-4 w-4" />
            <span>{{ classGroupName }}</span>
          </div>
          <div v-if="academicYear" class="flex items-center gap-1.5">
            <CalendarDays class="h-4 w-4" />
            <span>{{ academicYear }}</span>
          </div>
        </div>
      </div>

      <div
        v-if="cumulativeGrade !== null"
        class="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-50 px-6 py-3 text-center dark:bg-brand-500/10"
      >
        <span class="text-3xl font-extrabold" :class="percentColor(cumulativeGrade)">
          {{ cumulativeGrade }}%
        </span>
        <span class="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
          {{ t('parentChildSubject.cumulative') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { GraduationCap, Users, CalendarDays } from 'lucide-vue-next'
import type { LanguageGroup, SubjectStatus } from '@/types/subject'
import { useGradeHelpers } from '@/composables/useGradeHelpers'

defineProps<{
  subjectName: string
  languageGroup: LanguageGroup
  status: SubjectStatus
  teacherName: string | null
  classGroupName: string | null
  academicYear: string | null
  cumulativeGrade: number | null
}>()

const { t } = useI18n()
const { percentColor } = useGradeHelpers()

function langBadgeClass(lang: LanguageGroup): string {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
  if (lang === 'kaz') return `${base} bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400`
  if (lang === 'rus') return `${base} bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400`
  return `${base} bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400`
}

function statusBadgeClass(s: SubjectStatus): string {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
  if (s === 'active') return `${base} bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400`
  if (s === 'archived') return `${base} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400`
  if (s === 'planned') return `${base} bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400`
  return `${base} bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400`
}

function statusLabel(s: SubjectStatus): string {
  if (s === 'active') return t('subjects.statusActive')
  if (s === 'archived') return t('subjects.archived')
  if (s === 'planned') return t('subjects.statusPlanned')
  return t('subjects.statusDisabled')
}
</script>
