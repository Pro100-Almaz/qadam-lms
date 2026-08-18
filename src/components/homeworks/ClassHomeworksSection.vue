<template>
  <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
    <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
      <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('homeworks.classHomeworksTitle') }}</h2>
      <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ t('homeworks.classHomeworksSubtitle') }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3 p-5">
      <div
        v-for="index in 3"
        :key="index"
        class="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
      ></div>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="px-5 py-10 text-center">
      <CircleAlert class="mx-auto h-8 w-8 text-error-500" />
      <p class="mt-3 text-sm text-error-600 dark:text-error-400">{{ t('homeworks.loadError') }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600"
        @click="fetchHomeworks"
      >
        {{ t('homeworks.tryAgain') }}
      </button>
    </div>

    <!-- List -->
    <div v-else-if="homeworks.length" class="divide-y divide-gray-100 dark:divide-gray-800">
      <article v-for="homework in homeworks" :key="homework.id" class="p-5">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">
                {{ homework.offering.subject_name || '—' }}
              </h3>
              <span class="text-xs text-gray-400">{{ homework.offering.class_group_name }}</span>
            </div>
            <p class="mt-1.5 whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">
              {{ homework.description || '—' }}
            </p>
            <HomeworkAttachmentList
              v-if="attachmentsOf(homework).length"
              class="mt-3"
              size="sm"
              :attachments="attachmentsOf(homework)"
            />
            <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span class="inline-flex items-center gap-1.5" :class="{ 'text-error-500': isOverdue(homework) }">
                <CalendarDays class="h-3.5 w-3.5" />
                {{ t('homeworks.dueDate') }}: {{ formatDate(homework.due_date) }}
              </span>
              <span v-if="homework.teacher" class="inline-flex items-center gap-1.5">
                <User class="h-3.5 w-3.5" />
                {{ homework.teacher.full_name }}
              </span>
              <span class="inline-flex items-center gap-1.5">
                <Target class="h-3.5 w-3.5" />
                {{ t('homeworks.maxGrade') }}: {{ homework.max_grade }}
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- Empty -->
    <div v-else class="px-5 py-12 text-center">
      <NotebookPen class="mx-auto h-8 w-8 text-gray-400" />
      <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('homeworks.noClassHomeworks') }}</p>
    </div>

    <div v-if="!loading && !loadError && total > 0" class="border-t border-gray-200 px-5 py-4 dark:border-gray-800">
      <Pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[20, 50, 100]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarDays, CircleAlert, NotebookPen, Target, User } from 'lucide-vue-next'
import HomeworkAttachmentList from '@/components/homeworks/HomeworkAttachmentList.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { attachmentsOf, getMyClassHomeworksApi, type Homework } from '@/api/homeworks'

/**
 * Published homework of the caller's homeroom class, across every subject —
 * their own included. **Read-only by design**: editing needs a teaching
 * assignment on the row's offering, so managing happens on the Homeworks page,
 * which lists exactly the offerings this teacher teaches.
 */
const props = defineProps<{
  /** Only needed by a teacher who is homeroom teacher of several classes. */
  classGroupId?: number
}>()

const { t } = useI18n()

const homeworks = ref<Homework[]>([])
const total = ref(0)
const loading = ref(true)
const loadError = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

async function fetchHomeworks() {
  loading.value = true
  loadError.value = false
  try {
    // The endpoint is always the caller's own homeroom class; `class_group`
    // only narrows it when they are homeroom teacher of more than one. No
    // homeroom assignment answers 200 with an empty page, not an error.
    const { data } = await getMyClassHomeworksApi({
      class_group: props.classGroupId || undefined,
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

watch(pageSize, () => {
  if (currentPage.value === 1) fetchHomeworks()
  else currentPage.value = 1
})
watch(currentPage, fetchHomeworks)

// The class group id arrives after the homeroom dashboard resolves.
watch(
  () => props.classGroupId,
  () => {
    currentPage.value = 1
    fetchHomeworks()
  },
  { immediate: true },
)

function isOverdue(homework: Homework): boolean {
  if (!homework.due_date) return false
  return homework.due_date.slice(0, 10) < new Date().toISOString().slice(0, 10)
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
