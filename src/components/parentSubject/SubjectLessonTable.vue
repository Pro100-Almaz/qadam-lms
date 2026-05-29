<template>
  <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
    <div class="border-b border-gray-200 px-5 py-3.5 dark:border-gray-800">
      <h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">
        {{ t('parentChildSubject.lessonList') }} — Q{{ quarter }}
      </h2>
    </div>

    <div v-if="lessons.length === 0" class="flex flex-col items-center justify-center px-5 py-16">
      <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <BookOpen class="h-6 w-6 text-gray-400 dark:text-gray-500" />
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ t('parentChildSubject.noLessonsThisQuarter') }}
      </p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-100 dark:border-gray-800">
            <th class="w-10 px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400" scope="col">#</th>
            <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400" scope="col">{{ t('common.name') }}</th>
            <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400" scope="col">{{ t('lessons.date') }}</th>
            <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400" scope="col">{{ t('lessons.points') }}</th>
            <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400" scope="col">{{ t('lessons.grade') }}</th>
            <th class="w-10 px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400" scope="col"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="lesson in lessons"
            :key="lesson.lesson_id"
            class="cursor-pointer border-b border-gray-100 last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors focus:outline-none focus-visible:bg-gray-50 dark:focus-visible:bg-white/[0.02]"
            tabindex="0"
            role="button"
            :aria-label="`${t('parentChildSubject.viewLesson')} — ${lesson.lesson_title}`"
            @click="emit('lesson-click', lesson)"
            @keydown.enter.prevent="emit('lesson-click', lesson)"
            @keydown.space.prevent="emit('lesson-click', lesson)"
          >
            <td class="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{{ lesson.order }}</td>
            <td class="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
              <div class="flex items-center gap-2">
                <span>{{ lesson.lesson_title }}</span>
                <MessageSquare
                  v-if="lesson.comment"
                  class="h-3.5 w-3.5 shrink-0 text-brand-500 dark:text-brand-400"
                  :aria-label="t('parentChildSubject.hasComment')"
                />
              </div>
            </td>
            <td class="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{{ formatDate(lesson.lesson_date) }}</td>
            <td class="px-5 py-3 text-sm">
              <template v-if="lesson.earned_points !== null">
                <span class="font-semibold text-gray-800 dark:text-white/90">{{ lesson.earned_points }}</span>
                <span class="text-gray-400 dark:text-gray-500">/{{ lesson.max_points }}</span>
              </template>
              <span v-else class="text-xs text-gray-400 dark:text-gray-500">—</span>
            </td>
            <td class="px-5 py-3">
              <span
                v-if="lesson.earned_points !== null"
                class="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                :class="gradeCircleClass(percentOf(lesson))"
                :aria-label="`${t('lessons.grade')} ${scoreToGrade(percentOf(lesson))}`"
              >
                {{ scoreToGrade(percentOf(lesson)) }}
              </span>
              <span v-else class="text-xs text-gray-400 dark:text-gray-500">—</span>
            </td>
            <td class="px-5 py-3 text-right">
              <ChevronRight class="ml-auto h-4 w-4 text-gray-300 dark:text-gray-600" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { BookOpen, ChevronRight, MessageSquare } from 'lucide-vue-next'
import type { ParentChildLessonGrade } from '@/types/parentSelf'
import { useGradeHelpers } from '@/composables/useGradeHelpers'

defineProps<{
  lessons: ParentChildLessonGrade[]
  quarter: number
}>()

const emit = defineEmits<{
  (e: 'lesson-click', lesson: ParentChildLessonGrade): void
}>()

const { t } = useI18n()
const { gradeCircleClass, scoreToGrade } = useGradeHelpers()

function percentOf(lesson: ParentChildLessonGrade): number {
  if (lesson.earned_points === null || lesson.max_points === 0) return 0
  return (lesson.earned_points / lesson.max_points) * 100
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}
</script>
