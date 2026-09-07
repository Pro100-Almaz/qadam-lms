<template>
  <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
    <div class="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('myClass.subjectsAndGrades') }}</h2>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ t('assignments.classSectionSubtitle') }}</p>
      </div>
      <div class="flex shrink-0 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <button
          v-for="mode in gradeModes"
          :key="mode.key"
          type="button"
          class="rounded-md px-3 py-1.5 text-xs font-medium transition"
          :class="activeMode === mode.key
            ? 'bg-white text-gray-800 shadow-theme-xs dark:bg-gray-900 dark:text-white/90'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
          @click="activeMode = mode.key"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="grid gap-4 p-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <div class="space-y-2">
        <div
          v-for="index in 6"
          :key="index"
          class="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
        ></div>
      </div>
      <div class="h-80 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"></div>
    </div>

    <div v-else-if="loadError" class="px-5 py-10 text-center">
      <CircleAlert class="mx-auto h-8 w-8 text-error-500" />
      <p class="mt-3 text-sm text-error-600 dark:text-error-400">{{ t('assignments.loadError') }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600"
        @click="fetchSubjects"
      >
        {{ t('assignments.tryAgain') }}
      </button>
    </div>

    <div v-else-if="!subjectOptions.length" class="px-5 py-12 text-center">
      <ClipboardList class="mx-auto h-8 w-8 text-gray-400" />
      <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('assignments.noClassSubjects') }}</p>
    </div>

    <div v-else class="grid min-h-[28rem] gap-0 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside class="border-b border-gray-200 dark:border-gray-800 lg:border-b-0 lg:border-r">
        <div class="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {{ t('assignments.subject') }}
          </p>
        </div>
        <div class="max-h-[34rem] overflow-y-auto p-2 custom-scrollbar">
          <button
            v-for="subject in subjectOptions"
            :key="subject.offeringId"
            type="button"
            class="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition"
            :class="selectedOfferingId === subject.offeringId
              ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
              : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.03]'"
            @click="selectedOfferingId = subject.offeringId"
          >
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium">{{ subject.subjectName }}</span>
              <span class="block truncate text-xs text-gray-500 dark:text-gray-400">
                {{ subject.teacherName || subject.classGroupName }}
              </span>
            </span>
            <ChevronRight class="h-4 w-4 shrink-0" />
          </button>
        </div>
      </aside>

      <section class="min-w-0 p-4">
        <GradebookTable
          v-if="selectedSubject && activeMode === 'assignments'"
          :offering-id="selectedSubject.offeringId"
          :subject-name="selectedSubject.subjectName"
          :class-group-name="selectedSubject.classGroupName"
          embedded
          read-only
          teacher-scoped
        />
        <HomeworkGradebookTable
          v-else-if="selectedSubject"
          :offering-id="selectedSubject.offeringId"
          :class-group-id="classGroupId"
          :subject-name="selectedSubject.subjectName"
          :class-group-name="selectedSubject.classGroupName"
          embedded
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight, CircleAlert, ClipboardList } from 'lucide-vue-next'
import GradebookTable from '@/components/grading/GradebookTable.vue'
import HomeworkGradebookTable from '@/components/homeworks/HomeworkGradebookTable.vue'
import { getAcademicYearsApi } from '@/api/academic'
import { getTeachingAssignmentsApi } from '@/api/teachingAssignments'

const props = defineProps<{
  /** The homeroom class whose active offerings are shown. */
  classGroupId: number
}>()

interface ClassSubjectOption {
  offeringId: number
  subjectName: string
  classGroupName: string
  teacherName: string
}

const { t } = useI18n()

const subjectOptions = ref<ClassSubjectOption[]>([])
const selectedOfferingId = ref<number | null>(null)
const loading = ref(true)
const loadError = ref(false)
const activeMode = ref<'assignments' | 'homeworks'>('assignments')

const gradeModes = computed(() => [
  { key: 'assignments' as const, label: t('assignments.tabAssignments') },
  { key: 'homeworks' as const, label: t('homeworks.title') },
])

const selectedSubject = computed(
  () => subjectOptions.value.find(subject => subject.offeringId === selectedOfferingId.value) ?? null,
)

async function fetchSubjects() {
  if (!props.classGroupId) {
    subjectOptions.value = []
    selectedOfferingId.value = null
    loading.value = false
    return
  }

  loading.value = true
  loadError.value = false

  try {
    const { data: years } = await getAcademicYearsApi()
    const activeYear = years.find(year => year.is_active)
    const { data } = await getTeachingAssignmentsApi({
      academic_year: activeYear?.id,
      class_group: props.classGroupId,
    })

    subjectOptions.value = data
      .map(assignment => ({
        offeringId: assignment.id,
        subjectName: assignment.subject_name,
        classGroupName: assignment.class_group_name,
        teacherName: assignment.teacher_name,
      }))
      .sort(
        (a, b) =>
          a.subjectName.localeCompare(b.subjectName) ||
          a.teacherName.localeCompare(b.teacherName),
      )

    const selectedStillExists = subjectOptions.value.some(
      subject => subject.offeringId === selectedOfferingId.value,
    )
    if (!selectedStillExists) selectedOfferingId.value = subjectOptions.value[0]?.offeringId ?? null
  } catch {
    subjectOptions.value = []
    selectedOfferingId.value = null
    loadError.value = true
  } finally {
    loading.value = false
  }
}

watch(
  () => props.classGroupId,
  fetchSubjects,
  { immediate: true },
)
</script>
