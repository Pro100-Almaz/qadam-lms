<template>
  <Modal :fullScreenBackdrop="true" @close="emit('close')">
    <template #body>
      <div class="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-md dark:border-gray-800 dark:bg-gray-900">
        <!-- Header -->
        <div class="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {{ t('parentChildSubject.lessonDetails') }} · #{{ lesson.order }}
            </p>
            <h3 class="mt-1 text-base font-semibold text-gray-800 dark:text-white/90">
              {{ lesson.lesson_title }}
            </h3>
            <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1">
                <CalendarDays class="h-3.5 w-3.5" />
                {{ formatDate(lesson.lesson_date) }}
              </span>
              <span :class="statusBadgeClass(lesson.status)">
                {{ statusLabel(lesson.status) }}
              </span>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-300"
            :aria-label="t('common.cancel')"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="max-h-[70vh] overflow-y-auto px-6 py-5">
          <!-- Grade summary -->
          <div v-if="lesson.earned_points !== null" class="grid grid-cols-3 gap-3">
            <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40">
              <p class="text-[10px] font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {{ t('lessons.points') }}
              </p>
              <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
                {{ lesson.earned_points }}<span class="text-sm text-gray-400 dark:text-gray-500">/{{ lesson.max_points }}</span>
              </p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40">
              <p class="text-[10px] font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {{ t('parentChildSubject.scorePercent') }}
              </p>
              <p class="mt-1 text-lg font-semibold" :class="percentColor(percent)">
                {{ Math.round(percent) }}%
              </p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40">
              <p class="text-[10px] font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {{ t('lessons.grade') }}
              </p>
              <div class="mt-1 flex items-center">
                <span
                  class="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                  :class="gradeCircleClass(percent)"
                >
                  {{ scoreToGrade(percent) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Not graded yet -->
          <div
            v-else
            class="flex items-center gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40"
          >
            <Hourglass class="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
            <p class="text-sm text-gray-600 dark:text-gray-300">
              {{ t('parentChildSubject.notGradedYet') }}
            </p>
          </div>

          <!-- Teacher's comment -->
          <div class="mt-5">
            <h4 class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <MessageSquare class="h-3.5 w-3.5" />
              {{ t('parentChildSubject.teacherComment') }}
            </h4>
            <blockquote
              v-if="lesson.comment"
              class="rounded-lg border-l-4 border-brand-400 bg-brand-50 px-4 py-3 dark:border-brand-500 dark:bg-brand-500/10"
            >
              <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-200">"{{ lesson.comment }}"</p>
            </blockquote>
            <p v-else class="text-sm italic text-gray-400 dark:text-gray-500">
              {{ t('parentChildSubject.noComment') }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarDays, X, Hourglass, MessageSquare } from 'lucide-vue-next'
import Modal from '@/components/ui/Modal.vue'
import type { ParentChildLessonGrade, LessonStatus } from '@/types/parentSelf'
import { useGradeHelpers } from '@/composables/useGradeHelpers'

const props = defineProps<{
  lesson: ParentChildLessonGrade
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()
const { gradeCircleClass, scoreToGrade, percentColor } = useGradeHelpers()

const percent = computed(() => {
  if (props.lesson.earned_points === null || props.lesson.max_points === 0) return 0
  return (props.lesson.earned_points / props.lesson.max_points) * 100
})

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function statusBadgeClass(s: LessonStatus): string {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide'
  if (s === 'completed') return `${base} bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400`
  if (s === 'pending') return `${base} bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400`
  if (s === 'delayed') return `${base} bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400`
  return `${base} bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400`
}

function statusLabel(s: LessonStatus): string {
  if (s === 'completed') return t('lessons.statusCompleted')
  if (s === 'pending') return t('lessons.statusPending')
  if (s === 'delayed') return t('lessons.statusDelayed')
  return t('lessons.statusOnSchedule')
}
</script>
