<template>
  <div class="space-y-6">
    <div class="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div class="px-6 py-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-800 dark:text-white/90">{{ data.class_group }}</h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ t('students.yearOfEducation') }}: {{ data.academic_year || '—' }}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <GradeReportButton
              :classes="reportClasses"
              :default-class-group-id="data.class_group_id"
              :classes-loading="subjectsLoading"
              allow-student-scope
              allow-layout-choice
            />
            <div class="flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 dark:bg-brand-500/10">
              <Users class="h-4 w-4 text-brand-500" />
              <span class="text-sm font-semibold text-brand-600 dark:text-brand-400">
                {{ students.length }} {{ students.length === 1 ? 'student' : 'students' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 sm:w-fit">
      <button
        v-for="tab in classViewTabs"
        :key="tab.key"
        type="button"
        class="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition sm:flex-none sm:px-4"
        :class="activeClassView === tab.key
          ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-300'"
        @click="activeClassView = tab.key"
      >
        <component :is="tab.icon" class="h-4 w-4 shrink-0" />
        <span class="truncate">{{ tab.label }}</span>
      </button>
    </div>

    <div
      v-if="activeClassView === 'students'"
      class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
    >
      <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.title') }}</h2>
      </div>
      <div v-if="studentsLoading" class="space-y-3 p-5">
        <div
          v-for="index in 5"
          :key="index"
          class="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
        ></div>
      </div>
      <div v-else-if="studentsError" class="px-5 py-10 text-center">
        <p class="text-sm text-error-600 dark:text-error-400">{{ t('teacherDashboard.loadError') }}</p>
        <button
          type="button"
          class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600"
          @click="fetchStudents"
        >
          {{ t('common.retry') }}
        </button>
      </div>
      <div v-else class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="w-full min-w-[640px]">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('common.name') }}
              </th>
              <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('students.email') }}
              </th>
              <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('profile.phone') }}
              </th>
              <th class="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {{ t('common.actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="student in students"
              :key="student.id"
              class="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
            >
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <img
                    v-if="student.user.avatar"
                    :src="student.user.avatar"
                    :alt="student.user.last_name"
                    class="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                  <div
                    v-else
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                  >
                    {{ initials(student) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                      {{ student.user.last_name }} {{ student.user.first_name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ student.user.username }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5">
                <span class="text-sm text-gray-600 dark:text-gray-300">{{ student.user.email || '—' }}</span>
              </td>
              <td class="px-5 py-3.5">
                <span class="text-sm text-gray-600 dark:text-gray-300">{{ student.user.phone_number || '—' }}</span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                    :title="t('statistics.button')"
                    :aria-label="t('statistics.button')"
                    @click="statsStudent = { id: student.id, name: studentName(student) }"
                  >
                    <ChartColumnBig class="h-3.5 w-3.5" />
                  </button>
                  <router-link
                    :to="`/students/${student.user.id}`"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                  >
                    <Eye class="h-3.5 w-3.5" />
                    {{ t('common.view') }}
                  </router-link>
                </div>
              </td>
            </tr>
            <tr v-if="students.length === 0">
              <td colspan="4" class="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                {{ t('common.noData') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ClassGradingSection
      v-if="activeClassView === 'subjects'"
      :class-group-id="data.class_group_id"
    />

    <StudentStatisticsModal
      v-if="statsStudent"
      :open="Boolean(statsStudent)"
      :student="statsStudent"
      @close="statsStudent = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChartColumnBig, ClipboardList, Eye, Users } from 'lucide-vue-next'
import StudentStatisticsModal, {
  type StatisticsStudentTarget,
} from '@/components/analytics/StudentStatisticsModal.vue'
import GradeReportButton from '@/components/grading/GradeReportButton.vue'
import ClassGradingSection from '@/components/grading/ClassGradingSection.vue'
import type { GradeReportClassOption } from '@/components/grading/GradeReportModal.vue'
import { useSubjectNameLookup } from '@/composables/useSubjectNameLookup'
import { getStudentsApi } from '@/api/students'
import type { Student } from '@/types/student'
import type { HomeroomTeacherDashboard } from '@/types/teacherDashboard'

const props = defineProps<{ data: HomeroomTeacherDashboard }>()
const { t } = useI18n()

const students = ref<Student[]>([])
const studentsLoading = ref(true)
const studentsError = ref(false)
const statsStudent = ref<StatisticsStudentTarget | null>(null)

type ClassView = 'students' | 'subjects'

const activeClassView = ref<ClassView>('students')

const classViewTabs = computed(() => [
  { key: 'students' as const, label: t('students.title'), icon: Users },
  { key: 'subjects' as const, label: t('myClass.subjectsAndGrades'), icon: ClipboardList },
])

const {
  loading: subjectsLoading,
  load: loadSubjectNames,
  toOptions: subjectOptionsFor,
} = useSubjectNameLookup()

const classSubjectNames = computed(() => {
  const names = new Set<string>()
  props.data.students.forEach(student => {
    student.subjects.forEach(subject => names.add(subject.subject_name))
  })
  return [...names].sort()
})

const reportClasses = computed<GradeReportClassOption[]>(() => [
  {
    classGroupId: props.data.class_group_id,
    displayName: props.data.class_group,
    subjects: subjectOptionsFor(classSubjectNames.value),
  },
])

function studentName(student: Student): string {
  return `${student.user.last_name} ${student.user.first_name}`.trim() || student.user.username
}

function initials(student: Student): string {
  return `${student.user.last_name?.[0] ?? ''}${student.user.first_name?.[0] ?? ''}`.toUpperCase()
}

async function fetchStudents() {
  studentsLoading.value = true
  studentsError.value = false
  try {
    const { data } = await getStudentsApi({ class_group: props.data.class_group_id })
    students.value = data
  } catch {
    students.value = []
    studentsError.value = true
  } finally {
    studentsLoading.value = false
  }
}

onMounted(() => {
  fetchStudents()
  loadSubjectNames()
})
</script>
