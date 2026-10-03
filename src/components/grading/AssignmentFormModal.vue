<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[100000] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-3 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="isEditing ? t('assignments.editTitle') : t('assignments.createTitle')"
        @mousedown="backdrop.onMouseDown"
        @mouseup="backdrop.onMouseUp"
      >
        <!-- `dvh`, not `vh`: on mobile `vh` ignores the browser toolbar, which
             pushed the footer buttons off-screen. -->
        <div
          class="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl sm:max-h-[calc(100dvh-2rem)] dark:bg-gray-900"
        >
          <!-- Header -->
          <div class="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 sm:px-6 dark:border-gray-800">
            <div class="min-w-0">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                {{ isEditing ? t('assignments.editTitle') : t('assignments.createTitle') }}
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ isEditing ? t('assignments.editSubtitle') : t('assignments.createSubtitle') }}
              </p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
              :aria-label="t('common.cancel')"
              @click="emit('close')"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <form class="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6" novalidate @submit.prevent="submit">
            <p
              v-if="submitError"
              class="flex items-start gap-2 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400"
            >
              <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
              <span>{{ submitError }}</span>
            </p>

            <!-- Edit: the offering is immutable, so it reads as plain text. -->
            <dl v-if="isEditing" class="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-3 sm:p-4 dark:bg-white/5">
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('assignments.subject') }}</dt>
                <dd class="mt-1 break-words text-sm font-medium text-gray-800 dark:text-white/90">
                  {{ assignment?.subject_name || '—' }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('assignments.classGroup') }}</dt>
                <dd class="mt-1 break-words text-sm font-medium text-gray-800 dark:text-white/90">
                  {{ assignment?.class_group_name || '—' }}
                </dd>
              </div>
            </dl>

            <!-- Create: subject narrows the class list, and the pair is the offering. -->
            <template v-else>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('assignments.subject') }} <span class="text-error-500">*</span>
                </label>
                <SelectMenu
                  v-model="selectedSubjectName"
                  :options="subjectOptions"
                  :placeholder="t('assignments.selectSubject')"
                  :aria-label="t('assignments.subject')"
                  :disabled="offeringsLoading || !subjectOptions.length"
                  :trigger-class="triggerClass(Boolean(fieldErrors.subject))"
                />
                <p v-if="fieldErrors.subject" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.subject }}</p>
                <p
                  v-else-if="!offeringsLoading && !subjectOptions.length"
                  class="mt-1.5 text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ t('assignments.noOfferings') }}
                </p>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('assignments.classGroup') }} <span class="text-error-500">*</span>
                </label>
                <SelectMenu
                  v-model="form.offering"
                  :options="offeringOptions"
                  :placeholder="selectedSubjectName ? t('assignments.selectClass') : t('assignments.pickSubjectFirst')"
                  :aria-label="t('assignments.classGroup')"
                  :disabled="offeringsLoading || !offeringOptions.length"
                  :trigger-class="triggerClass(Boolean(fieldErrors.offering))"
                />
                <p v-if="fieldErrors.offering" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.offering }}</p>
              </div>
            </template>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('assignments.assignmentTitle') }} <span class="text-error-500">*</span>
              </label>
              <input
                v-model="form.title"
                type="text"
                maxlength="255"
                :placeholder="t('assignments.titlePlaceholder')"
                class="h-11 w-full rounded-lg border bg-white px-4 text-base text-gray-800 shadow-theme-xs placeholder:text-gray-400 sm:text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                :class="fieldErrors.title ? 'border-error-500' : 'border-gray-300 dark:border-gray-700'"
              />
              <p v-if="fieldErrors.title" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.title }}</p>
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('assignments.date') }} <span class="text-error-500">*</span>
                </label>
                <DatePicker
                  v-model="form.date"
                  :placeholder="t('assignments.pickDate')"
                  :aria-label="t('assignments.date')"
                  :input-class="dateInputClass(Boolean(fieldErrors.date))"
                />
                <p v-if="fieldErrors.date" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.date }}</p>
                <p v-else class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{{ t('assignments.dateHint') }}</p>
              </div>
              <!-- Optional: left empty, the backend takes the quarter from the
                   date. Picked, it is kept even if the date says otherwise. -->
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('assignments.quarter') }}
                </label>
                <SelectMenu
                  v-model="quarterModel"
                  :options="quarterOptions"
                  :placeholder="t('assignments.quarterAuto')"
                  :aria-label="t('assignments.quarter')"
                  clearable
                  :clear-label="t('assignments.quarterAuto')"
                  :trigger-class="triggerClass(Boolean(fieldErrors.quarter))"
                />
                <p v-if="fieldErrors.quarter" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.quarter }}</p>
                <p v-else class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{{ quarterHint }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('assignments.category') }}
                </label>
                <SelectMenu
                  v-model="categoryModel"
                  :options="categoryOptions"
                  :aria-label="t('assignments.category')"
                  :disabled="isEditingHomework || (categoriesLoading && !categoryOptions.length)"
                  :trigger-class="triggerClass(Boolean(fieldErrors.category))"
                />
                <p v-if="fieldErrors.category" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.category }}</p>
                <p v-else-if="categoriesError" class="mt-1.5 text-xs text-error-500">
                  {{ t('assignments.categoriesLoadFailed') }}
                </p>
                <!-- The backend makes the homework behind it; its description,
                     files and deletion live on the Homeworks page. -->
                <p v-else-if="isHomework" class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ isEditing ? t('assignments.homeworkEditHint') : t('assignments.homeworkCreateHint') }}
                </p>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('assignments.maxGrade') }} <span v-if="isHomework" class="text-error-500">*</span>
                </label>
                <input
                  v-model="form.maxGrade"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  step="1"
                  class="h-11 w-full rounded-lg border bg-white px-4 text-base text-gray-800 shadow-theme-xs focus:border-brand-300 sm:text-sm focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90"
                  :class="fieldErrors.maxGrade ? 'border-error-500' : 'border-gray-300 dark:border-gray-700'"
                />
                <p v-if="fieldErrors.maxGrade" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.maxGrade }}</p>
                <p v-else class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{{ t('assignments.maxGradeHint') }}</p>
              </div>
            </div>

            <div class="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-3 sm:p-4 dark:border-gray-800">
              <div class="min-w-0">
                <p id="assignment-active-label" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('assignments.activeLabel') }}
                </p>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ t('assignments.activeHint') }}</p>
                <p v-if="fieldErrors.isActive" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.isActive }}</p>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="form.isActive"
                aria-labelledby="assignment-active-label"
                class="relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition focus:outline-hidden focus:ring-3 focus:ring-brand-500/20"
                :class="form.isActive ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'"
                @click="form.isActive = !form.isActive"
              >
                <span
                  class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
                  :class="form.isActive ? 'left-[22px]' : 'left-0.5'"
                ></span>
              </button>
            </div>
          </form>

          <!-- Footer. On mobile the actions fill the width and Delete drops
               below them, away from the thumb's path to Save. -->
          <div
            class="flex flex-col-reverse gap-3 border-t border-gray-200 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:px-6 dark:border-gray-800"
            :class="isEditing && !isEditingHomework ? 'sm:justify-between' : 'sm:justify-end'"
          >
            <!-- A homework assignment goes when its homework is deleted, on the
                 Homeworks page; the API refuses it here. -->
            <button
              v-if="isEditing && !isEditingHomework"
              type="button"
              :disabled="saving"
              class="inline-flex items-center justify-center gap-2 rounded-lg border border-error-200 px-4 py-2 text-sm font-medium text-error-500 transition hover:bg-error-50 disabled:opacity-50 dark:border-error-500/30 dark:hover:bg-error-500/10"
              @click="requestDelete"
            >
              <Trash2 class="h-4 w-4" />
              {{ t('common.delete') }}
            </button>
            <div class="flex gap-3 sm:justify-end">
              <button
                type="button"
                :disabled="saving"
                class="inline-flex flex-1 items-center justify-center rounded-lg border sm:flex-none border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                @click="emit('close')"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="button"
                :disabled="saving"
                class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 sm:flex-none px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                @click="submit"
              >
                <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
                {{ isEditing ? t('assignments.saveChanges') : t('assignments.create') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CircleAlert, Loader2, Trash2, X } from 'lucide-vue-next'
import DatePicker from '@/components/ui/DatePicker.vue'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import { useAssignmentCategories } from '@/composables/useAssignmentCategories'
import { useBackdropClose } from '@/composables/useBackdropClose'
import { useToast } from '@/composables/useToast'
import type { TeacherSubjectOfferings } from '@/composables/useTeacherOfferings'
import { toIsoDate } from '@/utils/attendanceWeeks'
import {
  HOMEWORK_CATEGORY,
  createSubjectAssignmentApi,
  updateSubjectAssignmentApi,
  type SubjectAssignment,
  type SubjectAssignmentCategory,
} from '@/api/subjectAssignments'

const props = defineProps<{
  open: boolean
  /** `null` opens the form in create mode. */
  assignment: SubjectAssignment | null
  /** The caller's own offerings — the API rejects any other. */
  subjectGroups: TeacherSubjectOfferings[]
  offeringsLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', assignment: SubjectAssignment): void
  (e: 'delete', assignment: SubjectAssignment): void
}>()

const { t } = useI18n()
const { success } = useToast()
const {
  categories,
  loading: categoriesLoading,
  error: categoriesError,
  load: loadCategories,
} = useAssignmentCategories()
const backdrop = useBackdropClose(() => {
  if (!saving.value) emit('close')
})

const isEditing = computed(() => Boolean(props.assignment))

/**
 * A homework assignment is tied to the `/homeworks/` row the backend made for
 * it, so its type stays put and it cannot be deleted from here.
 */
const isEditingHomework = computed(() => props.assignment?.category === HOMEWORK_CATEGORY)

const saving = ref(false)
const submitError = ref('')
const fieldErrors = ref<Record<string, string>>({})
const selectedSubjectName = ref<number | string | null>(null)

const form = ref({
  offering: null as number | string | null,
  title: '',
  category: 'lesson' as SubjectAssignmentCategory,
  maxGrade: '10',
  /** `YYYY-MM-DD`, the format both the date input and the API speak. */
  date: toIsoDate(new Date()),
  /** 1–4, or `null` for "from the date". */
  quarter: null as number | null,
  isActive: true,
})

/**
 * Whether the teacher picked the quarter in this session, and the date the
 * assignment was opened with. The API recalculates `quarter` whenever `date`
 * is sent without it, and keeps both when both are sent — so what to send
 * depends on what was touched (see `quarterToSend`).
 */
const quarterTouched = ref(false)
const originalDate = ref('')

const quarterOptions = computed<SelectOption[]>(() =>
  [1, 2, 3, 4].map(value => ({ value, label: t('assignments.quarterOption', { quarter: value }) })),
)

const quarterModel = computed<number | string | null>({
  get: () => form.value.quarter,
  set: value => {
    const picked = Number(value)
    form.value.quarter = value === null || value === '' ? null : picked >= 1 && picked <= 4 ? picked : null
    quarterTouched.value = true
  },
})

/** On edit, an untouched quarter follows a changed date, as the API will do. */
const quarterFollowsDate = computed(
  () => isEditing.value && !quarterTouched.value && form.value.date !== originalDate.value,
)

/**
 * - picked, or kept as stored while the date stands: sent, so it is kept;
 * - "from the date", or an untouched quarter under a new date: left out, so
 *   the backend works it out from the date.
 */
const quarterToSend = computed<number | undefined>(() => {
  if (form.value.quarter === null || quarterFollowsDate.value) return undefined
  return form.value.quarter
})

const quarterHint = computed(() => {
  if (quarterFollowsDate.value) return t('assignments.quarterRecalcHint')
  if (form.value.quarter === null) return t('assignments.quarterAutoHint')
  return t('assignments.quarterKeptHint')
})

/**
 * A blank field is sent as `null`, not left out, so clearing it on edit really
 * does make the assignment unscored. `v-model` on a number input may hand back
 * a number, hence the `String`.
 */
const maxGradeToSend = computed<number | null>(() => {
  const raw = String(form.value.maxGrade ?? '').trim()
  return raw === '' ? null : Number(raw)
})

const subjectOptions = computed<SelectOption[]>(() =>
  props.subjectGroups.map(group => ({
    value: group.subjectName,
    label: group.subjectName,
    sublabel: t('assignments.classCount', { count: group.offerings.length }),
  })),
)

const offeringOptions = computed<SelectOption[]>(
  () =>
    props.subjectGroups
      .find(group => group.subjectName === selectedSubjectName.value)
      ?.offerings.map(offering => ({ value: offering.offeringId, label: offering.displayName })) ?? [],
)

/**
 * Admins add categories in the back office, and the API names them in the
 * request's `Accept-Language` — so both the list and its labels come from
 * there. An edited assignment whose category has since been removed still
 * gets an option (labelled by its code), so the select never reads as blank.
 *
 * Homework is picked like any other: the backend creates the homework behind
 * the assignment, and the teacher fills in the rest on the Homeworks page.
 */
const categoryOptions = computed<SelectOption[]>(() => {
  const options = categories.value.map(category => ({ value: category.code, label: category.name }))
  const current = form.value.category
  if (current && !options.some(option => option.value === current)) {
    options.push({ value: current, label: current })
  }
  return options
})

/** `SelectMenu` speaks `string | number | null`; the form field is a code string. */
const categoryModel = computed<number | string | null>({
  get: () => form.value.category,
  set: value => {
    if (value != null && value !== '') form.value.category = String(value)
  },
})

const isHomework = computed(() => form.value.category === HOMEWORK_CATEGORY)

/** Matches `triggerClass`, minus the select chevron's spacing. */
function dateInputClass(hasError: boolean): string {
  return [
    'h-11 w-full cursor-pointer rounded-lg border bg-white px-4 pr-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90',
    hasError ? 'border-error-500' : 'border-gray-300 dark:border-gray-700',
  ].join(' ')
}

function triggerClass(hasError: boolean): string {
  return [
    'flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border bg-white px-4 text-left text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-900 dark:text-white/90',
    hasError ? 'border-error-500' : 'border-gray-300 dark:border-gray-700',
  ].join(' ')
}

// Switching subject invalidates the picked class — it belongs to another offering.
watch(selectedSubjectName, () => {
  form.value.offering = null
})

// Re-seed on every open: the same instance serves create and edit, and the
// teacher can jump straight from one row's Edit to another's.
watch(
  () => [props.open, props.assignment?.id],
  () => {
    if (!props.open) return
    void loadCategories()
    submitError.value = ''
    fieldErrors.value = {}
    const editing = props.assignment
    if (editing) {
      selectedSubjectName.value = editing.subject_name
      form.value = {
        offering: editing.offering_id,
        title: editing.title,
        category: editing.category,
        maxGrade: editing.max_grade === null ? '' : String(editing.max_grade),
        date: editing.date,
        quarter: editing.quarter ?? null,
        isActive: editing.is_active ?? true,
      }
      quarterTouched.value = false
      originalDate.value = editing.date
      return
    }
    const [firstSubject] = props.subjectGroups
    selectedSubjectName.value = firstSubject?.subjectName ?? null
    // A new assignment is nearly always being recorded for today's lesson.
    form.value = {
      offering: null,
      title: '',
      category: 'lesson',
      maxGrade: '10',
      date: toIsoDate(new Date()),
      quarter: null,
      isActive: true,
    }
    quarterTouched.value = false
    originalDate.value = ''
  },
  { immediate: true },
)

function validate(): boolean {
  fieldErrors.value = {}
  if (!form.value.title.trim()) fieldErrors.value.title = t('validation.required')

  // Blank is allowed: it makes the assignment unscored (comments only) —
  // except on homework, which the backend always keeps gradable.
  const maxGrade = maxGradeToSend.value
  if (maxGrade === null && isHomework.value) {
    fieldErrors.value.maxGrade = t('assignments.maxGradeRequiredForHomework')
  } else if (maxGrade !== null && !Number.isInteger(maxGrade)) {
    fieldErrors.value.maxGrade = t('assignments.maxGradeInteger')
  } else if (maxGrade !== null && maxGrade < 1) {
    fieldErrors.value.maxGrade = t('assignments.maxGradeMin')
  }

  // Required on create and rejected as blank on edit, so it is checked on both.
  if (!form.value.date) fieldErrors.value.date = t('validation.required')

  if (!isEditing.value) {
    if (!selectedSubjectName.value) fieldErrors.value.subject = t('validation.required')
    if (!form.value.offering) fieldErrors.value.offering = t('validation.required')
  }
  return Object.keys(fieldErrors.value).length === 0
}

async function submit() {
  submitError.value = ''
  if (!validate()) return

  saving.value = true
  try {
    const editing = props.assignment
    const { data } = editing
      ? await updateSubjectAssignmentApi(editing.id, {
          title: form.value.title.trim(),
          category: form.value.category,
          max_grade: maxGradeToSend.value,
          date: form.value.date,
          quarter: quarterToSend.value,
          is_active: form.value.isActive,
        })
      : await createSubjectAssignmentApi({
          offering: Number(form.value.offering),
          title: form.value.title.trim(),
          category: form.value.category,
          max_grade: maxGradeToSend.value,
          date: form.value.date,
          quarter: quarterToSend.value,
          is_active: form.value.isActive,
        })
    success(t(editing ? 'assignments.updatedSuccess' : 'assignments.createdSuccess'))
    emit('saved', data)
    emit('close')
  } catch (error) {
    applyBackendErrors(error)
  } finally {
    saving.value = false
  }
}

function requestDelete() {
  if (!props.assignment || isEditingHomework.value || saving.value) return
  emit('delete', props.assignment)
}

function firstErrorMessage(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(firstErrorMessage).filter(Boolean).join(' ')
  if (value && typeof value === 'object') {
    return Object.values(value).map(firstErrorMessage).filter(Boolean).join(' ')
  }
  return ''
}

/**
 * The API owns rules the form cannot check — most notably that `max_grade` may
 * not drop below a grade already recorded, nor go blank while marks exist — so
 * its messages land on the field.
 */
function applyBackendErrors(error: unknown) {
  const fallback = t(isEditing.value ? 'assignments.updateFailed' : 'assignments.createFailed')
  const data = axios.isAxiosError(error) ? error.response?.data : null
  if (!data || typeof data !== 'object') {
    submitError.value = fallback
    return
  }

  const fieldMap: Record<string, string> = {
    offering: 'offering',
    title: 'title',
    category: 'category',
    max_grade: 'maxGrade',
    date: 'date',
    quarter: 'quarter',
    is_active: 'isActive',
  }

  const mapped: Record<string, string> = {}
  const rest: string[] = []
  Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
    const message = firstErrorMessage(value)
    if (!message) return
    const field = fieldMap[key]
    if (field) mapped[field] = message
    else rest.push(message)
  })

  fieldErrors.value = mapped
  submitError.value = rest.join(' ') || (Object.keys(mapped).length ? '' : fallback)
}
</script>
