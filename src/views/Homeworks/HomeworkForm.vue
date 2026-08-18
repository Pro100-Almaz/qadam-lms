<template>
  <AdminLayout>
    <div class="mx-auto min-w-0 max-w-4xl space-y-6">
      <button
        type="button"
        class="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-brand-500 dark:text-gray-400"
        @click="router.push('/homeworks')"
      >
        <ArrowLeft class="h-4 w-4" />
        {{ t('homeworks.backToHomeworks') }}
      </button>

      <div>
        <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {{ isEditing ? t('homeworks.editTitle') : t('homeworks.createTitle') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ isEditing ? t('homeworks.editSubtitle') : t('homeworks.createSubtitle') }}
        </p>
      </div>

      <div
        v-if="submitError"
        class="flex items-start gap-2 rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400"
      >
        <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
        <span>{{ submitError }}</span>
      </div>

      <div v-if="loading" class="space-y-4">
        <div
          v-for="index in 2"
          :key="index"
          class="h-56 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
        ></div>
      </div>

      <form v-else class="min-w-0 space-y-6" novalidate @submit.prevent="submitForm">
        <!-- Target: subject + classes (create) / the offering it belongs to (edit) -->
        <section class="min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-light-100 dark:bg-blue-light-500/10">
              <School class="h-4 w-4 text-blue-light-600 dark:text-blue-light-400" />
            </div>
            <div>
              <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">
                {{ isEditing ? t('homeworks.assignedTo') : t('homeworks.whoGetsIt') }}
              </h2>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{ isEditing ? t('homeworks.offeringLockedHint') : t('homeworks.classGroupsHint') }}
              </p>
            </div>
          </div>

          <!-- Edit: the offering is fixed -->
          <dl v-if="isEditing" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('homeworks.subject') }}</dt>
              <dd class="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {{ homework?.offering.subject_name || '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('homeworks.classGroup') }}</dt>
              <dd class="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {{ homework?.offering.class_group_name || '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('homeworks.teacher') }}</dt>
              <dd class="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {{ homework?.teacher.full_name || '—' }}
              </dd>
            </div>
          </dl>

          <!-- Create: pick one subject, then every class that gets the task -->
          <div v-else class="space-y-5">
            <div class="sm:w-1/2 sm:pr-2.5">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('homeworks.subject') }} <span class="text-error-500">*</span>
              </label>
              <SelectMenu
                v-model="selectedSubjectName"
                :options="subjectOptions"
                :placeholder="t('homeworks.selectSubject')"
                :aria-label="t('homeworks.subject')"
                :disabled="offeringsLoading || !subjectOptions.length"
                :trigger-class="subjectTriggerClass"
              />
              <p v-if="fieldErrors.subject" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.subject }}</p>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('homeworks.classGroups') }} <span class="text-error-500">*</span>
              </label>
              <OfferingPicker
                v-model="form.offerings"
                :options="offeringOptions"
                :empty-label="selectedSubjectName ? t('homeworks.noClassesForSubject') : t('homeworks.pickSubjectFirst')"
                :loading="offeringsLoading"
                :disabled="saving"
                :error="Boolean(fieldErrors.offerings)"
              />
              <p v-if="fieldErrors.offerings" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.offerings }}</p>
            </div>
          </div>
        </section>

        <!-- The task itself -->
        <section class="min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
              <NotebookPen class="h-4 w-4 text-brand-500" />
            </div>
            <div>
              <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('homeworks.assignmentDetails') }}</h2>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ t('homeworks.requiredHint') }}</p>
            </div>
          </div>

          <div class="space-y-5">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('common.description') }} <span class="text-error-500">*</span>
              </label>
              <textarea
                v-model="form.description"
                rows="5"
                :placeholder="t('homeworks.descriptionPlaceholder')"
                :class="fieldErrors.description ? 'border-error-500' : 'border-gray-300 dark:border-gray-700'"
                class="w-full resize-y rounded-lg border bg-white px-4 py-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              ></textarea>
              <p v-if="fieldErrors.description" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.description }}</p>
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('homeworks.dueDate') }} <span class="text-error-500">*</span>
                </label>
                <div class="relative">
                  <flat-pickr
                    v-model="form.dueDate"
                    :config="datePickerConfig"
                    :placeholder="t('homeworks.selectDueDate')"
                    :class="fieldErrors.dueDate ? 'border-error-500' : 'border-gray-300 dark:border-gray-700'"
                    class="h-11 w-full rounded-lg border bg-white px-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  />
                  <CalendarDays class="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
                <p v-if="fieldErrors.dueDate" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.dueDate }}</p>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('homeworks.maxGrade') }} <span class="text-error-500">*</span>
                </label>
                <input
                  v-model="form.maxGrade"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  :max="MAX_GRADE_LIMIT"
                  step="1"
                  :class="fieldErrors.maxGrade ? 'border-error-500' : 'border-gray-300 dark:border-gray-700'"
                  class="h-11 w-full rounded-lg border bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90"
                />
                <p v-if="fieldErrors.maxGrade" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.maxGrade }}</p>
                <p v-else class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ t('homeworks.maxGradeHint', { max: MAX_GRADE_LIMIT }) }}
                </p>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('common.status') }}</label>
                <SelectMenu
                  v-model="statusModel"
                  :options="statusOptions"
                  :aria-label="t('common.status')"
                  trigger-class="flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 text-left text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
                <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{{ t('homeworks.statusHint') }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Files -->
        <section class="min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-500/10">
              <Paperclip class="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('homeworkAttachments.title') }}</h2>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{ isEditing ? t('homeworkAttachments.editHint') : t('homeworkAttachments.createHint') }}
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <!-- Already saved: struck through once marked, dropped on save. -->
            <div v-if="savedAttachments.length">
              <p class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                {{ t('homeworkAttachments.saved', { count: savedAttachments.length }) }}
              </p>
              <HomeworkAttachmentList
                :attachments="savedAttachments"
                :removable="canEdit"
                :pending-removal-ids="removedIds"
                @remove="askRemoveAttachment"
                @restore="restoreAttachment"
              />
              <p v-if="removedIds.length" class="mt-2 text-xs text-warning-600 dark:text-warning-400">
                {{ t('homeworkAttachments.pendingRemoval', { count: removedIds.length }) }}
              </p>
            </div>

            <HomeworkAttachmentPicker
              v-if="canEdit"
              v-model="newFiles"
              :used-slots="usedSlots"
              :disabled="saving"
              :uploading="uploading"
              :progress="uploadProgress"
              :error="fieldErrors.attachments"
            />
            <p v-else-if="!savedAttachments.length" class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('homeworkAttachments.none') }}
            </p>
          </div>
        </section>

        <!-- Reachable by direct URL even though the list hides Edit on others' rows. -->
        <p
          v-if="isEditing && !canEdit"
          class="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400"
        >
          {{ t('homeworks.notOfferingTeacher') }}
        </p>

        <div class="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 dark:border-gray-800 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
            @click="router.push('/homeworks')"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            v-if="canEdit"
            type="submit"
            :disabled="saving"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
            <Save v-else-if="isEditing" class="h-4 w-4" />
            <Plus v-else class="h-4 w-4" />
            {{ isEditing ? t('homeworks.saveChanges') : t('homeworks.create') }}
          </button>
        </div>
      </form>
    </div>

    <!-- Deleting a saved file is irreversible once the form is saved. -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="removalTarget"
          class="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          @mousedown="removalBackdrop.onMouseDown"
          @mouseup="removalBackdrop.onMouseUp"
        >
          <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div class="flex flex-col items-center text-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/20">
                <AlertTriangle class="h-6 w-6 text-error-500" />
              </div>
              <h3 class="mt-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                {{ t('homeworkAttachments.confirmRemoveTitle') }}
              </h3>
              <p class="mt-2 break-words text-sm text-gray-500 dark:text-gray-400">
                {{ t('homeworkAttachments.confirmRemoveBody', { name: removalTarget.name }) }}
              </p>
            </div>
            <div class="mt-6 flex justify-center gap-3">
              <button
                type="button"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                @click="removalTarget = null"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="button"
                class="rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-error-600"
                @click="confirmRemoveAttachment"
              >
                {{ t('common.delete') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AdminLayout>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import flatPickr from 'vue-flatpickr-component'
import { Kazakh } from 'flatpickr/dist/l10n/kz'
import { Russian } from 'flatpickr/dist/l10n/ru'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  Loader2,
  NotebookPen,
  Paperclip,
  Plus,
  Save,
  School,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import HomeworkAttachmentList from '@/components/homeworks/HomeworkAttachmentList.vue'
import HomeworkAttachmentPicker from '@/components/homeworks/HomeworkAttachmentPicker.vue'
import OfferingPicker from '@/components/homeworks/OfferingPicker.vue'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import {
  attachmentsOf,
  createHomeworksApi,
  getHomeworkApi,
  replaceHomeworkApi,
  type Homework,
  type HomeworkAttachment,
} from '@/api/homeworks'
import { useHomeworkPermissions } from '@/composables/useHomeworkPermissions'
import { useBackdropClose } from '@/composables/useBackdropClose'
import { useToast } from '@/composables/useToast'

/** The API rejects anything above this with a 400 on `max_grade`. */
const MAX_GRADE_LIMIT = 100

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const { success } = useToast()

const homeworkId = typeof route.params.id === 'string' ? route.params.id : ''
const isEditing = Boolean(homeworkId)

const {
  canCreate,
  canManage,
  loadOfferings,
  subjectGroups,
  offeringsLoading,
} = useHomeworkPermissions()

const homework = ref<Homework | null>(null)

/**
 * Every teacher of the offering may edit, not only the author — a colleague's
 * task is editable, an offering you do not teach is not.
 */
const canEdit = computed(() => (isEditing ? canManage(homework.value) : canCreate.value))
const loading = ref(true)
const saving = ref(false)
const submitError = ref('')
const fieldErrors = ref<Record<string, string>>({})
const selectedSubjectName = ref<number | string | null>(null)

const form = ref({
  offerings: [] as number[],
  description: '',
  dueDate: '',
  maxGrade: '10',
  isActive: true,
})

/** Files queued in the picker; they travel with the save, not before it. */
const newFiles = ref<File[]>([])
/** Saved attachments the teacher asked to drop — sent as `remove_attachments`. */
const removedIds = ref<number[]>([])
const removalTarget = ref<HomeworkAttachment | null>(null)
const removalBackdrop = useBackdropClose(() => {
  removalTarget.value = null
})
const uploadProgress = ref(0)

const savedAttachments = computed(() => (homework.value ? attachmentsOf(homework.value) : []))

/** The 10-file cap counts what stays plus what is queued. */
const usedSlots = computed(() => savedAttachments.value.length - removedIds.value.length)

const uploading = computed(() => saving.value && newFiles.value.length > 0)

function askRemoveAttachment(attachment: HomeworkAttachment) {
  removalTarget.value = attachment
}

function confirmRemoveAttachment() {
  const target = removalTarget.value
  if (target && !removedIds.value.includes(target.id)) removedIds.value.push(target.id)
  removalTarget.value = null
}

function restoreAttachment(attachment: HomeworkAttachment) {
  removedIds.value = removedIds.value.filter(id => id !== attachment.id)
}

const subjectOptions = computed<SelectOption[]>(() =>
  subjectGroups.value.map(group => ({
    value: group.subjectName,
    label: group.subjectName,
    sublabel: t('homeworks.classCount', { count: group.offerings.length }),
  })),
)

const offeringOptions = computed(
  () => subjectGroups.value.find(group => group.subjectName === selectedSubjectName.value)?.offerings ?? [],
)

const statusOptions = computed<SelectOption[]>(() => [
  { value: 'active', label: t('homeworks.statuses.active') },
  { value: 'pending', label: t('homeworks.statuses.pending') },
])

const statusModel = computed<number | string | null>({
  get: () => (form.value.isActive ? 'active' : 'pending'),
  set: value => {
    form.value.isActive = value === 'active'
  },
})

const subjectTriggerClass = computed(() =>
  [
    'flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border bg-white px-4 text-left text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-900 dark:text-white/90',
    fieldErrors.value.subject ? 'border-error-500' : 'border-gray-300 dark:border-gray-700',
  ].join(' '),
)

const pickerLocale = computed(() => (locale.value === 'kz' ? Kazakh : locale.value === 'ru' ? Russian : undefined))
const datePickerConfig = computed(() => ({
  dateFormat: 'Y-m-d',
  altInput: true,
  altFormat: 'd.m.Y',
  allowInput: false,
  disableMobile: true,
  locale: pickerLocale.value,
}))

// Switching subject invalidates the picked classes — they belong to other offerings.
watch(selectedSubjectName, () => {
  form.value.offerings = []
})

onMounted(loadInitialData)

async function loadInitialData() {
  loading.value = true
  try {
    // Needed in both modes: it fills the create picker, and on edit it decides
    // whether this teacher may touch the homework's offering at all.
    await loadOfferings()

    if (isEditing) {
      const { data } = await getHomeworkApi(homeworkId)
      homework.value = data
      form.value.description = data.description
      form.value.dueDate = data.due_date
      form.value.maxGrade = String(data.max_grade)
      form.value.isActive = data.is_active
    } else {
      // `?subject=` lets a subject page hand off its own subject; it only matches
      // when the teacher actually teaches it, otherwise fall back to the first.
      const requested = typeof route.query.subject === 'string' ? route.query.subject : ''
      const preselected = subjectGroups.value.find(group => group.subjectName === requested)
      const [firstSubject] = subjectGroups.value
      const target = preselected ?? firstSubject
      if (target) selectedSubjectName.value = target.subjectName
    }
  } catch (error) {
    // Homework outside the caller's scope answers 404, not 403 — say "not
    // found" rather than accusing the user of a permission problem.
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    submitError.value = t(status === 404 ? 'homeworks.notFound' : 'homeworks.detailLoadError')
  } finally {
    loading.value = false
  }
}

function validate(): boolean {
  fieldErrors.value = {}
  if (!form.value.description.trim()) fieldErrors.value.description = t('validation.required')
  if (!form.value.dueDate) fieldErrors.value.dueDate = t('validation.required')

  const maxGrade = Number(form.value.maxGrade)
  if (!form.value.maxGrade.toString().trim() || !Number.isInteger(maxGrade)) {
    fieldErrors.value.maxGrade = t('homeworks.maxGradeInteger')
  } else if (maxGrade < 1 || maxGrade > MAX_GRADE_LIMIT) {
    fieldErrors.value.maxGrade = t('homeworks.maxGradeRange', { max: MAX_GRADE_LIMIT })
  }

  if (!isEditing) {
    if (!selectedSubjectName.value) fieldErrors.value.subject = t('validation.required')
    if (!form.value.offerings.length) fieldErrors.value.offerings = t('homeworks.classGroupRequired')
  }
  return Object.keys(fieldErrors.value).length === 0
}

async function submitForm() {
  submitError.value = ''
  if (!validate()) return

  saving.value = true
  uploadProgress.value = 0
  const upload = { onProgress: (percent: number) => { uploadProgress.value = percent } }
  try {
    if (isEditing) {
      await replaceHomeworkApi(
        homeworkId,
        {
          description: form.value.description.trim(),
          max_grade: Number(form.value.maxGrade),
          due_date: form.value.dueDate,
          is_active: form.value.isActive,
        },
        // Incremental: files not listed here stay attached.
        { add: newFiles.value, remove: removedIds.value },
        upload,
      )
      success(t('homeworks.updatedSuccess'))
    } else {
      // Each offering is created with its own copy of the files.
      const { data } = await createHomeworksApi(
        {
          offerings: form.value.offerings,
          description: form.value.description.trim(),
          max_grade: Number(form.value.maxGrade),
          due_date: form.value.dueDate,
          is_active: form.value.isActive,
        },
        newFiles.value,
        upload,
      )
      success(t('homeworks.createdSuccess', { count: data.length }))
    }
    await router.push('/homeworks')
  } catch (error) {
    applyBackendErrors(error)
  } finally {
    saving.value = false
    uploadProgress.value = 0
  }
}

function offeringName(offeringId: number): string {
  return offeringOptions.value.find(option => option.offeringId === offeringId)?.displayName
    ?? `#${offeringId}`
}

function firstErrorMessage(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(firstErrorMessage).filter(Boolean).join(' ')
  if (value && typeof value === 'object') {
    return Object.values(value).map(firstErrorMessage).filter(Boolean).join(' ')
  }
  return ''
}

function applyBackendErrors(error: unknown) {
  const fallback = t(isEditing ? 'homeworks.updateFailed' : 'homeworks.createFailed')
  const data = axios.isAxiosError(error) ? error.response?.data : null
  if (!data || typeof data !== 'object') {
    submitError.value = fallback
    return
  }

  const fieldMap: Record<string, string> = {
    offerings: 'offerings',
    description: 'description',
    due_date: 'dueDate',
    max_grade: 'maxGrade',
    // Both file errors belong next to the picker.
    attachments: 'attachments',
    remove_attachments: 'attachments',
  }

  Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
    // A 403 answers with `offerings: [94]` — the ids the caller does not teach,
    // not error strings. Name the classes instead of echoing raw ids.
    if (key === 'offerings' && Array.isArray(value) && value.every(item => typeof item === 'number')) {
      fieldErrors.value.offerings = t('homeworks.offeringsForbidden', {
        classes: (value as number[]).map(offeringName).join(', '),
      })
      return
    }
    const message = firstErrorMessage(value)
    if (!message) return
    if (fieldMap[key]) fieldErrors.value[fieldMap[key]] = message
    else if (key === 'detail') submitError.value = [submitError.value, message].filter(Boolean).join(' ')
  })

  if (!submitError.value && !Object.keys(fieldErrors.value).length) submitError.value = fallback
}
</script>
