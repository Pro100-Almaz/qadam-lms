<template>
  <AdminLayout>
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">{{ t('assignments.title') }}</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('assignments.subtitle') }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <!-- One offering's class against the assignments on this page — the
               same record the table below lists, not the lesson-topic gradebook
               a subject's own page charts. Teachers only: the grid names every
               student in the class. -->
          <StatisticsButton
            v-if="isTeacher"
            kind="assignments"
            :offerings="statisticsOfferings"
            :offerings-loading="offeringsLoading"
          />
          <!-- Whole class, or one student the teacher teaches. -->
          <GradeReportButton
            v-if="isTeacher"
            :classes="reportClasses"
            :classes-loading="offeringsLoading"
            allow-student-scope
          />
          <button
            v-if="canCreate"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            @click="openCreate"
          >
            <Plus class="h-4 w-4" /> {{ t('assignments.create') }}
          </button>
        </div>
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
          v-for="index in 2"
          :key="index"
          class="h-64 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
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

      <!-- One gradebook per subject and class: assignments across in date order,
           the class down the rows. -->
      <div v-else-if="pagedGroups.length" class="space-y-6">
        <GradebookTable
          v-for="group in pagedGroups"
          :key="group.offeringId"
          :offering-id="group.offeringId"
          :subject-name="group.subjectName"
          :class-group-name="group.classGroupName"
          :assignments="group.assignments"
          :open-assignment-id="menuTarget?.id ?? null"
          :category="categoryFilter"
          :date-from="filters.dateFrom"
          :date-to="filters.dateTo"
          :reload-token="reloadTokens[group.offeringId] ?? 0"
          @assignment-menu="toggleMenu"
        />
      </div>

      <!-- Empty -->
      <div
        v-else
        class="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900"
      >
        <SearchX class="mx-auto h-8 w-8 text-gray-400" />
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('assignments.noResults') }}</p>
      </div>

      <!-- Paginates the tables, not the assignments: every table loads its own
           grid, so putting them all on one page would fan out a request each. -->
      <Pagination
        v-if="!loading && !loadError && groups.length"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="groups.length"
        :page-sizes="[5, 10, 20]"
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
      @saved="onGradesSaved"
    />

    <!-- One column's actions. Teleported and fixed-positioned because the
         gradebook scrolls horizontally, and that scroll container clips an
         absolute dropdown. -->
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
  Loader2,
  Pencil,
  Plus,
  SearchX,
  Trash2,
  X,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AssignmentFormModal from '@/components/grading/AssignmentFormModal.vue'
import AssignmentGradingModal from '@/components/grading/AssignmentGradingModal.vue'
import GradebookTable from '@/components/grading/GradebookTable.vue'
import StatisticsButton from '@/components/analytics/StatisticsButton.vue'
import type { StatisticsOfferingOption } from '@/components/analytics/ClassStatisticsModal.vue'
import GradeReportButton from '@/components/grading/GradeReportButton.vue'
import type { GradeReportClassOption } from '@/components/grading/GradeReportModal.vue'
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
import { matchSubjectNames } from '@/composables/useSubjectNameLookup'
import { useToast } from '@/composables/useToast'
import type { Subject } from '@/types/subject'

const { t } = useI18n()
const { success } = useToast()
const {
  isTeacher,
  canCreate,
  canManage,
  loadOfferings,
  offeringsLoading,
  subjectGroups,
  classOptions: teacherClassOptions,
  teacherClasses,
} = useAssignmentPermissions()

/** One gradebook: an offering's assignments, oldest first. */
interface OfferingGroup {
  offeringId: number
  subjectName: string
  classGroupName: string
  assignments: SubjectAssignment[]
}

/** Every assignment matching the filters, across every page of the list. */
const assignments = ref<SubjectAssignment[]>([])
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
/** Tables per page — each one loads a grid of its own, so the page stays small. */
const pageSize = ref(5)

// ─── Gradebooks ──────────────────────────────────────────────────────────────

/**
 * The assignments regrouped into one table per offering — which is one subject
 * taught to one class. Sorted the way a teacher scans them: by subject, then by
 * class; columns within a table run oldest to newest.
 */
const groups = computed<OfferingGroup[]>(() => {
  const grouped = new Map<number, OfferingGroup>()
  assignments.value.forEach(assignment => {
    const existing = grouped.get(assignment.offering_id)
    if (existing) {
      existing.assignments.push(assignment)
      return
    }
    grouped.set(assignment.offering_id, {
      offeringId: assignment.offering_id,
      subjectName: assignment.subject_name,
      classGroupName: assignment.class_group_name,
      assignments: [assignment],
    })
  })

  return [...grouped.values()]
    .map(group => ({
      ...group,
      assignments: group.assignments
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id),
    }))
    .sort(
      (a, b) =>
        a.subjectName.localeCompare(b.subjectName) ||
        a.classGroupName.localeCompare(b.classGroupName),
    )
})

/** The select stores its option value untyped; the grids take the union. */
const categoryFilter = computed<SubjectAssignmentCategory | null>(
  () => (filters.value.category as SubjectAssignmentCategory) || null,
)

const pagedGroups = computed(() =>
  groups.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value),
)

/**
 * Per-offering reload counters. A table holds its own grid, so a save has to
 * tell it to refetch — but only the table whose marks actually changed.
 */
const reloadTokens = ref<Record<number, number>>({})

function reloadOffering(offeringId: number) {
  reloadTokens.value = {
    ...reloadTokens.value,
    [offeringId]: (reloadTokens.value[offeringId] ?? 0) + 1,
  }
}

// ─── Column actions menu ─────────────────────────────────────────────────────

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
  // A read-only column only gets the grading entry; the rest also edit and delete.
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
  // A new assignment may not match the active filters at all, so refetch rather
  // than guessing it into a table. An edit is patched in place — it cannot
  // change offering, and so cannot move to another table.
  const index = assignments.value.findIndex(assignment => assignment.id === saved.id)
  if (index === -1) fetchAssignments()
  else assignments.value[index] = saved
  // The grid holds its own copy of the columns; a new or retitled assignment
  // only reaches it on a refetch.
  reloadOffering(saved.offering_id)
}

// ─── Grading ─────────────────────────────────────────────────────────────────

const gradingOpen = ref(false)
const gradingTarget = ref<SubjectAssignment | null>(null)

function openGrading(assignment: SubjectAssignment) {
  gradingTarget.value = assignment
  gradingOpen.value = true
}

/** Only the graded offering's table is stale; the others were not touched. */
function onGradesSaved() {
  if (gradingTarget.value) reloadOffering(gradingTarget.value.offering_id)
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
    deleteTarget.value = null
    success(t('assignments.deletedSuccess'))
    // The column goes with it, and so do the grades that were recorded on it.
    reloadOffering(target.offering_id)
    // Deleting an offering's last assignment takes its whole table away, which
    // can empty a trailing page — step back rather than strand the user there.
    if (!pagedGroups.value.length && currentPage.value > 1) currentPage.value -= 1
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
  teacherClassOptions.value.map(option => ({ value: option.classGroupId, label: option.displayName })),
)

/**
 * The report picker's classes. Subjects are matched by name against the
 * teacher's own subject list, already loaded for the filter above — on this
 * page the teacher reports on what they teach, which is the same set.
 */
const reportClasses = computed<GradeReportClassOption[]>(() =>
  teacherClasses.value
    .slice()
    .sort((a, b) => a.grade_level - b.grade_level || a.display_name.localeCompare(b.display_name))
    .map(classGroup => ({
      classGroupId: classGroup.class_group_id,
      displayName: classGroup.display_name,
      subjects: matchSubjectNames(
        subjects.value,
        classGroup.subjects.map(subject => subject.subject_name),
      ),
      // Only a homeroom teacher may pull a class's whole workbook.
      requiresSubject: !classGroup.is_homeroom,
    })),
)

/**
 * The offerings the heatmap may be asked for — the teacher's own, flattened out
 * of the subject → classes grouping. The API 403s any other offering, so this
 * list is the boundary, not just a convenience.
 */
const statisticsOfferings = computed<StatisticsOfferingOption[]>(() =>
  subjectGroups.value.flatMap(group =>
    group.offerings.map(offering => ({
      offeringId: offering.offeringId,
      label: group.subjectName,
      sublabel: offering.displayName,
    })),
  ),
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

/** Well past a term's assignments for one class, and under any sane API cap. */
const LIST_PAGE_SIZE = 200
/** A stop against a runaway `count`; 2000 assignments is already unreadable. */
const MAX_LIST_PAGES = 10

async function fetchAssignments() {
  loading.value = true
  loadError.value = false
  closeMenu()

  try {
    // Every page, not just the first: an offering's assignments are spread
    // across the list by date, so a single page would leave columns out of the
    // tables built from it.
    //
    // The endpoint scopes itself: a teacher gets the offerings they teach plus
    // their homeroom class, so no teacher id is passed. Assignments from the
    // homeroom widening are read-only — `canManage()` decides per assignment.
    const collected: SubjectAssignment[] = []
    for (let page = 1; page <= MAX_LIST_PAGES; page += 1) {
      const { data } = await getSubjectAssignmentsApi({
        subject: filters.value.subject ? Number(filters.value.subject) : undefined,
        class_group: filters.value.classGroup ? Number(filters.value.classGroup) : undefined,
        category: (filters.value.category as SubjectAssignmentCategory) || undefined,
        date_from: filters.value.dateFrom || undefined,
        date_to: filters.value.dateTo || undefined,
        page,
        page_size: LIST_PAGE_SIZE,
      })
      collected.push(...data.results)
      if (!data.results.length || collected.length >= data.count) break
    }
    assignments.value = collected
  } catch {
    assignments.value = []
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
  ],
  () => {
    currentPage.value = 1
    fetchAssignments()
  },
)

// The tables are paginated client-side, so paging is free — nothing to refetch.
watch(pageSize, () => {
  currentPage.value = 1
})

// A filter narrowing the tables can leave the reader past the last page.
watch(
  () => groups.value.length,
  () => {
    const lastPage = Math.max(1, Math.ceil(groups.value.length / pageSize.value))
    if (currentPage.value > lastPage) currentPage.value = lastPage
  },
)

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
