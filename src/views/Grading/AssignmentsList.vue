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
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-700"
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
          class="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-gray-500 transition hover:text-brand-700 dark:text-gray-400"
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
          :category="categoryFilter"
          :date-from="filters.dateFrom"
          :date-to="filters.dateTo"
          :reload-token="reloadTokens[group.offeringId] ?? 0"
          :writable-assignment-ids="writableAssignmentIds(group)"
          @edit-assignment="openEdit"
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
      @delete="onFormDelete"
    />

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
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, CircleAlert, Loader2, Plus, SearchX, X } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AssignmentFormModal from '@/components/grading/AssignmentFormModal.vue'
import GradebookTable from '@/components/grading/GradebookTable.vue'
import StatisticsButton from '@/components/analytics/StatisticsButton.vue'
import type { StatisticsOfferingOption } from '@/components/analytics/ClassStatisticsModal.vue'
import GradeReportButton from '@/components/grading/GradeReportButton.vue'
import type { GradeReportClassOption } from '@/components/grading/GradeReportModal.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import Pagination from '@/components/ui/Pagination.vue'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import {
  getAssignmentOfferingsApi,
  type AssignmentOfferingPickerItem,
} from '@/api/analytics'
import {
  SUBJECT_ASSIGNMENT_CATEGORIES,
  deleteSubjectAssignmentApi,
  getSubjectAssignmentsApi,
  type SubjectAssignment,
  type SubjectAssignmentCategory,
} from '@/api/subjectAssignments'
import { useAssignmentPermissions } from '@/composables/useAssignmentPermissions'
import { useBackdropClose } from '@/composables/useBackdropClose'
import { matchSubjectNames } from '@/composables/useSubjectNameLookup'
import { useToast } from '@/composables/useToast'
import type { LanguageGroup, Subject } from '@/types/subject'

const { t } = useI18n()
const { success } = useToast()
const {
  isTeacher,
  canCreate,
  canManage,
  loadOfferings,
  offeringsLoading,
  subjectGroups,
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
const assignmentOfferings = ref<AssignmentOfferingPickerItem[]>([])
const loading = ref(true)
const loadError = ref(false)

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
    if (!heatmapOfferingIds.value.has(assignment.offering_id)) return
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

function writableAssignmentIds(group: OfferingGroup): number[] {
  return group.assignments
    .filter(assignment => canManage(assignment))
    .map(assignment => assignment.id)
}

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

// ─── Create / edit ───────────────────────────────────────────────────────────

const formOpen = ref(false)
/** `null` puts the shared modal into create mode. */
const formTarget = ref<SubjectAssignment | null>(null)

function openCreate() {
  formTarget.value = null
  formOpen.value = true
}

/** The gradebook's column header is the only way in: a click opens this. */
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

function onFormDelete(assignment: SubjectAssignment) {
  formOpen.value = false
  askDelete(assignment)
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

const heatmapOfferings = computed(() =>
  assignmentOfferings.value.filter(offering => offering.can_heatmap),
)

const heatmapOfferingIds = computed(() =>
  new Set(heatmapOfferings.value.map(offering => offering.id)),
)

const subjectOptions = computed<SelectOption[]>(() =>
  [...new Map(
    heatmapOfferings.value.map(offering => [
      offering.subject_id,
      { value: offering.subject_id, label: offering.subject },
    ]),
  ).values()].sort((a, b) => a.label.localeCompare(b.label)),
)

/** A teacher filters within heatmap-readable classes. */
const classOptions = computed<SelectOption[]>(() =>
  [...new Map(
    heatmapOfferings.value.map(offering => [
      offering.class_group_id,
      { value: offering.class_group_id, label: offering.class_group },
    ]),
  ).values()].sort((a, b) => a.label.localeCompare(b.label)),
)

const subjects = computed<Subject[]>(() =>
  [...new Map(
    heatmapOfferings.value.map(offering => [
      offering.subject_id,
      {
        id: offering.subject_id,
        name: offering.subject,
        language_group: offering.subject_language_group as LanguageGroup,
        status: 'active' as const,
        added_by: null,
      },
    ]),
  ).values()],
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
  heatmapOfferings.value.map(offering => ({
    offeringId: offering.id,
    label: offering.subject,
    sublabel: offering.class_group,
  })),
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

onMounted(async () => {
  try {
    await loadFilterOptions()
    await fetchAssignments()
  } catch {
    assignments.value = []
    loadError.value = true
    loading.value = false
  }
})

/**
 * The analytics picker says which offerings can safely mount a heatmap table.
 * The teacher-offering helper still owns create/edit/delete permission checks.
 */
async function loadFilterOptions() {
  const [pickerResult] = await Promise.all([
    getAssignmentOfferingsApi(),
    loadOfferings(),
  ])
  assignmentOfferings.value = pickerResult.data.offerings
}
</script>
