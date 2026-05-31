<template>
  <AdminLayout>
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <div class="flex flex-col items-center gap-3">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
        <AlertCircle class="h-8 w-8 text-red-500" />
      </div>
      <p class="text-base font-medium text-gray-800 dark:text-white/90">{{ error }}</p>
      <button
        @click="fetchDetail"
        class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition"
      >
        <RefreshCw class="h-3.5 w-3.5" />
        {{ t('common.loading') }}
      </button>
    </div>

    <!-- Content -->
    <div v-else-if="detail" class="space-y-6">
      <!-- Breadcrumb -->
      <Breadcrumb
        :back-to="`/my-children/${childId}`"
        :crumbs="[
          { label: t('nav.myChildren'), to: '/my-children' },
          { label: detail.child.full_name, to: `/my-children/${childId}` },
          { label: detail.subject_name },
        ]"
      />

      <!-- Subject hero -->
      <SubjectHeroHeader
        :subject-name="detail.subject_name"
        :language-group="detail.language_group"
        :status="detail.status"
        :teacher-name="detail.teacher?.full_name ?? null"
        :class-group-name="detail.class_group_name"
        :academic-year="detail.academic_year"
        :cumulative-grade="detail.cumulative_grade"
      />

      <!-- Quarter selector -->
      <SubjectQuarterSelector v-model="activeQuarter" />

      <!-- Stat cards -->
      <SubjectStatCards
        :score-percent="detail.cumulative_grade"
        :grade="scoreToGrade(detail.quarter_grades[String(activeQuarter) as '1' | '2' | '3' | '4'])"
        :graded-count="gradedCount"
        :total-lessons="lessonsForQuarter.length"
        :avg-points="avgPoints"
      />

      <!-- Lesson table + Teacher card -->
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <SubjectLessonTable
          :lessons="lessonsForQuarter"
          :quarter="activeQuarter"
          @lesson-click="openLessonModal"
        />
        <SubjectTeacherCard :teacher="detail.teacher" class="self-start" />
      </div>
    </div>

    <!-- Lesson modal -->
    <SubjectLessonModal
      v-if="selectedLesson"
      :lesson="selectedLesson"
      @close="selectedLesson = null"
    />
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertCircle, RefreshCw } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import Breadcrumb from '@/components/ui/Breadcrumb.vue'
import SubjectHeroHeader from '@/components/parentSubject/SubjectHeroHeader.vue'
import SubjectQuarterSelector from '@/components/parentSubject/SubjectQuarterSelector.vue'
import SubjectStatCards from '@/components/parentSubject/SubjectStatCards.vue'
import SubjectLessonTable from '@/components/parentSubject/SubjectLessonTable.vue'
import SubjectTeacherCard from '@/components/parentSubject/SubjectTeacherCard.vue'
import SubjectLessonModal from '@/components/parentSubject/SubjectLessonModal.vue'
import { getMyChildSubjectDetailApi } from '@/api/parentSelf'
import type { ParentChildSubjectDetail, ParentChildLessonGrade } from '@/types/parentSelf'
import { useGradeHelpers } from '@/composables/useGradeHelpers'

const route = useRoute()
const { t } = useI18n()

const loading = ref(true)
const error = ref<string | null>(null)
const detail = ref<ParentChildSubjectDetail | null>(null)
const activeQuarter = ref<number>(1)
const selectedLesson = ref<ParentChildLessonGrade | null>(null)

const childId = computed(() => Number(route.params.childId))
const subjectId = computed(() => Number(route.params.subjectId))

const lessonsForQuarter = computed(() => {
  if (!detail.value) return []
  return detail.value.lessons.filter((l) => l.quarter === activeQuarter.value)
})

const gradedCount = computed(() =>
  lessonsForQuarter.value.filter((l) => l.earned_points !== null).length,
)

const { scoreToGrade } = useGradeHelpers()

const avgPoints = computed(() => {
  const graded = lessonsForQuarter.value.filter((l) => l.earned_points !== null)
  if (graded.length === 0) return null
  const total = graded.reduce((s, l) => s + (l.earned_points ?? 0), 0)
  return total / graded.length
})

function openLessonModal(lesson: ParentChildLessonGrade) {
  selectedLesson.value = lesson
}

async function fetchDetail() {
  if (!childId.value || !subjectId.value) {
    error.value = t('parentChildSubject.invalidParams')
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  try {
    const { data } = await getMyChildSubjectDetailApi(childId.value, subjectId.value)
    detail.value = data
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      error.value = t('parentChildSubject.notLinked')
    } else if (status === 403) {
      error.value = t('parentChildSubject.notEnrolled')
    } else {
      error.value = t('parentChildSubject.loadFailed')
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)
</script>
