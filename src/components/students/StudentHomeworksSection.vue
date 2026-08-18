<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <h2 v-if="heading" class="text-base font-semibold text-gray-800 dark:text-white/90">{{ heading }}</h2>
      <div class="w-full sm:ml-auto sm:w-56">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('studentHomeworks.subject') }}
        </label>
        <SelectMenu
          v-model="selectedSubject"
          :options="subjectOptions"
          :placeholder="t('studentHomeworks.allSubjects')"
          :aria-label="t('studentHomeworks.subject')"
          clearable
          :clear-label="t('studentHomeworks.allSubjects')"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div
        v-for="index in 4"
        :key="index"
        class="h-32 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      ></div>
    </div>

    <!-- Error -->
    <div
      v-else-if="loadError"
      class="rounded-xl border border-error-200 bg-error-50 px-6 py-10 text-center dark:border-error-500/20 dark:bg-error-500/10"
    >
      <CircleAlert class="mx-auto h-8 w-8 text-error-500" />
      <p class="mt-3 text-sm text-error-600 dark:text-error-400">{{ t('studentHomeworks.loadError') }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600"
        @click="fetchHomeworks"
      >
        {{ t('studentHomeworks.tryAgain') }}
      </button>
    </div>

    <!-- List — the API orders by -due_date, -id -->
    <div v-else-if="homeworks.length" class="space-y-3">
      <article
        v-for="homework in homeworks"
        :key="homework.id"
        class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs transition dark:border-gray-800 dark:bg-gray-900"
        :class="{ 'opacity-60': isPast(homework) }"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex min-w-0 items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :class="isPast(homework) ? 'bg-gray-100 dark:bg-gray-800' : 'bg-brand-50 dark:bg-brand-500/10'"
            >
              <NotebookPen class="h-5 w-5" :class="isPast(homework) ? 'text-gray-400' : 'text-brand-500'" />
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3
                  class="text-base font-semibold"
                  :class="isPast(homework) ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white/90'"
                >
                  {{ homework.offering.subject_name || '—' }}
                </h3>
                <span
                  v-if="isPast(homework)"
                  class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                >
                  {{ t('studentHomeworks.past') }}
                </span>
              </div>
              <p
                class="mt-1.5 whitespace-pre-line text-sm"
                :class="isPast(homework) ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-300'"
              >
                {{ homework.description || '—' }}
              </p>
              <!-- Read-only: students and parents never upload or delete. -->
              <HomeworkAttachmentList
                v-if="attachmentsOf(homework).length"
                class="mt-3"
                :attachments="attachmentsOf(homework)"
              />

              <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span class="inline-flex items-center gap-1.5">
                  <CalendarDays class="h-3.5 w-3.5" />
                  {{ t('studentHomeworks.due') }}: {{ formatDate(homework.due_date) }}
                </span>
                <span v-if="homework.teacher" class="inline-flex items-center gap-1.5">
                  <User class="h-3.5 w-3.5" />
                  {{ homework.teacher.full_name }}
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <School class="h-3.5 w-3.5" />
                  {{ homework.offering.class_group_name }}
                </span>
              </div>
            </div>
          </div>

          <!-- Grade -->
          <div
            class="shrink-0 rounded-lg border px-4 py-2.5 text-center"
            :class="homework.student_grade
              ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60'
              : 'border-dashed border-gray-200 dark:border-gray-700'"
          >
            <p class="text-[11px] font-medium uppercase text-gray-400">{{ t('studentHomeworks.grade') }}</p>
            <p v-if="homework.student_grade" class="mt-0.5 text-lg font-bold" :class="gradeColor(homework)">
              {{ homework.student_grade.grade }}<span class="text-sm font-medium text-gray-400">/{{ homework.max_grade }}</span>
            </p>
            <p v-else class="mt-0.5 text-sm font-medium text-gray-400">
              {{ t('studentHomeworks.notGraded') }}
            </p>
          </div>
        </div>
      </article>
    </div>

    <!-- Empty -->
    <div
      v-else
      class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 dark:border-gray-700 dark:bg-gray-900"
    >
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <NotebookPen class="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <p class="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('studentHomeworks.noResults') }}</p>
    </div>

    <Pagination
      v-if="!loading && !loadError && total > 0"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[20, 50, 100]"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarDays, CircleAlert, NotebookPen, School, User } from 'lucide-vue-next'
import HomeworkAttachmentList from '@/components/homeworks/HomeworkAttachmentList.vue'
import Pagination from '@/components/ui/Pagination.vue'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import { attachmentsOf, getStudentHomeworksApi, type StudentHomework } from '@/api/homeworks'

export interface HomeworkSubjectOption {
  id: number
  name: string
}

const props = defineProps<{
  studentId: number
  /** Subjects offered to this student — the filter's option list. */
  subjects: HomeworkSubjectOption[]
  heading?: string
}>()

const { t } = useI18n()

const homeworks = ref<StudentHomework[]>([])
const total = ref(0)
const loading = ref(true)
const loadError = ref(false)
const selectedSubject = ref<number | string | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)

const subjectOptions = computed<SelectOption[]>(() => {
  const unique = new Map<number, string>()
  props.subjects.forEach(subject => unique.set(subject.id, subject.name))
  return [...unique.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

async function fetchHomeworks() {
  // Both hosts only render this once they hold a student, so a missing id here
  // means the profile id never arrived — surface it instead of spinning.
  if (!props.studentId) {
    homeworks.value = []
    total.value = 0
    loading.value = false
    loadError.value = true
    return
  }

  loading.value = true
  loadError.value = false
  try {
    const { data } = await getStudentHomeworksApi(props.studentId, {
      subject: selectedSubject.value ? Number(selectedSubject.value) : undefined,
      page: currentPage.value,
      page_size: pageSize.value,
    })
    homeworks.value = data.results
    total.value = data.count
  } catch {
    homeworks.value = []
    total.value = 0
    loadError.value = true
  } finally {
    loading.value = false
  }
}

watch([selectedSubject, pageSize], () => {
  if (currentPage.value === 1) fetchHomeworks()
  else currentPage.value = 1
})
watch(currentPage, fetchHomeworks)

// `studentId` arrives asynchronously on the pages that load a student first.
watch(
  () => props.studentId,
  () => {
    currentPage.value = 1
    selectedSubject.value = null
    fetchHomeworks()
  },
  { immediate: true },
)

/** Past its due date — rendered muted so upcoming work stands out. */
function isPast(homework: StudentHomework): boolean {
  if (!homework.due_date) return false
  return homework.due_date.slice(0, 10) < new Date().toISOString().slice(0, 10)
}

function gradeColor(homework: StudentHomework): string {
  const grade = homework.student_grade?.grade
  if (grade == null || !homework.max_grade) return 'text-gray-700 dark:text-gray-300'
  const percent = (grade / homework.max_grade) * 100
  if (percent > 80) return 'text-success-600 dark:text-success-400'
  if (percent > 60) return 'text-warning-600 dark:text-warning-400'
  return 'text-error-600 dark:text-error-400'
}

function formatDate(value: string): string {
  if (!value) return '—'
  const localeTag = document.documentElement.lang || 'ru'
  return new Intl.DateTimeFormat(localeTag, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
}
</script>
