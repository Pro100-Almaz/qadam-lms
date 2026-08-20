<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open && homework"
        class="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-4 sm:items-center"
        role="dialog"
        aria-modal="true"
        :aria-label="t('homeworks.gradingTitle')"
        @mousedown="backdrop.onMouseDown"
        @mouseup="backdrop.onMouseUp"
      >
        <div class="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl dark:bg-gray-900">
          <!-- Header -->
          <div class="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <div class="min-w-0">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                {{ canGrade ? t('homeworks.gradingTitle') : t('homeworks.gradesTitle') }}
              </h3>
              <p class="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                {{ homework.offering.subject_name }} · {{ homework.offering.class_group_name }} ·
                {{ t('homeworks.maxGrade') }} {{ homework.max_grade }}
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

          <!-- Body -->
          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <!-- Loading -->
            <div v-if="loading" class="space-y-2">
              <div
                v-for="index in 6"
                :key="index"
                class="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
              ></div>
            </div>

            <!-- Load error -->
            <div v-else-if="loadError" class="py-10 text-center">
              <CircleAlert class="mx-auto h-8 w-8 text-error-500" />
              <p class="mt-3 text-sm text-error-600 dark:text-error-400">{{ t('homeworks.gradingLoadError') }}</p>
              <button
                type="button"
                class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600"
                @click="load"
              >
                {{ t('homeworks.tryAgain') }}
              </button>
            </div>

            <!-- Empty roster -->
            <div v-else-if="!rows.length" class="py-10 text-center">
              <Users class="mx-auto h-8 w-8 text-gray-400" />
              <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('homeworks.noStudentsInClass') }}</p>
            </div>

            <!-- Roster -->
            <div v-else class="space-y-1.5">
              <div
                v-for="row in rows"
                :key="row.studentId"
                class="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-500 dark:bg-brand-500/10">
                  {{ initials(row.fullName) }}
                </div>
                <p class="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                  {{ row.fullName }}
                </p>

                <span v-if="row.error" class="shrink-0 text-xs text-error-500">{{ row.error }}</span>

                <!-- Only the offering's teachers may write; everyone else reads. -->
                <div v-if="!canGrade" class="flex shrink-0 items-center gap-1.5">
                  <span class="w-20 text-center text-sm font-medium text-gray-800 dark:text-white/90">
                    {{ text(row.value) || '—' }}
                  </span>
                  <span class="w-8 text-xs text-gray-400">/ {{ homework.max_grade }}</span>
                </div>
                <div v-else class="flex shrink-0 items-center gap-1.5">
                  <input
                    v-model="row.value"
                    type="number"
                    inputmode="numeric"
                    min="0"
                    :max="homework.max_grade"
                    step="1"
                    :aria-label="row.fullName"
                    class="h-9 w-20 rounded-lg border bg-white px-2.5 text-center text-sm text-gray-800 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-800 dark:text-white/90"
                    :class="row.error
                      ? 'border-error-400 focus:border-error-400'
                      : 'border-gray-300 focus:border-brand-300 dark:border-gray-700'"
                    :placeholder="'—'"
                  />
                  <span class="w-8 text-xs text-gray-400">/ {{ homework.max_grade }}</span>
                </div>
              </div>
            </div>

            <p v-if="submitError" class="mt-4 text-sm text-error-500">{{ submitError }}</p>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('homeworks.gradedCount', { graded: gradedCount, total: rows.length }) }}
            </p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                @click="emit('close')"
              >
                {{ canGrade ? t('common.cancel') : t('documentPreview.close') }}
              </button>
              <button
                v-if="canGrade"
                type="button"
                :disabled="saving || loading || loadError || !dirtyCount"
                class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                @click="save"
              >
                <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
                {{ dirtyCount ? t('homeworks.saveGradesCount', { count: dirtyCount }) : t('common.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CircleAlert, Loader2, Users, X } from 'lucide-vue-next'
import { useBackdropClose } from '@/composables/useBackdropClose'
import { useToast } from '@/composables/useToast'
import { getStudentsApi } from '@/api/students'
import {
  createHomeworkGradeApi,
  deleteHomeworkGradeApi,
  getHomeworkGradesApi,
  updateHomeworkGradeApi,
  type Homework,
} from '@/api/homeworks'

/** One roster line. `studentId` is the Student *profile* id the API keys on. */
interface GradeRow {
  studentId: number
  fullName: string
  /** Existing `HomeworkGrade.id`, or null when this student has no grade row yet. */
  gradeId: number | null
  /**
   * Bound to the input. `string | number` is not sloppiness: Vue casts `v-model`
   * through `looseToNumber` for any `type="number"` input, so this holds a string
   * while empty and a number once typed into. Always read it through `text()`.
   */
  value: string | number
  /** What was loaded from the server, for change detection. Always a string. */
  original: string
  error: string
}

/** Normalises the dual-typed input model to the trimmed string form. */
function text(value: string | number): string {
  return String(value ?? '').trim()
}

/** Comfortably above any real class size — the sheet must show every student. */
const ROSTER_PAGE_SIZE = 200

const props = withDefaults(
  defineProps<{
    open: boolean
    homework: Homework | null
    /**
     * Writes are limited to the teachers of the homework's offering. Everyone
     * else — staff, psychologists, students, parents — reads the grades as
     * plain text; the API 403s their writes anyway.
     */
    canGrade?: boolean
  }>(),
  { canGrade: true },
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const { t } = useI18n()
const { success } = useToast()
const backdrop = useBackdropClose(() => emit('close'))

const rows = ref<GradeRow[]>([])
const loading = ref(false)
const loadError = ref(false)
const saving = ref(false)
const submitError = ref('')

const gradedCount = computed(() => rows.value.filter(row => text(row.value) !== '').length)
const dirtyCount = computed(() => rows.value.filter(row => text(row.value) !== row.original).length)

// Reload every time the modal opens — grades may have changed elsewhere, and the
// teacher can open a different homework without the component being torn down.
watch(
  () => [props.open, props.homework?.id],
  () => {
    if (props.open && props.homework) load()
  },
  { immediate: true },
)

async function load() {
  const homework = props.homework
  if (!homework) return

  loading.value = true
  loadError.value = false
  submitError.value = ''
  try {
    // The roster is the source of the profile ids; the grade list only covers
    // students already graded, so it cannot drive the rows on its own.
    const [rosterResult, gradesResult] = await Promise.all([
      getStudentsApi({ class_group: homework.class_group_id, page_size: ROSTER_PAGE_SIZE }),
      getHomeworkGradesApi(homework.id),
    ])

    const gradeByStudent = new Map(gradesResult.data.map(grade => [grade.student, grade]))

    rows.value = rosterResult.data
      .map<GradeRow>(student => {
        // `student.id` is the profile id and `student.user.id` the user id —
        // the grade's `student` matches the former.
        const existing = gradeByStudent.get(student.id)
        const value = existing ? String(existing.grade) : ''
        return {
          studentId: student.id,
          fullName: fullName(student.user),
          gradeId: existing?.id ?? null,
          value,
          original: value,
          error: '',
        }
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
  } catch {
    rows.value = []
    loadError.value = true
  } finally {
    loading.value = false
  }
}

function fullName(user: { first_name: string; last_name: string }): string {
  return `${user.last_name} ${user.first_name}`.trim()
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

function validate(): boolean {
  const max = props.homework?.max_grade ?? 0
  let valid = true
  rows.value.forEach(row => {
    row.error = ''
    const raw = text(row.value)
    if (raw === '') return
    const parsed = Number(raw)
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > max) {
      row.error = t('homeworks.gradeRange', { max })
      valid = false
    }
  })
  return valid
}

async function save() {
  const homework = props.homework
  if (!homework || !props.canGrade) return

  submitError.value = ''
  if (!validate()) return

  const changed = rows.value.filter(row => text(row.value) !== row.original)
  if (!changed.length) return

  saving.value = true
  // Settled-not-all: one rejected row must not discard the rows that succeeded,
  // so failures are counted and the successful ones are committed locally.
  const results = await Promise.allSettled(
    changed.map(row => {
      const raw = text(row.value)
      // Cleared field: only reachable with an existing row, since a student who
      // was never graded has `original === ''` and so never lands in `changed`.
      if (raw === '') {
        return row.gradeId === null ? Promise.resolve() : deleteHomeworkGradeApi(row.gradeId)
      }
      const grade = Number(raw)
      return row.gradeId === null
        ? createHomeworkGradeApi(homework.id, { student: row.studentId, grade })
        : updateHomeworkGradeApi(row.gradeId, { grade })
    }),
  )
  saving.value = false

  let failed = 0
  results.forEach((result, index) => {
    const row = changed[index]
    if (result.status === 'rejected') {
      failed += 1
      row.error = t('homeworks.gradeSaveFailed')
      return
    }
    // Commit locally instead of refetching: a create hands back the new row id,
    // and a delete leaves the student ungraded.
    const raw = text(row.value)
    row.original = raw
    row.error = ''
    if (raw === '') row.gradeId = null
    else if (row.gradeId === null) {
      const created = (result.value as { data?: { id?: number } } | undefined)?.data
      row.gradeId = created?.id ?? null
    }
  })

  if (failed) {
    // A create whose id did not come back would be duplicated on the next save,
    // so resync and let the server state win. The message is set afterwards
    // because `load()` clears it.
    if (rows.value.some(row => row.original !== '' && row.gradeId === null)) await load()
    submitError.value = t('homeworks.gradesPartialError', { count: failed })
    return
  }

  success(t('homeworks.gradesSaved'))
  emit('saved')
  emit('close')
}
</script>
