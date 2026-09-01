<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-4 sm:items-center"
        role="dialog"
        aria-modal="true"
        :aria-label="t('gradeReport.title')"
        @mousedown="backdrop.onMouseDown"
        @mouseup="backdrop.onMouseUp"
      >
        <div class="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl dark:bg-gray-900">
          <!-- Header -->
          <div class="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <div class="min-w-0">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('gradeReport.title') }}</h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('gradeReport.subtitle') }}</p>
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

          <form class="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5" novalidate @submit.prevent="submit">
            <p
              v-if="submitError"
              class="flex items-start gap-2 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400"
            >
              <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
              <span>{{ submitError }}</span>
            </p>

            <!-- A fixed student needs no picker; who it is still has to be visible. -->
            <div v-if="fixedStudent?.name" class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-white/5">
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('gradeReport.student') }}</p>
              <p class="mt-0.5 text-sm font-medium text-gray-800 dark:text-white/90">{{ fixedStudent.name }}</p>
            </div>

            <template v-else>
              <!-- Whole class, or one student out of it. -->
              <div v-if="allowStudentScope">
                <span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('gradeReport.scope') }}
                </span>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-for="option in scopeOptions"
                    :key="option.value"
                    type="button"
                    class="rounded-lg border px-3 py-2 text-sm font-medium transition"
                    :class="
                      scope === option.value
                        ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5'
                    "
                    :aria-pressed="scope === option.value"
                    @click="scope = option.value"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('gradeReport.classGroup') }} <span class="text-error-500">*</span>
                </label>
                <SelectMenu
                  v-model="classGroupId"
                  :options="classOptions"
                  :placeholder="t('gradeReport.selectClass')"
                  :aria-label="t('gradeReport.classGroup')"
                  :disabled="classesLoading || classOptions.length <= 1"
                  :trigger-class="triggerClass(Boolean(fieldErrors.classGroup))"
                />
                <p v-if="fieldErrors.classGroup" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.classGroup }}</p>
                <p
                  v-else-if="!classesLoading && !classOptions.length"
                  class="mt-1.5 text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ t('gradeReport.noClasses') }}
                </p>
              </div>

              <div v-if="scope === 'student'">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('gradeReport.student') }} <span class="text-error-500">*</span>
                </label>
                <SelectMenu
                  v-model="studentId"
                  :options="studentOptions"
                  :placeholder="studentsLoading ? t('common.loading') : t('gradeReport.selectStudent')"
                  :aria-label="t('gradeReport.student')"
                  :disabled="studentsLoading || !studentOptions.length"
                  :trigger-class="triggerClass(Boolean(fieldErrors.student))"
                />
                <p v-if="fieldErrors.student" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.student }}</p>
                <p
                  v-else-if="!studentsLoading && classGroupId && !studentOptions.length"
                  class="mt-1.5 text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ t('gradeReport.noStudents') }}
                </p>
              </div>
            </template>

            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('gradeReport.quarter') }} <span class="text-error-500">*</span>
                </label>
                <SelectMenu
                  v-model="quarterModel"
                  :options="quarterOptions"
                  :aria-label="t('gradeReport.quarter')"
                  :trigger-class="triggerClass(Boolean(fieldErrors.quarter))"
                />
                <p v-if="fieldErrors.quarter" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.quarter }}</p>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('gradeReport.subject') }} <span v-if="subjectRequired" class="text-error-500">*</span>
                </label>
                <SelectMenu
                  v-model="subjectId"
                  :options="subjectOptions"
                  :placeholder="subjectRequired ? t('gradeReport.selectSubject') : t('gradeReport.allSubjects')"
                  :aria-label="t('gradeReport.subject')"
                  :disabled="!subjectOptions.length"
                  :clearable="!subjectRequired"
                  :clear-label="t('gradeReport.allSubjects')"
                  :trigger-class="triggerClass(Boolean(fieldErrors.subject))"
                />
                <p v-if="fieldErrors.subject" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.subject }}</p>
                <p v-else-if="subjectRequired" class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ t('gradeReport.subjectRequiredHint') }}
                </p>
              </div>
            </div>

            <!-- Which axis becomes a sheet — only the homeroom screens ask, since
                 only there can the report span every subject a class is taught.
                 Locked once a subject is picked: the API rejects the pair,
                 because one subject is one sheet either way. -->
            <div v-if="allowLayoutChoice">
              <span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('gradeReport.layout') }}
              </span>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  v-for="option in layoutOptions"
                  :key="option.value"
                  type="button"
                  :disabled="subjectLocksLayout"
                  class="rounded-lg border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60"
                  :class="
                    ordering === option.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                      : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5'
                  "
                  :aria-pressed="ordering === option.value"
                  @click="ordering = option.value"
                >
                  <span
                    class="block text-sm font-medium"
                    :class="
                      ordering === option.value
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-gray-700 dark:text-gray-300'
                    "
                  >
                    {{ option.label }}
                  </span>
                  <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{{ option.hint }}</span>
                </button>
              </div>
              <p v-if="subjectLocksLayout" class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {{ t('gradeReport.layoutLocked') }}
              </p>
            </div>
          </form>

          <!-- Footer -->
          <div class="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <button
              type="button"
              :disabled="downloading"
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              @click="emit('close')"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              :disabled="downloading"
              class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              @click="submit"
            >
              <Loader2 v-if="downloading" class="h-4 w-4 animate-spin" />
              <Download v-else class="h-4 w-4" />
              {{ downloading ? t('gradeReport.downloading') : t('gradeReport.download') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CircleAlert, Download, Loader2, X } from 'lucide-vue-next'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import { getClassStudentsApi } from '@/api/teacherDashboard'
import {
  downloadClassGroupGradeReportApi,
  downloadStudentGradeReportApi,
  type GradeReportParams,
} from '@/api/gradeReports'
import { useBackdropClose } from '@/composables/useBackdropClose'
import { useCurrentQuarter } from '@/composables/useCurrentQuarter'
import { useToast } from '@/composables/useToast'
import { flattenErrorMessage, readBlobErrorData, saveBlobResponse } from '@/utils/fileDownload'

export interface GradeReportSubjectOption {
  /** Subject **id** — the report endpoint filters on it, not on the offering. */
  id: number
  name: string
}

export interface GradeReportClassOption {
  classGroupId: number
  displayName: string
  /** Subjects taught to this class that the caller may report on. */
  subjects: GradeReportSubjectOption[]
  /**
   * Set for a class the caller only teaches a subject in. The API answers a
   * whole-class request from a subject teacher with a 403 — naming the subject
   * is what opens it to them — so the picker asks for one up front instead.
   * A homeroom teacher, who may read the whole class, leaves it unset.
   */
  requiresSubject?: boolean
}

export interface GradeReportStudentTarget {
  /** Student **profile** id, the id `/grade/student/<id>/` expects. */
  id: number
  /** Shown back to the reader, and used if the server sends no filename. */
  name?: string
}

/**
 * The one place the grade report is configured, for every caller.
 *
 * Two endpoints sit behind it — a class group's workbook and a single student's
 * — and which one runs follows from the target, not from a separate choice:
 * pass `student` and the modal reports on that student, pass `classes` and it
 * reports on a class, optionally narrowed to one of its students.
 */
const props = defineProps<{
  open: boolean
  /** Fixes the report to one student and hides the class and student pickers. */
  student?: GradeReportStudentTarget | null
  /** Subject options for the fixed-student form. */
  subjects?: GradeReportSubjectOption[]
  /** The class groups the caller may report on. */
  classes?: GradeReportClassOption[]
  /** Preselects a class group — the screen is already scoped to one. */
  defaultClassGroupId?: number | null
  /** Offers narrowing a class report down to a single one of its students. */
  allowStudentScope?: boolean
  /**
   * Offers the sheet-per-subject / sheet-per-student choice. Homeroom screens
   * only: everywhere else the report is pinned to one subject — a subject
   * teacher must name one, and the API then rejects `ordering` alongside it —
   * so the choice would be a permanently disabled control.
   */
  allowLayoutChoice?: boolean
  classesLoading?: boolean
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n()
const { success } = useToast()
const { quarter: currentQuarter, load: loadCurrentQuarter } = useCurrentQuarter()
const backdrop = useBackdropClose(() => {
  if (!downloading.value) emit('close')
})

const fixedStudent = computed(() => props.student ?? null)

const scope = ref<'class' | 'student'>('class')
const classGroupId = ref<number | string | null>(null)
const studentId = ref<number | string | null>(null)
const subjectId = ref<number | string | null>(null)
const quarter = ref(currentQuarter.value)
const ordering = ref<'subject' | 'student'>('subject')

const downloading = ref(false)
const submitError = ref('')
const fieldErrors = ref<Record<string, string>>({})

// ─── Options ─────────────────────────────────────────────────────────────────

const classOptions = computed<SelectOption[]>(() =>
  (props.classes ?? []).map(option => ({ value: option.classGroupId, label: option.displayName })),
)

const selectedClass = computed(
  () => (props.classes ?? []).find(option => option.classGroupId === Number(classGroupId.value)) ?? null,
)

/**
 * A fixed student brings their own subject list; a class report offers the
 * subjects of the class in hand, which is also what the API will accept —
 * anything else is a 400 on `subject`.
 */
const subjectOptions = computed<SelectOption[]>(() => {
  const source = fixedStudent.value ? props.subjects ?? [] : selectedClass.value?.subjects ?? []
  return source.map(subject => ({ value: subject.id, label: subject.name }))
})

const quarterOptions = computed<SelectOption[]>(() =>
  [1, 2, 3, 4].map(value => ({ value, label: t('gradeReport.quarterOption', { quarter: value }) })),
)

/** `SelectMenu` speaks `string | number | null`; the quarter is always a number. */
const quarterModel = computed<number | string | null>({
  get: () => quarter.value,
  set: value => {
    const picked = Number(value)
    if (picked >= 1 && picked <= 4) quarter.value = picked
  },
})

const scopeOptions = computed(() => [
  { value: 'class' as const, label: t('gradeReport.scopeClass') },
  { value: 'student' as const, label: t('gradeReport.scopeStudent') },
])

/** One student reads the two layouts differently from a whole class. */
const layoutOptions = computed(() => {
  const single = Boolean(fixedStudent.value) || scope.value === 'student'
  return [
    {
      value: 'subject' as const,
      label: t('gradeReport.layoutBySubject'),
      hint: single ? t('gradeReport.layoutBySubjectStudentHint') : t('gradeReport.layoutBySubjectClassHint'),
    },
    {
      value: 'student' as const,
      label: single ? t('gradeReport.layoutOneSheet') : t('gradeReport.layoutByStudent'),
      hint: single ? t('gradeReport.layoutOneSheetHint') : t('gradeReport.layoutByStudentHint'),
    },
  ]
})

/** A subject teacher may only report on the subject they teach. */
const subjectRequired = computed(() => Boolean(!fixedStudent.value && selectedClass.value?.requiresSubject))

/** `ordering` and `subject` together are a 400, so the picked subject wins. */
const subjectLocksLayout = computed(() => Boolean(subjectId.value))

watch(subjectLocksLayout, locked => {
  if (locked) ordering.value = 'subject'
})

// With a subject compulsory and only one to choose, there is nothing to ask.
watch([subjectRequired, subjectOptions], ([required, options]) => {
  if (required && !subjectId.value && options.length === 1) subjectId.value = options[0].value
})

// ─── Students of the picked class ────────────────────────────────────────────

/** The roster always names its students, unlike a caller-supplied target. */
const students = ref<{ id: number; name: string }[]>([])
const studentsLoading = ref(false)
/** The roster does not change while the modal is open — fetch each class once. */
const studentCache = new Map<number, { id: number; name: string }[]>()

const studentOptions = computed<SelectOption[]>(() =>
  students.value.map(student => ({ value: student.id, label: student.name })),
)

async function loadStudents() {
  const id = Number(classGroupId.value)
  if (scope.value !== 'student' || !id) {
    students.value = []
    return
  }

  const cached = studentCache.get(id)
  if (cached) {
    students.value = cached
    return
  }

  studentsLoading.value = true
  try {
    const { data } = await getClassStudentsApi(id)
    // `student_id` is the profile id the report endpoint wants; `user_id`, the
    // one the roster links to, is a different id space and would 403 or 404.
    const roster = data.students.map(student => ({ id: student.student_id, name: student.full_name }))
    studentCache.set(id, roster)
    students.value = roster
  } catch {
    students.value = []
  } finally {
    studentsLoading.value = false
  }
}

watch([scope, classGroupId], () => {
  studentId.value = null
  loadStudents()
})

// Switching class invalidates the subject: it belongs to another class's list.
watch(classGroupId, () => {
  subjectId.value = null
})

// ─── Open / reset ────────────────────────────────────────────────────────────

watch(
  () => props.open,
  isOpen => {
    if (!isOpen) return
    submitError.value = ''
    fieldErrors.value = {}
    scope.value = 'class'
    subjectId.value = null
    studentId.value = null
    ordering.value = 'subject'
    // A single class needs no choosing; otherwise honour the host's preselection.
    const only = (props.classes ?? []).length === 1 ? props.classes![0].classGroupId : null
    classGroupId.value = props.defaultClassGroupId ?? only
    // The calendar's guess shows immediately; the academic year's own answer
    // replaces it when it lands, unless the reader has already picked one.
    const seeded = currentQuarter.value
    quarter.value = seeded
    loadCurrentQuarter().then(() => {
      if (quarter.value === seeded) quarter.value = currentQuarter.value
    })
  },
  { immediate: true },
)

// The host may still be loading its class list when the modal opens.
watch(
  () => props.classes,
  classes => {
    if (!props.open || classGroupId.value) return
    if (props.defaultClassGroupId) classGroupId.value = props.defaultClassGroupId
    else if (classes?.length === 1) classGroupId.value = classes[0].classGroupId
  },
)

// ─── Download ────────────────────────────────────────────────────────────────

function triggerClass(hasError: boolean): string {
  return [
    'flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border bg-white px-4 text-left text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-900 dark:text-white/90',
    hasError ? 'border-error-500' : 'border-gray-300 dark:border-gray-700',
  ].join(' ')
}

/** Used only when the server's `Content-Disposition` is not readable. */
function fallbackFilename(): string {
  const target = fixedStudent.value?.name ?? (scope.value === 'student'
    ? students.value.find(student => student.id === Number(studentId.value))?.name
    : selectedClass.value?.displayName)
  const parts = ['Grades', target?.replace(/\s+/g, '_'), `Q${quarter.value}`].filter(Boolean)
  return `${parts.join('_')}.xlsx`
}

function validate(): boolean {
  fieldErrors.value = {}
  if (!fixedStudent.value) {
    if (!classGroupId.value) fieldErrors.value.classGroup = t('validation.required')
    if (scope.value === 'student' && !studentId.value) fieldErrors.value.student = t('validation.required')
  }
  if (subjectRequired.value && !subjectId.value) fieldErrors.value.subject = t('validation.required')
  if (!quarter.value) fieldErrors.value.quarter = t('validation.required')
  return Object.keys(fieldErrors.value).length === 0
}

async function submit() {
  submitError.value = ''
  if (!validate()) return

  const params: GradeReportParams = {
    quarter: quarter.value,
    subject: subjectId.value ? Number(subjectId.value) : undefined,
    // Without the choice on screen the default layout is the only one on offer.
    ordering: props.allowLayoutChoice && ordering.value === 'student' ? 'student' : undefined,
  }

  downloading.value = true
  try {
    const target = fixedStudent.value?.id ?? (scope.value === 'student' ? Number(studentId.value) : null)
    const response = target
      ? await downloadStudentGradeReportApi(target, params)
      : await downloadClassGroupGradeReportApi(Number(classGroupId.value), params)

    const filename = saveBlobResponse(response, fallbackFilename())
    success(t('gradeReport.success'), filename)
    emit('close')
  } catch (error) {
    await applyBackendError(error)
  } finally {
    downloading.value = false
  }
}

/**
 * The failure arrives as a Blob wrapping JSON, because the request asked for a
 * Blob. Its complaints are per query parameter — `quarter`, `subject`,
 * `ordering` — so they land on the field that caused them, and a `detail` (the
 * 403 a subject teacher gets on a whole-class report) on the form.
 */
async function applyBackendError(error: unknown) {
  const data = await readBlobErrorData(error)
  if (!data) {
    submitError.value = t('gradeReport.failed')
    return
  }

  const fieldMap: Record<string, string> = {
    quarter: 'quarter',
    subject: 'subject',
    ordering: 'ordering',
    student: 'student',
    class_group: 'classGroup',
  }

  const mapped: Record<string, string> = {}
  const rest: string[] = []
  Object.entries(data).forEach(([key, value]) => {
    const message = flattenErrorMessage(value)
    if (!message) return
    const field = fieldMap[key]
    if (field) mapped[field] = message
    else rest.push(message)
  })

  fieldErrors.value = mapped
  // An `ordering` complaint has no field of its own to sit under.
  if (mapped.ordering) rest.unshift(mapped.ordering)
  submitError.value = rest.join(' ') || (Object.keys(mapped).length ? '' : t('gradeReport.failed'))
}
</script>
