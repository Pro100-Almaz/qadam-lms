<template>
  <AdminLayout>
    <div class="space-y-6">
      <Breadcrumb
        back-to="/my-children"
        :crumbs="[{ label: t('nav.myChildren'), to: '/my-children' }, ...(fullName ? [{ label: fullName }] : [])]"
      />

      <StatePanel v-if="loading || error" :loading="loading" :error="error" @retry="fetchStudent" />

      <template v-else-if="student">
        <StudentHeader :student="student" :loading="false" />
        <StudentDetailBody
          :student="student"
          :can-edit-records="false"
          :can-edit-info="false"
          :can-generate="false"
          :can-view-homeworks="true"
          default-tab="overview"
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
import AdminLayout from '@/components/layout/AdminLayout.vue'
import Breadcrumb from '@/components/ui/Breadcrumb.vue'
import StatePanel from '@/components/analytics/StatePanel.vue'
import StudentHeader from '@/components/students/detail/profile/StudentHeader.vue'
import StudentDetailBody from '@/components/students/detail/StudentDetailBody.vue'
import { getMyChildDetailApi } from '@/api/parentSelf'
import type { StudentDetail } from '@/types/student'

const { t } = useI18n()
const route = useRoute()

const loading = ref(true)
const error = ref('')
const student = ref<StudentDetail | null>(null)

const fullName = computed(() =>
  student.value ? `${student.value.user.last_name} ${student.value.user.first_name}`.trim() : '',
)

function messageFor(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.status === 404) return t('studentDetail.page.childNotFound')
  return t('studentDetail.page.loadFailed')
}

// Bumped per fetch so a slow response for a previous child is dropped.
let requestId = 0

async function fetchStudent() {
  const id = ++requestId
  // The route carries the student profile pk, not the user id.
  const pk = Number(route.params.id)
  student.value = null
  if (!pk) {
    error.value = t('studentDetail.page.invalidId')
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const { data } = await getMyChildDetailApi(pk)
    if (id === requestId) student.value = data
  } catch (err) {
    if (id !== requestId) return
    console.error('Child failed to load', err)
    error.value = messageFor(err)
  } finally {
    if (id === requestId) loading.value = false
  }
}

watch(() => route.params.id, fetchStudent, { immediate: true })
</script>
