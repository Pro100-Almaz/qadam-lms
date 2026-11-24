<template>
  <div class="space-y-6">
    <!-- Scrolls sideways on a phone instead of wrapping. StatisticsTabs renders the tablist itself. -->
    <div class="flex overflow-x-auto border-b border-gray-200 no-scrollbar dark:border-gray-800">
      <StatisticsTabs id-prefix="student-detail" :model-value="activeTab" :items="tabs" @update:model-value="onTab" />
    </div>

    <div id="student-detail-panel" role="tabpanel" :aria-labelledby="`student-detail-tab-${activeTab}`">
      <!-- Only the active tab mounts; KeepAlive keeps the last few visited for instant revisits. -->
      <KeepAlive :max="6">
        <StudentOverview
          v-if="activeTab === 'overview'"
          :student-id="student.user.id"
          :quarter="quarterStore.quarter"
          :subject-quarter-grades="student.subject_quarter_grades"
          :cumulative-subject-grades="student.cumulative_subject_grades"
          :subject-ids="subjectIds"
          :allowed-tabs="tabKeys"
          @open-subject="openSubject"
          @navigate="onTab"
        />
        <StudentGradesSection
          v-else-if="activeTab === 'grades'"
          :key="gradesSubjectId ?? 'all'"
          :student-id="studentPk"
          :subjects="studentSubjects"
          :heading="t('studentGrades.title')"
          :student-name="fullName"
          :initial-subject-id="gradesSubjectId"
        />
        <AttendanceTab v-else-if="activeTab === 'attendance'" :student-pk="studentPk" :quarter="quarterStore.quarter" />
        <StudentHomeworksSection
          v-else-if="activeTab === 'homeworks'"
          :student-id="studentPk"
          :subjects="studentSubjects"
          :heading="t('studentHomeworks.title')"
        />
        <WellbeingTab
          v-else-if="activeTab === 'wellbeing'"
          :student-pk="studentPk"
          :can-edit="canEditRecords"
          :current-states="student.psychological_states.current"
          @changed="emit('refetch')"
        />
        <AchievementsTab v-else-if="activeTab === 'achievements'" :student-pk="studentPk" :can-edit="canEditRecords" />
        <ReadingTab v-else-if="activeTab === 'reading'" :student-pk="studentPk" :can-edit="canEditRecords" />
        <StudentClubsSection v-else-if="activeTab === 'clubs'" :student-id="studentPk" />
        <ReportsTab
          v-else-if="activeTab === 'reports'"
          :student-pk="studentPk"
          :can-generate="canGenerate"
          :open-generate="generateRequested"
          :student-name="fullName"
          :class-group="student.current_class_group?.display_name || '—'"
          @generate-opened="generateRequested = false"
        />
        <PersonalInfoTab
          v-else-if="activeTab === 'info'"
          :student="student"
          :can-edit="canEditInfo"
          @updated="emit('student-updated', $event)"
        />
      </KeepAlive>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import StatisticsTabs from '@/components/analytics/StatisticsTabs.vue'
import StudentClubsSection from '@/components/students/StudentClubsSection.vue'
import StudentHomeworksSection, {
  type HomeworkSubjectOption,
} from '@/components/students/StudentHomeworksSection.vue'
import StudentGradesSection from '@/components/students/StudentGradesSection.vue'
import StudentOverview from './overview/StudentOverview.vue'
import AttendanceTab from './profile/AttendanceTab.vue'
import PersonalInfoTab from './profile/PersonalInfoTab.vue'
import WellbeingTab from './records/WellbeingTab.vue'
import AchievementsTab from './records/AchievementsTab.vue'
import ReadingTab from './records/ReadingTab.vue'
import ReportsTab from './records/ReportsTab.vue'
import type { StudentDetail } from '@/types/student'
import { useQueryTab } from '@/composables/useQueryTab'
import { useQuarterStore } from '@/stores/quarter'

const props = defineProps<{
  student: StudentDetail
  canEditRecords: boolean
  canEditInfo: boolean
  canGenerate: boolean
  canViewHomeworks: boolean
  defaultTab: string
}>()

const emit = defineEmits<{
  (e: 'student-updated', student: StudentDetail): void
  (e: 'refetch'): void
}>()

const { t } = useI18n()
const quarterStore = useQuarterStore()

const studentPk = computed(() => props.student.id)
const fullName = computed(() => `${props.student.user.last_name} ${props.student.user.first_name}`.trim())

/** Subject filter options, taken from the student's own offerings. */
const studentSubjects = computed<HomeworkSubjectOption[]>(() =>
  (props.student.offerings ?? [])
    .filter(offering => offering.subject?.id && offering.subject?.name)
    .map(offering => ({ id: offering.subject.id, name: offering.subject.name })),
)
const subjectIds = computed<Record<string, number>>(() =>
  Object.fromEntries(studentSubjects.value.map(subject => [subject.name, subject.id])),
)

const tabs = computed(() => [
  { value: 'overview', label: t('studentDetail.page.tabs.overview') },
  // No role gate: `/subject-grades/` scopes itself to the caller.
  { value: 'grades', label: t('studentGrades.title') },
  { value: 'attendance', label: t('studentDetail.page.tabs.attendance') },
  ...(props.canViewHomeworks ? [{ value: 'homeworks', label: t('studentHomeworks.title') }] : []),
  { value: 'wellbeing', label: t('studentDetail.page.tabs.wellbeing') },
  { value: 'achievements', label: t('studentDetail.page.tabs.achievements') },
  { value: 'reading', label: t('studentDetail.page.tabs.reading') },
  { value: 'clubs', label: t('students.clubs') },
  { value: 'reports', label: t('studentDetail.page.tabs.reports') },
  { value: 'info', label: t('studentDetail.page.tabs.personalInfo') },
])
const tabKeys = computed(() => tabs.value.map(tab => tab.value))
const { activeTab, setTab } = useQueryTab(tabKeys, computed(() => props.defaultTab))

/** Set only by openSubject; any other way into Grades starts unfiltered. */
const gradesSubjectId = ref<number | undefined>()
function onTab(tab: string) {
  if (tab === 'grades') gradesSubjectId.value = undefined
  setTab(tab)
}
function openSubject(subjectId: number) {
  gradesSubjectId.value = subjectId
  setTab('grades')
}
watch(() => props.student.id, () => {
  gradesSubjectId.value = undefined
})

// One-shot request from the page header; ReportsTab acknowledges it.
const generateRequested = ref(false)
function openGenerate() {
  generateRequested.value = true
  setTab('reports')
}
defineExpose({ openGenerate })
</script>
