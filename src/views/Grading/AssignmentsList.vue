<template>
  <AdminLayout>
    <div class="space-y-6">
      <div class="flex items-start justify-between gap-4 sm:items-center">
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">{{ t('assignments.title') }}</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('assignments.subtitle') }}</p>
        </div>
        <!-- Every page action sits behind one menu. The statistics grid and
             the report name every student in a class, so those are teachers
             only. -->
        <div v-if="hasActions" ref="actionsRoot" class="relative shrink-0">
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            :aria-label="t('common.actions')"
            aria-haspopup="menu"
            :aria-expanded="actionsOpen"
            @click="actionsOpen = !actionsOpen"
          >
            <MoreVertical class="h-5 w-5" />
          </button>
          <div
            v-if="actionsOpen"
            class="absolute right-0 z-30 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
            role="menu"
          >
            <button
              v-if="canCreate"
              type="button"
              role="menuitem"
              class="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-gray-50 dark:text-brand-400 dark:hover:bg-white/5"
              @click="runAction(openCreate)"
            >
              <Plus class="h-4 w-4" /> {{ t('assignments.create') }}
            </button>
            <div v-if="canCreate && isTeacher" class="my-1 border-t border-gray-100 dark:border-gray-800"></div>
            <template v-if="isTeacher">
              <button
                type="button"
                role="menuitem"
                class="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                @click="runAction(() => (quarterGradesOpen = true))"
              >
                <GraduationCap class="h-4 w-4" /> {{ t('quarterGrades.button') }}
              </button>
              <button
                type="button"
                role="menuitem"
                class="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                @click="runAction(() => (statisticsOpen = true))"
              >
                <ChartColumnBig class="h-4 w-4" /> {{ t('statistics.button') }}
              </button>
              <button
                type="button"
                role="menuitem"
                class="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                @click="runAction(() => (reportOpen = true))"
              >
                <Download class="h-4 w-4" /> {{ t('gradeReport.button') }}
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <!-- Required, never cleared: a whole year of assignments is too much to
             load, and the quarter is how a teacher reads the gradebook anyway. -->
        <div class="w-full sm:w-36">
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('assignments.quarter') }}</label>
          <SelectMenu
            v-model="quarterModel"
            :options="quarterOptions"
            :aria-label="t('assignments.quarter')"
          />
        </div>
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
        <!-- Off by default: inactive assignments stay out of the tables, but a
             teacher still needs a way to reach one to switch it back on. -->
        <label class="inline-flex h-10 cursor-pointer items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
          <button
            type="button"
            role="switch"
            :aria-checked="filters.showInactive"
            class="relative h-6 w-11 shrink-0 rounded-full transition focus:outline-hidden focus:ring-3 focus:ring-brand-500/20"
            :class="filters.showInactive ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'"
            @click="filters.showInactive = !filters.showInactive"
          >
            <span
              class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
              :class="filters.showInactive ? 'left-[22px]' : 'left-0.5'"
            ></span>
          </button>
          {{ t('assignments.showInactive') }}
        </label>
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
          @click="fetchTables"
        >
          {{ t('assignments.tryAgain') }}
        </button>
      </div>

      <!-- One gradebook per subject and class: assignments across in date order,
           the class down the rows. -->
      <div v-else-if="pagedGroups.length" class="space-y-6">
        <template v-for="group in pagedGroups" :key="group.offeringId">
          <GradebookTable
            v-if="offeringGrades[group.offeringId]"
            :offering-id="group.offeringId"
            :class-group-id="group.classGroupId"
            :subject-name="group.subjectName"
            :class-group-name="group.classGroupName"
            :grades="offeringGrades[group.offeringId]"
            :quarter="filters.quarter"
            :category="categoryFilter"
            :date-from="filters.dateFrom"
            :date-to="filters.dateTo"
            :writable-assignment-ids="writableAssignmentIds(group.offeringId)"
            :show-inactive="filters.showInactive"
            @edit-assignment="openEdit"
          />
          <!-- Its grades are still on the way; without them the table would
               fetch them itself, and then again when they arrive. -->
          <div
            v-else
            class="h-64 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          ></div>
        </template>
      </div>

      <!-- Empty -->
      <div
        v-else
        class="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900"
      >
        <SearchX class="mx-auto h-8 w-8 text-gray-400" />
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('assignments.noResults') }}</p>
      </div>

      <!-- Paginates the tables, not the assignments: every table on the page
           loads its grades and roster, so all of them at once would fan out. -->
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
          class="fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/50 p-4"
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

    <template v-if="isTeacher">
      <QuarterGradesModal
        :open="quarterGradesOpen"
        :offerings="assignmentOfferings"
        :offerings-loading="offeringsLoading"
        @close="quarterGradesOpen = false"
      />
      <!-- One offering's class against the assignments on this page — the same
           record the table lists, not the lesson-topic gradebook a subject's own
           page charts. -->
      <AssignmentStatisticsModal
        :open="statisticsOpen"
        :offerings="statisticsOfferings"
        :offerings-loading="offeringsLoading"
        @close="statisticsOpen = false"
      />
      <!-- Whole class, or one student the teacher teaches. -->
      <GradeReportModal
        :open="reportOpen"
        :classes="reportClasses"
        :classes-loading="offeringsLoading"
        allow-student-scope
        @close="reportOpen = false"
      />
    </template>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AlertTriangle,
  ChartColumnBig,
  CircleAlert,
  Download,
  GraduationCap,
  Loader2,
  MoreVertical,
  Plus,
  SearchX,
  X,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AssignmentFormModal from '@/components/grading/AssignmentFormModal.vue'
import GradebookTable from '@/components/grading/GradebookTable.vue'
import AssignmentStatisticsModal from '@/components/analytics/AssignmentStatisticsModal.vue'
import type { StatisticsOfferingOption } from '@/components/analytics/ClassStatisticsModal.vue'
import QuarterGradesModal from '@/components/grading/QuarterGradesModal.vue'
import GradeReportModal, { type GradeReportClassOption } from '@/components/grading/GradeReportModal.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import Pagination from '@/components/ui/Pagination.vue'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import { getTeacherOfferingsApi } from '@/api/teacherDashboard'
import {
  deleteSubjectAssignmentApi,
  getAllOfferingGradesApi,
  type OfferingGradesAssignment,
  type SubjectAssignment,
  type SubjectAssignmentCategory,
} from '@/api/subjectAssignments'
import { useAssignmentCategories } from '@/composables/useAssignmentCategories'
import { useAssignmentPermissions } from '@/composables/useAssignmentPermissions'
import { useBackdropClose } from '@/composables/useBackdropClose'
import { matchSubjectNames } from '@/composables/useSubjectNameLookup'
import { useToast } from '@/composables/useToast'
import type { LanguageGroup, Subject } from '@/types/subject'
import type { TeacherOffering } from '@/types/teacherDashboard'

const { t } = useI18n()
const { success } = useToast()
const { categories, load: loadCategories } = useAssignmentCategories()
const {
  isTeacher,
  canCreate,
  canManage,
  loadOfferings,
  offeringsLoading,
  subjectGroups,
  teacherClasses,
} = useAssignmentPermissions()

/** One gradebook: an offering — one subject taught to one class. */
interface OfferingGroup {
  offeringId: number
  classGroupId: number
  subjectName: string
  classGroupName: string
}

/** Every offering the teacher teaches, for the filters and the modals. */
const assignmentOfferings = ref<TeacherOffering[]>([])
/**
 * Only the taught offerings with at least one assignment: the tables. Not
 * narrowed by quarter, category or date — `/teacher/offerings/` takes none of
 * them — so a table can come up empty under those filters.
 */
const tableOfferings = ref<TeacherOffering[]>([])
/**
 * `/subject-grades/` of the offerings paged to so far under the current
 * filters, keyed by offering id. Emptied whenever the filters change.
 */
const offeringGrades = ref<Record<number, OfferingGradesAssignment[]>>({})
const loading = ref(true)
const loadError = ref(false)

/** The quarter the page opens on, and the one Reset goes back to. */
const DEFAULT_QUARTER = 1

const filters = ref({
  /** 1–4, always set: the assignment's own `quarter`, not its date. */
  quarter: DEFAULT_QUARTER,
  subject: null as number | string | null,
  classGroup: null as number | string | null,
  category: null as number | string | null,
  /** Both `YYYY-MM-DD`, matched against the assignment's academic date. */
  dateFrom: '',
  dateTo: '',
  /** Client-side only: the tables hide inactive columns themselves. */
  showInactive: false,
})
const currentPage = ref(1)
/** Tables per page — each one loads a grid of its own, so the page stays small. */
const pageSize = ref(5)

// ─── Gradebooks ──────────────────────────────────────────────────────────────

/**
 * One table per offering with assignments, narrowed by the
 * subject and class filters. Sorted the way a teacher scans them: by subject,
 * then by class.
 */
const groups = computed<OfferingGroup[]>(() =>
  tableOfferings.value
    .filter(
      offering =>
        (!filters.value.subject || offering.subject_id === Number(filters.value.subject)) &&
        (!filters.value.classGroup || offering.class_group_id === Number(filters.value.classGroup)),
    )
    .map(offering => ({
      offeringId: offering.id,
      classGroupId: offering.class_group_id,
      subjectName: offering.subject,
      classGroupName: offering.class_group,
    }))
    .sort(
      (a, b) =>
        a.subjectName.localeCompare(b.subjectName) ||
        a.classGroupName.localeCompare(b.classGroupName),
    ),
)

/** The select stores its option value untyped; the grids take the union. */
const categoryFilter = computed<SubjectAssignmentCategory | null>(
  () => (filters.value.category as SubjectAssignmentCategory) || null,
)

const pagedGroups = computed(() =>
  groups.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value),
)

function writableAssignmentIds(offeringId: number): number[] {
  return (offeringGrades.value[offeringId] ?? [])
    .filter(assignment => canManage(assignment))
    .map(assignment => assignment.id)
}

/**
 * Refetches after one offering's assignments changed: its grades, so only that
 * table reloads, and the table list, since its first or last assignment makes
 * the table appear or disappear.
 */
async function reloadOffering(offeringId: number) {
  const request = fetchSeq
  try {
    const [{ data }, grades] = await Promise.all([
      getTeacherOfferingsApi(TABLE_PARAMS),
      getAllOfferingGradesApi(offeringId, gradeParams()),
    ])
    // A filter change since then has refetched everything; this is stale.
    if (request !== fetchSeq) return
    tableOfferings.value = data.offerings
    offeringGrades.value = { ...offeringGrades.value, [offeringId]: grades }
  } catch {
    // The API client's interceptor surfaces the failure; the table keeps its
    // last good copy.
  }
}

// ─── Create / edit ───────────────────────────────────────────────────────────

const formOpen = ref(false)
const quarterGradesOpen = ref(false)
const statisticsOpen = ref(false)
const reportOpen = ref(false)

// ─── Page actions menu ───────────────────────────────────────────────────────

const actionsOpen = ref(false)
const actionsRoot = ref<HTMLElement | null>(null)
const hasActions = computed(() => canCreate.value || isTeacher.value)

function runAction(action: () => void) {
  actionsOpen.value = false
  action()
}

/** A click anywhere but the menu, or Escape, closes it. */
function onDocumentPointer(event: MouseEvent) {
  if (actionsOpen.value && !actionsRoot.value?.contains(event.target as Node)) actionsOpen.value = false
}

function onDocumentKey(event: KeyboardEvent) {
  if (event.key === 'Escape') actionsOpen.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentPointer)
  document.addEventListener('keydown', onDocumentKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentPointer)
  document.removeEventListener('keydown', onDocumentKey)
})
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
  // Refetched rather than patched in: a new or edited assignment may no longer
  // match the filters, and an assignment cannot change offering, so its own
  // offering is the only table it can touch.
  void reloadOffering(saved.offering_id)
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
    deleteTarget.value = null
    success(t('assignments.deletedSuccess'))
    // The column goes with it, and so do the grades that were recorded on it.
    // Deleting an offering's last assignment takes its whole table away; the
    // `groups.length` watch steps back off an emptied trailing page.
    void reloadOffering(target.offering_id)
  } catch {
    // The API client's interceptor surfaces the failure; keep the dialog open.
  } finally {
    deleting.value = false
  }
}

// ─── Filters ─────────────────────────────────────────────────────────────────

/**
 * Filter entries from the offerings the teacher teaches. Their homeroom class's
 * other offerings live on the My Class page, never in this list.
 */
const subjectOptions = computed<SelectOption[]>(() =>
  [...new Map(
    assignmentOfferings.value.map(offering => [
      offering.subject_id,
      { value: offering.subject_id, label: offering.subject },
    ]),
  ).values()].sort((a, b) => a.label.localeCompare(b.label)),
)

/** A teacher filters within the classes they teach. */
const classOptions = computed<SelectOption[]>(() =>
  [...new Map(
    assignmentOfferings.value.map(offering => [
      offering.class_group_id,
      { value: offering.class_group_id, label: offering.class_group },
    ]),
  ).values()].sort((a, b) => a.label.localeCompare(b.label)),
)

const subjects = computed<Subject[]>(() =>
  [...new Map(
    assignmentOfferings.value.map(offering => [
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

/** The same offerings as the tables, for the Statistics picker. */
const statisticsOfferings = computed<StatisticsOfferingOption[]>(() =>
  assignmentOfferings.value.map(offering => ({
    offeringId: offering.id,
    label: offering.subject,
    sublabel: offering.class_group,
    classGroupId: offering.class_group_id,
  })),
)

/** Same list, and the same backend names, as the form's Type select. */
const categoryOptions = computed<SelectOption[]>(() =>
  categories.value.map(category => ({ value: category.code, label: category.name })),
)

const quarterOptions = computed<SelectOption[]>(() =>
  [1, 2, 3, 4].map(value => ({ value, label: t('assignments.quarterOption', { quarter: value }) })),
)

/** `SelectMenu` speaks `string | number | null`; the quarter is always 1–4. */
const quarterModel = computed<number | string | null>({
  get: () => filters.value.quarter,
  set: value => {
    const picked = Number(value)
    if (picked >= 1 && picked <= 4) filters.value.quarter = picked
  },
})

const hasActiveFilters = computed(
  () =>
    filters.value.quarter !== DEFAULT_QUARTER ||
    Boolean(filters.value.subject) ||
    Boolean(filters.value.classGroup) ||
    Boolean(filters.value.category) ||
    Boolean(filters.value.dateFrom) ||
    Boolean(filters.value.dateTo) ||
    filters.value.showInactive,
)

function resetFilters() {
  filters.value = {
    quarter: DEFAULT_QUARTER,
    subject: null,
    classGroup: null,
    category: null,
    dateFrom: '',
    dateTo: '',
    showInactive: false,
  }
}

/** The filters `/subject-grades/` applies itself; subject and class pick the offerings. */
function gradeParams() {
  return {
    quarter: filters.value.quarter,
    category: (filters.value.category as SubjectAssignmentCategory) || undefined,
    date_from: filters.value.dateFrom || undefined,
    date_to: filters.value.dateTo || undefined,
  }
}

/** The offerings with any assignment at all; the filters are not sent. */
const TABLE_PARAMS = { include_empty: false }

/** Bumped per filter change, so a slower response for old filters is dropped. */
let fetchSeq = 0

/**
 * The offerings with assignments — one request, which is what decides the
 * tables and the page count. Their grades come per page.
 */
async function fetchTables() {
  const request = ++fetchSeq
  loading.value = true
  loadError.value = false
  offeringGrades.value = {}

  try {
    const { data } = await getTeacherOfferingsApi(TABLE_PARAMS)
    if (request !== fetchSeq) return
    tableOfferings.value = data.offerings
    // Called, not left to the paging watch: a filter change can leave the
    // same offerings on the page, which the watch would not see as a change.
    loadPageGrades()
  } catch {
    if (request !== fetchSeq) return
    tableOfferings.value = []
    loadError.value = true
  } finally {
    if (request === fetchSeq) loading.value = false
  }
}

/** Offering id → the `fetchSeq` its grades request was sent under. */
const pendingGrades = new Map<number, number>()

/**
 * The grades of the tables on the current page that do not have them yet. Each
 * offering's grades are fetched once per filter set, so paging back is free.
 */
function loadPageGrades() {
  const request = fetchSeq
  const params = gradeParams()
  pagedGroups.value.forEach(({ offeringId }) => {
    if (offeringId in offeringGrades.value || pendingGrades.get(offeringId) === request) return
    pendingGrades.set(offeringId, request)
    getAllOfferingGradesApi(offeringId, params)
      .then(grades => {
        if (request === fetchSeq) offeringGrades.value = { ...offeringGrades.value, [offeringId]: grades }
      })
      .catch(() => {
        if (request === fetchSeq) loadError.value = true
      })
      .finally(() => {
        if (pendingGrades.get(offeringId) === request) pendingGrades.delete(offeringId)
      })
  })
}

watch(() => pagedGroups.value.map(group => group.offeringId).join(), loadPageGrades)

/**
 * The grade filters leave the table list alone — the endpoint does not take
 * them — so only the grades are dropped and refetched for the page.
 */
watch(
  () => [filters.value.quarter, filters.value.category, filters.value.dateFrom, filters.value.dateTo],
  () => {
    fetchSeq++
    offeringGrades.value = {}
    loadError.value = false
    currentPage.value = 1
    loadPageGrades()
  },
)

// Subject and class only narrow the tables already loaded; the paging watch
// fetches whatever grades the new first page is missing.
watch(
  () => [filters.value.subject, filters.value.classGroup],
  () => {
    currentPage.value = 1
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
    await fetchTables()
  } catch {
    tableOfferings.value = []
    loadError.value = true
    loading.value = false
  }
})

/**
 * `/teacher/offerings/` names the teacher's offerings. The teacher-offering
 * helper still owns create/edit/delete permission checks.
 */
async function loadFilterOptions() {
  const [pickerResult] = await Promise.all([
    getTeacherOfferingsApi(),
    loadOfferings(),
    loadCategories(),
  ])
  assignmentOfferings.value = pickerResult.data.offerings
}
</script>
