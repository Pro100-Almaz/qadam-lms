<template>
  <AdminLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">{{ t('nav.myHomeworks') }}</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('studentHomeworks.mySubtitle') }}</p>
      </div>

      <StudentHomeworksSection :student-id="studentId" :subjects="subjects" />
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import StudentHomeworksSection, {
  type HomeworkSubjectOption,
} from '@/components/students/StudentHomeworksSection.vue'
import { getMySubjectsApi } from '@/api/studentSelf'
import { useAuth } from '@/composables/useAuth'

const { t } = useI18n()
const { user } = useAuth()

const subjects = ref<HomeworkSubjectOption[]>([])

/**
 * The route wants the Student *profile* id, not the user id. `/auth/me/`
 * carries it as `profile_id`, but that field is role-polymorphic, so it only
 * means "student" once the role confirms it.
 */
const studentId = computed(() =>
  user.value?.roles.includes('student') ? user.value.profile_id ?? 0 : 0,
)

onMounted(() => {
  getMySubjectsApi()
    .then(({ data }) => {
      subjects.value = data.map(subject => ({ id: subject.subject_id, name: subject.subject_name }))
    })
    .catch(() => {
      subjects.value = []
    })
})
</script>
