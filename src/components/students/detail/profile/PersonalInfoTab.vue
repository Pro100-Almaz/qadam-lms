<template>
  <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
    <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
      <h2 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">{{ t('profile.personalInfo') }}</h2>
      <button
        v-if="canEdit"
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-theme-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        @click="openEdit"
      >
        <Pencil class="h-4 w-4" aria-hidden="true" />
        {{ t('profile.editPersonalInfo') }}
      </button>
    </div>

    <div class="divide-y divide-gray-100 dark:divide-gray-800">
      <section v-for="group in groups" :key="group.key" class="px-5 py-4">
        <h3 class="mb-3 text-theme-sm font-semibold text-gray-700 dark:text-gray-300">{{ group.title }}</h3>
        <dl class="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <div v-for="row in group.rows" :key="row.label" :class="row.wide ? 'sm:col-span-2' : ''">
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">{{ row.label }}</dt>
            <dd class="mt-0.5 whitespace-pre-line break-words text-theme-sm text-gray-800 dark:text-white/90">
              {{ row.value || '—' }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="px-5 py-4">
        <h3 class="mb-3 text-theme-sm font-semibold text-gray-700 dark:text-gray-300">{{ t('students.parents') }}</h3>
        <p v-if="!student.parents?.length" class="text-theme-sm text-gray-500 dark:text-gray-400">
          {{ t('studentDetail.personalInfo.noParents') }}
        </p>
        <dl v-else class="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <div v-for="parent in student.parents" :key="parent.id">
            <dt class="text-theme-sm font-medium text-gray-800 dark:text-white/90">{{ parent.full_name }}</dt>
            <dd class="mt-0.5 break-all text-theme-sm text-gray-600 dark:text-gray-400">{{ parent.email || '—' }}</dd>
            <dd class="text-theme-sm text-gray-600 dark:text-gray-400">{{ parent.phone_number || '—' }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </div>

  <Modal v-if="showEdit" :fullScreenBackdrop="true" @close="closeEdit">
    <template #body>
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="t('profile.editPersonalInfo')"
        class="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md custom-scrollbar dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">{{ t('profile.editPersonalInfo') }}</h3>
          <button
            type="button"
            :aria-label="t('common.cancel')"
            class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-2 focus-visible:outline-brand-500 dark:hover:bg-white/5 dark:hover:text-gray-300"
            @click="closeEdit"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div
          v-if="formError"
          role="alert"
          class="mb-4 rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-theme-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
        >
          {{ formError }}
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div v-for="f in formFields" :key="f.key" :class="f.wide ? 'sm:col-span-2' : ''">
              <label :for="`pi-${f.key}`" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">
                {{ f.label }}
              </label>
              <textarea
                v-if="f.key === 'medical_features'"
                :id="`pi-${f.key}`"
                v-model="form[f.key]"
                rows="3"
                :placeholder="t('students.medicalFeaturesPlaceholder')"
                :class="[inputClass, 'resize-none py-2', fieldBorder(f.key)]"
              ></textarea>
              <input
                v-else
                :id="`pi-${f.key}`"
                v-model="form[f.key]"
                :type="f.type"
                :class="[inputClass, 'h-10', fieldBorder(f.key)]"
              />
              <p v-if="fieldErrors[f.key]" class="mt-1.5 text-theme-xs text-error-500">{{ fieldErrors[f.key][0] }}</p>
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
              @click="closeEdit"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-theme-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
              {{ t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { Loader2, Pencil, X } from 'lucide-vue-next'
import Modal from '@/components/ui/Modal.vue'
import { updateStudentApi } from '@/api/students'
import type { StudentDetail, UpdateStudentRequest } from '@/types/student'

/**
 * Account, personal, medical, parents and school details as definition lists.
 * `canEdit` (the homeroom teacher) shows the edit modal; after a save the tab
 * emits `updated` with a copy of the student carrying the new values.
 */
const props = defineProps<{ student: StudentDetail; canEdit: boolean }>()
const emit = defineEmits<{ (e: 'updated', student: StudentDetail): void }>()

const { t } = useI18n()

type InfoRow = { label: string; value?: string | null; wide?: boolean }
const groups = computed<{ key: string; title: string; rows: InfoRow[] }[]>(() => {
  const s = props.student
  const u = s.user
  return [
    {
      key: 'account',
      title: t('studentDetail.personalInfo.account'),
      rows: [
        { label: t('profile.username'), value: u.username },
        { label: t('profile.email'), value: u.email },
      ],
    },
    {
      key: 'personal',
      title: t('studentDetail.personalInfo.personal'),
      rows: [
        { label: t('profile.firstName'), value: u.first_name },
        { label: t('profile.lastName'), value: u.last_name },
        { label: t('profile.dateOfBirth'), value: u.date_of_birth },
        { label: t('profile.phone'), value: u.phone_number },
        { label: t('profile.address'), value: u.address, wide: true },
      ],
    },
    {
      key: 'medical',
      title: t('studentDetail.personalInfo.medical'),
      rows: [{ label: t('students.medicalFeatures'), value: s.medical_features, wide: true }],
    },
    {
      key: 'school',
      title: t('students.schoolInformation'),
      rows: [
        { label: t('profile.role'), value: u.role_display },
        { label: t('profile.school'), value: u.school },
        { label: t('students.class'), value: s.current_class_group?.display_name },
      ],
    },
  ]
})

// ─── Edit ────────────────────────────────────────────────────────────────────
type UserField = 'email' | 'first_name' | 'last_name' | 'phone_number' | 'date_of_birth' | 'address'
type FormKey = UserField | 'medical_features'
const userFields: UserField[] = ['email', 'first_name', 'last_name', 'phone_number', 'date_of_birth', 'address']

const formFields = computed<{ key: FormKey; label: string; type: string; wide?: boolean }[]>(() => [
  { key: 'first_name', label: t('profile.firstName'), type: 'text' },
  { key: 'last_name', label: t('profile.lastName'), type: 'text' },
  { key: 'email', label: t('profile.email'), type: 'email', wide: true },
  { key: 'phone_number', label: t('profile.phone'), type: 'tel' },
  { key: 'date_of_birth', label: t('profile.dateOfBirth'), type: 'date' },
  { key: 'address', label: t('profile.address'), type: 'text', wide: true },
  { key: 'medical_features', label: t('students.medicalFeatures'), type: 'text', wide: true },
])

const inputClass =
  'w-full rounded-lg border bg-white px-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30'

const showEdit = ref(false)
const saving = ref(false)
const formError = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
const form = ref<Record<FormKey, string>>({
  email: '', first_name: '', last_name: '', phone_number: '', date_of_birth: '', address: '', medical_features: '',
})

function fieldBorder(key: FormKey) {
  return fieldErrors.value[key] ? 'border-error-500 dark:border-error-500' : 'border-gray-300 dark:border-gray-700'
}

function openEdit() {
  const u = props.student.user
  form.value = {
    email: u.email || '',
    first_name: u.first_name || '',
    last_name: u.last_name || '',
    phone_number: u.phone_number || '',
    date_of_birth: u.date_of_birth || '',
    address: u.address || '',
    medical_features: props.student.medical_features || '',
  }
  fieldErrors.value = {}
  formError.value = ''
  showEdit.value = true
}

function closeEdit() {
  showEdit.value = false
}

async function submit() {
  const s = props.student
  // Only send changed fields: a PATCH with untouched values (e.g. an empty
  // date) is rejected by the backend.
  const userPayload: Partial<Record<UserField, string>> = {}
  for (const field of userFields) {
    const next = form.value[field].trim()
    if (next !== (s.user[field] || '')) userPayload[field] = next
  }
  const payload: UpdateStudentRequest = { ...userPayload }
  // medical_features lives on the student profile; an empty string clears it.
  const nextMedical = form.value.medical_features.trim()
  const medicalChanged = nextMedical !== (s.medical_features || '')
  if (medicalChanged) payload.medical_features = nextMedical

  if (Object.keys(payload).length === 0) {
    closeEdit()
    return
  }

  saving.value = true
  formError.value = ''
  fieldErrors.value = {}
  try {
    await updateStudentApi(s.id, payload)
    emit('updated', {
      ...s,
      user: { ...s.user, ...userPayload },
      medical_features: medicalChanged ? nextMedical : s.medical_features,
    })
    closeEdit()
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
      const data = err.response.data as Record<string, unknown>
      const errors: Record<string, string[]> = {}
      for (const [key, value] of Object.entries(data)) {
        if (key === 'medical_features' || userFields.includes(key as UserField)) {
          errors[key] = Array.isArray(value) ? value.map(String) : [String(value)]
        }
      }
      fieldErrors.value = errors
      if (Object.keys(errors).length === 0) {
        formError.value = typeof data.detail === 'string' ? data.detail : t('common.serverError')
      }
    } else {
      formError.value = t('common.serverError')
    }
  } finally {
    saving.value = false
  }
}
</script>
