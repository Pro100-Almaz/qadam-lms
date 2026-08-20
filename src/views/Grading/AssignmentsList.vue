<template>
  <AdminLayout>
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">{{ t('assignments.title') }}</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('assignments.subtitle') }}</p>
        </div>
        <button
          v-if="canCreate"
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
          @click="openCreate"
        >
          <Plus class="h-4 w-4" /> {{ t('assignments.create') }}
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div class="w-full sm:w-48">
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('assignments.subject') }}</label>
          <SelectMenu
            v-model="filters.subject"
            :options="subjectOptions"
            :placeholder="t('assignments.allSubjects')"
            :aria-label="t('assignments.subject')"
            clearable
            :clear-label="t('assignments.allSubjects')"
          />
        </div>
        <div class="w-full sm:w-48">
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('assignments.classGroup') }}</label>
          <SelectMenu
            v-model="filters.classGroup"
            :options="classOptions"
            :placeholder="t('assignments.allClassGroups')"
            :aria-label="t('assignments.classGroup')"
            clearable
            :clear-label="t('assignments.allClassGroups')"
          />
        </div>
        <div class="w-full sm:w-44">
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('assignments.category') }}</label>
          <SelectMenu
            v-model="filters.category"
            :options="categoryOptions"
            :placeholder="t('assignments.allCategories')"
            :aria-label="t('assignments.category')"
            clearable
            :clear-label="t('assignments.allCategories')"
          />
        </div>
        <div class="w-full sm:w-40">
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('assignments.dateFrom') }}</label>
          <DatePicker
            v-model="filters.dateFrom"
            :max-date="filters.dateTo"
            :placeholder="t('assignments.pickDate')"
            :aria-label="t('assignments.dateFrom')"
            clearable
          />
        </div>
        <div class="w-full sm:w-40">
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('assignments.dateTo') }}</label>
          <DatePicker
            v-model="filters.dateTo"
            :min-date="filters.dateFrom"
            :placeholder="t('assignments.pickDate')"
            :aria-label="t('assignments.dateTo')"
            clearable
          />
        </div>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-gray-500 transition hover:text-brand-500 dark:text-gray-400"
          @click="resetFilters"
        >
          <X class="h-4 w-4" /> {{ t('common.reset') }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div
          v-for="index in 4"
          :key="index"
          class="h-20 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
        ></div>
      </div>

      <!-- Error -->
      <div
        v-else-if="loadError"
        class="rounded-xl border border-error-200 bg-error-50 px-6 py-10 text-center dark:border-error-500/20 dark:bg-error-500/10"
      >
        <CircleAlert class="mx-auto h-8 w-8 text-error-500" />
        <p class="mt-3 text-sm text-error-600 dark:text-error-400">{{ t('assignments.loadError') }}</p>
        <button
          type="button"
          class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600"
          @click="fetchAssignments"
        >
          {{ t('assignments.tryAgain') }}
        </button>
      </div>

      <!-- Table -->
      <div
        v-else-if="assignments.length"
        class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="w-full min-w-[920px]">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('assignments.assignmentTitle') }}</th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('assignments.date') }}</th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('assignments.subject') }}</th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('assignments.classGroup') }}</th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('assignments.category') }}</th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('assignments.maxGrade') }}</th>
                <!-- `w-px` collapses the column to its content: just the kebab. -->
                <th class="w-px whitespace-nowrap px-5 py-3.5 text-right text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="assignment in assignments"
                :key="assignment.id"
                class="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                <td class="px-5 py-4 align-top">
                  <div class="flex items-start gap-3">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
                      <ClipboardList class="h-4 w-4 text-brand-500" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ assignment.title }}</p>
                    </div>
                  </div>
                </td>
                <td class="whitespace-nowrap px-5 py-4 align-top">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatAcademicDate(assignment.date) }}</span>
                  <!-- When the row was typed in — a different fact from the lesson day. -->
                  <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {{ t('assignments.addedAt', { date: formatRecordedAt(assignment.created_at) }) }}
                  </p>
                </td>
                <td class="px-5 py-4 align-top">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ assignment.subject_name || '—' }}</span>
                </td>
                <td class="px-5 py-4 align-top">
                  <span class="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                    {{ assignment.class_group_name }}
                  </span>
                </td>
                <td class="px-5 py-4 align-top">
                  <AssignmentCategoryBadge :category="assignment.category" />
                </td>
                <td class="px-5 py-4 align-top">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ assignment.max_grade }}</span>
                </td>
                <td class="w-px px-5 py-4 text-right align-top">
                  <button
                    type="button"
                    class="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
                    :aria-label="t('common.actions')"
                    aria-haspopup="menu"
                    :aria-expanded="menuTarget?.id === assignment.id"
                    @click.stop="toggleMenu(assignment, $event)"
                  >
                    <MoreVertical class="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty -->
      <div
        v-else
        class="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900"
      >
        <SearchX class="mx-auto h-8 w-8 text-gray-400" />
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('assignments.noResults') }}</p>
      </div>

      <Pagination
        v-if="!loading && !loadError && total > 0"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[20, 50, 100, 200]"
      />
    </div>

    <AssignmentFormModal
      :open="formOpen"
      :assignment="formTarget"
      :subject-groups="subjectGroups"
      :offerings-loading="offeringsLoading"
      @close="formOpen = false"
      @saved="onSaved"
    />

    <AssignmentGradingModal
      :open="gradingOpen"
      :assignment="gradingTarget"
      :can-grade="canManage(gradingTarget)"
      @close="gradingOpen = false"
    />

    <!-- Row actions. Teleported and fixed-positioned because the table scrolls
         horizontally, and that scroll container clips an absolute dropdown. -->
    <Teleport to="body">
      <div
        v-if="menuTarget"
        class="fixed z-[9998] w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
        :style="{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }"
        role="menu"
        @click.stop
      >
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
          @click="runMenuAction(openGrading)"
        >
          <ClipboardCheck class="h-3.5 w-3.5" />
          {{ canManage(menuTarget) ? t('assignments.grade') : t('assignments.viewGrades') }}
        </button>
        <!-- Any teacher of the offering may edit or delete, author or not. -->
        <template v-if="canManage(menuTarget)">
          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
            @click="runMenuAction(openEdit)"
          >
            <Pencil class="h-3.5 w-3.5" /> {{ t('common.edit') }}
          </button>
          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2 px-4 py-2 text-sm text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
            @click="runMenuAction(askDelete)"
          >
            <Trash2 class="h-3.5 w-3.5" /> {{ t('common.delete') }}
          </button>
        </template>
      </div>
    </Teleport>

    <!-- Delete confirmation -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="deleteTarget"
          class="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          @mousedown="deleteBackdrop.onMouseDown"
          @mouseup="deleteBackdrop.onMouseUp"
        >
          <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div class="flex flex-col items-center text-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/20">
                <AlertTriangle class="h-6 w-6 text-error-500" />
              </div>
              <h3 class="mt-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                {{ t('assignments.deleteTitle') }}
              </h3>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {{ t('assignments.confirmDelete', {
                  title: deleteTarget.title,
                  classGroup: deleteTarget.class_group_name,
                }) }}
              </p>
              <p class="mt-2 text-xs text-gray-400">{{ t('assignments.deleteGradesWarning') }}</p>
            </div>
            <div class="mt-6 flex justify-center gap-3">
              <button
                type="button"
                :disabled="deleting"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                @click="deleteTarget = null"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="button"
                :disabled="deleting"
                class="inline-flex items-center gap-2 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-error-600 disabled:opacity-50"
                @click="confirmDelete"
              >
                <Loader2 v-if="deleting" class="h-4 w-4 animate-spin" />
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AlertTriangle,
  CircleAlert,
  ClipboardCheck,
  ClipboardList,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  SearchX,
  Trash2,
  X,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AssignmentCategoryBadge from '@/components/grading/AssignmentCategoryBadge.vue'
import AssignmentFormModal from '@/components/grading/AssignmentFormModal.vue'
import AssignmentGradingModal from '@/components/grading/AssignmentGradingModal.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import Pagination from '@/components/ui/Pagination.vue'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import {
  SUBJECT_ASSIGNMENT_CATEGORIES,
  deleteSubjectAssignmentApi,
  getSubjectAssignmentsApi,
  type SubjectAssignment,
  type SubjectAssignmentCategory,
} from '@/api/subjectAssignments'
import { getMySubjectsApi } from '@/api/subjects'
import { useAssignmentPermissions } from '@/composables/useAssignmentPermissions'
import { useBackdropClose } from '@/composables/useBackdropClose'
import { useToast } from '@/composables/useToast'
import { formatAcademicDate, formatRecordedAt } from '@/utils/gradeDates'
import type { Subject } from '@/types/subject'

const { t } = useI18n()
const { success } = useToast()
const {
  canCreate,
  canManage,
  loadOfferings,
  offeringsLoading,
  subjectGroups,
  classOptions: teacherClasses,
} = useAssignmentPermissions()

const assignments = ref<SubjectAssignment[]>([])
const total = ref(0)
const loading = ref(true)
const loadError = ref(false)

const subjects = ref<Subject[]>([])

const filters = ref({
  subject: null as number | string | null,
  classGroup: null as number | string | null,
  category: null as number | string | null,
  /** Both `YYYY-MM-DD`, matched against the assignment's academic date. */
  dateFrom: '',
  dateTo: '',
})
const currentPage = ref(1)
const pageSize = ref(50)

// ─── Row actions menu ────────────────────────────────────────────────────────

const MENU_WIDTH = 176 // w-44
const MENU_ITEM_HEIGHT = 36
const MENU_PADDING = 8 // py-1, top and bottom

const menuTarget = ref<SubjectAssignment | null>(null)
const menuPosition = ref({ top: 0, left: 0 })

function toggleMenu(assignment: SubjectAssignment, event: MouseEvent) {
  if (menuTarget.value?.id === assignment.id) {
    menuTarget.value = null
    return
  }

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  // Read-only rows only get the grading entry; the rest also edit and delete.
  const height = (canManage(assignment) ? 3 : 1) * MENU_ITEM_HEIGHT + MENU_PADDING
  const below = rect.bottom + 4

  menuPosition.value = {
    top: below + height > window.innerHeight ? Math.max(8, rect.top - 4 - height) : below,
    left: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
  }
  menuTarget.value = assignment
}

function runMenuAction(action: (assignment: SubjectAssignment) => void) {
  const target = menuTarget.value
  if (!target) return
  menuTarget.value = null
  action(target)
}

/** Anywhere outside the menu closes it; scrolling would leave it detached. */
function closeMenu() {
  menuTarget.value = null
}

// ─── Create / edit ───────────────────────────────────────────────────────────

const formOpen = ref(false)
/** `null` puts the shared modal into create mode. */
const formTarget = ref<SubjectAssignment | null>(null)

function openCreate() {
  formTarget.value = null
  formOpen.value = true
}

function openEdit(assignment: SubjectAssignment) {
  formTarget.value = assignment
  formOpen.value = true
}

function onSaved(saved: SubjectAssignment) {
  // A new row may not belong on the current page or match the active filters,
  // so refetch rather than splicing it in at a guessed position. An edit is
  // patched in place — it cannot change offering, and so cannot move.
  const index = assignments.value.findIndex(assignment => assignment.id === saved.id)
  if (index === -1) fetchAssignments()
  else assignments.value[index] = saved
}

// ─── Grading ─────────────────────────────────────────────────────────────────

const gradingOpen = ref(false)
const gradingTarget = ref<SubjectAssignment | null>(null)

function openGrading(assignment: SubjectAssignment) {
  gradingTarget.value = assignment
  gradingOpen.value = true
}

// ─── Delete ──────────────────────────────────────────────────────────────────

const deleteTarget = ref<SubjectAssignment | null>(null)
const deleting = ref(false)
const deleteBackdrop = useBackdropClose(() => {
  if (!deleting.value) deleteTarget.value = null
})

function askDelete(assignment: SubjectAssignment) {
  deleteTarget.value = assignment
}

async function confirmDelete() {
  const target = deleteTarget.value
  if (!target) return

  deleting.value = true
  try {
    await deleteSubjectAssignmentApi(target.id)
    assignments.value = assignments.value.filter(assignment => assignment.id !== target.id)
    total.value = Math.max(0, total.value - 1)
    deleteTarget.value = null
    success(t('assignments.deletedSuccess'))
    // Deleting the last row of a trailing page would strand the user on an empty
    // page, so step back — the `currentPage` watcher refetches.
    if (!assignments.value.length && currentPage.value > 1) currentPage.value -= 1
  } catch {
    // The API client's interceptor surfaces the failure; keep the dialog open.
  } finally {
    deleting.value = false
  }
}

// ─── Filters ─────────────────────────────────────────────────────────────────

const subjectOptions = computed<SelectOption[]>(() =>
  subjects.value.map(subject => ({ value: subject.id, label: subject.name })),
)

/** A teacher filters within the classes they are assigned to. */
const classOptions = computed<SelectOption[]>(() =>
  teacherClasses.value.map(option => ({ value: option.classGroupId, label: option.displayName })),
)

const categoryOptions = computed<SelectOption[]>(() =>
  SUBJECT_ASSIGNMENT_CATEGORIES.map(category => ({
    value: category,
    label: t(`assignments.categories.${category}`),
  })),
)

const hasActiveFilters = computed(
  () =>
    Boolean(filters.value.subject) ||
    Boolean(filters.value.classGroup) ||
    Boolean(filters.value.category) ||
    Boolean(filters.value.dateFrom) ||
    Boolean(filters.value.dateTo),
)

function resetFilters() {
  filters.value = { subject: null, classGroup: null, category: null, dateFrom: '', dateTo: '' }
}

async function fetchAssignments() {
  loading.value = true
  loadError.value = false
  closeMenu()

  try {
    // The endpoint scopes itself: a teacher gets the offerings they teach plus
    // their homeroom class, so no teacher id is passed. Rows from the homeroom
    // widening are read-only — `canManage()` decides per row.
    const { data } = await getSubjectAssignmentsApi({
      subject: filters.value.subject ? Number(filters.value.subject) : undefined,
      class_group: filters.value.classGroup ? Number(filters.value.classGroup) : undefined,
      category: (filters.value.category as SubjectAssignmentCategory) || undefined,
      date_from: filters.value.dateFrom || undefined,
      date_to: filters.value.dateTo || undefined,
      page: currentPage.value,
      page_size: pageSize.value,
    })
    assignments.value = data.results
    total.value = data.count
  } catch {
    assignments.value = []
    total.value = 0
    loadError.value = true
  } finally {
    loading.value = false
  }
}

watch(
  () => [
    filters.value.subject,
    filters.value.classGroup,
    filters.value.category,
    filters.value.dateFrom,
    filters.value.dateTo,
    pageSize.value,
  ],
  () => {
    if (currentPage.value === 1) fetchAssignments()
    else currentPage.value = 1
  },
)
watch(currentPage, fetchAssignments)

onMounted(() => {
  fetchAssignments()
  loadFilterOptions()
  document.addEventListener('click', closeMenu)
  window.addEventListener('scroll', closeMenu, true)
  window.addEventListener('resize', closeMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenu)
  window.removeEventListener('scroll', closeMenu, true)
  window.removeEventListener('resize', closeMenu)
})

/** Both option lists come from the teacher's own offerings. */
function loadFilterOptions() {
  getMySubjectsApi({ status: 'active' })
    .then(({ data }) => {
      subjects.value = data
    })
    .catch(() => {
      subjects.value = []
    })

  // Also decides which rows may be edited, graded and deleted.
  loadOfferings()
}
</script>
