<template>
  <AdminLayout>
    <div class="space-y-6">
      <Breadcrumb
        backTo="/students"
        :crumbs="[{ label: t('students.title'), to: '/students' }, ...(fullName ? [{ label: fullName }] : [])]"
      />

      <StatePanel v-if="loading || error" :loading="loading" :error="error" @retry="fetchStudent" />

      <template v-else-if="student">
        <StudentHeader :student="student" :loading="false">
          <template v-if="canGenerateReport" #actions>
            <button
              type="button"
              class="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-theme-sm font-medium text-white transition-colors hover:bg-brand-700"
              @click="body?.openGenerate()"
            >
              <Sparkles class="h-4 w-4" aria-hidden="true" />
              {{ t('studentDetail.page.generateReport') }}
            </button>
          </template>
        </StudentHeader>

        <StudentDetailBody
          ref="body"
          :student="student"
          :can-edit-records="canEditRecords"
          :can-edit-info="isHomeroomTeacher"
          :can-generate="canGenerateReport"
          :can-view-homeworks="canViewHomeworks"
          :default-tab="defaultTab"
          @student-updated="student = $event"
          @refetch="refetchStudent"
        />
      </template>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Sparkles } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import Breadcrumb from '@/components/ui/Breadcrumb.vue'
import StatePanel from '@/components/analytics/StatePanel.vue'
import StudentHeader from '@/components/students/detail/profile/StudentHeader.vue'
import StudentDetailBody from '@/components/students/detail/StudentDetailBody.vue'
import { getStudentDetailApi } from '@/api/students'
import { getAcademicYearsApi } from '@/api/academic'
import type { StudentDetail } from '@/types/student'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { useQuarterStore } from '@/stores/quarter'

const { t } = useI18n()
const route = useRoute()
const toast = useToast()
const { activeRoles } = useAuth()
const quarterStore = useQuarterStore()

const hasRole = (roles: string[]) => activeRoles.value.some(role => roles.includes(role))
const canEditRecords = computed(() =>
  hasRole(['admin', 'supervisor', 'teacher', 'homeroom_teacher', 'principal', 'psychologist']),
)
const isHomeroomTeacher = computed(() => hasRole(['homeroom_teacher']))
const canGenerateReport = computed(() =>
  hasRole(['admin', 'supervisor', 'teacher', 'homeroom_teacher', 'principal']),
)
/**
 * Roles the backend's `can_access_student()` lets read another student's
 * homework grades. Plain `teacher` is deliberately absent: a subject teacher
 * grades through the homework list instead.
 */
const canViewHomeworks = computed(() =>
  hasRole(['homeroom_teacher', 'psychologist', 'admin', 'principal', 'supervisor']),
)
const defaultTab = computed(() => (hasRole(['psychologist']) ? 'wellbeing' : 'overview'))

const loading = ref(true)
const error = ref('')
const student = ref<StudentDetail | null>(null)
const body = ref<InstanceType<typeof StudentDetailBody> | null>(null)

const fullName = computed(() =>
  student.value ? `${student.value.user.last_name} ${student.value.user.first_name}`.trim() : '',
)

function messageFor(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.status === 404) return t('studentDetail.page.notFound')
  return t('studentDetail.page.loadFailed')
}

// Bumped per fetch so a slow response for a previous student is dropped.
let requestId = 0

async function fetchStudent() {
  const id = ++requestId
  const userId = Number(route.params.userId)
  student.value = null
  if (!userId) {
    error.value = t('studentDetail.page.invalidId')
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const { data } = await getStudentDetailApi(userId)
    if (id !== requestId) return
    student.value = data
    // The shared quarter defaults to the active year's current quarter.
    try {
      const { data: years } = await getAcademicYearsApi()
      if (id === requestId) quarterStore.adoptCurrent(years.find(year => year.is_active)?.current_quarter)
    } catch (err) {
      console.warn('Academic years failed to load', err)
    }
  } catch (err) {
    if (id !== requestId) return
    console.error('Student failed to load', err)
    error.value = messageFor(err)
  } finally {
    if (id === requestId) loading.value = false
  }
}

/** After a wellbeing change: refresh the student without dropping the page to a skeleton. */
async function refetchStudent() {
  const id = requestId
  try {
    const { data } = await getStudentDetailApi(Number(route.params.userId))
    if (id === requestId) student.value = data
  } catch (err) {
    console.warn('Student refresh failed', err)
    toast.error(t('studentDetail.page.refreshFailed'))
  }
}

watch(() => route.params.userId, fetchStudent, { immediate: true })
</script>
