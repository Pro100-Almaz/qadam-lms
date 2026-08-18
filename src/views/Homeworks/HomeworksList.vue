<template>
  <AdminLayout>
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">{{ t('homeworks.title') }}</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('homeworks.subtitle') }}</p>
        </div>
        <router-link
          to="/homeworks/create"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          <Plus class="h-4 w-4" /> {{ t('homeworks.create') }}
        </router-link>
      </div>

      <!-- Filters -->
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div class="w-full sm:w-48">
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('homeworks.subject') }}</label>
          <SelectMenu
            v-model="filters.subject"
            :options="subjectOptions"
            :placeholder="t('homeworks.allSubjects')"
            :aria-label="t('homeworks.subject')"
            clearable
            :clear-label="t('homeworks.allSubjects')"
          />
        </div>
        <div class="w-full sm:w-48">
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('homeworks.classGroup') }}</label>
          <SelectMenu
            v-model="filters.classGroup"
            :options="classOptions"
            :placeholder="t('homeworks.allClassGroups')"
            :aria-label="t('homeworks.classGroup')"
            clearable
            :clear-label="t('homeworks.allClassGroups')"
          />
        </div>
        <div class="w-full sm:w-40">
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('common.status') }}</label>
          <SelectMenu
            v-model="filters.status"
            :options="statusOptions"
            :placeholder="t('homeworks.allStatuses')"
            :aria-label="t('common.status')"
            clearable
            :clear-label="t('homeworks.allStatuses')"
          />
        </div>
        <div class="w-full sm:w-40">
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('homeworks.dueFrom') }}</label>
          <flat-pickr
            v-model="filters.dueFrom"
            :config="datePickerConfig"
            :placeholder="t('homeworks.anyDate')"
            class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
        </div>
        <div class="w-full sm:w-40">
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('homeworks.dueTo') }}</label>
          <flat-pickr
            v-model="filters.dueTo"
            :config="datePickerConfig"
            :placeholder="t('homeworks.anyDate')"
            class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
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
          class="h-24 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
        ></div>
      </div>

      <!-- Error -->
      <div
        v-else-if="loadError"
        class="rounded-xl border border-error-200 bg-error-50 px-6 py-10 text-center dark:border-error-500/20 dark:bg-error-500/10"
      >
        <CircleAlert class="mx-auto h-8 w-8 text-error-500" />
        <p class="mt-3 text-sm text-error-600 dark:text-error-400">{{ t('homeworks.loadError') }}</p>
        <button
          type="button"
          class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600"
          @click="fetchHomeworks"
        >
          {{ t('homeworks.tryAgain') }}
        </button>
      </div>

      <!-- Table -->
      <div
        v-else-if="homeworks.length"
        class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="w-full min-w-[820px]">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('homeworks.subject') }}</th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('common.description') }}</th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('homeworks.classGroup') }}</th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('homeworks.dueDate') }}</th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('homeworks.maxGrade') }}</th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('common.status') }}</th>
                <th class="px-5 py-3.5 text-right text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="homework in homeworks"
                :key="homework.id"
                class="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                <td class="px-5 py-4 align-top">
                  <div class="flex items-start gap-3">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
                      <NotebookPen class="h-4 w-4 text-brand-500" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                        {{ homework.offering.subject_name || '—' }}
                      </p>
                      <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {{ t('homeworks.createdAt') }}: {{ formatDateTime(homework.created_at) }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="max-w-sm px-5 py-4 align-top">
                  <p class="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{{ homework.description || '—' }}</p>
                  <HomeworkAttachmentList
                    v-if="attachmentsOf(homework).length"
                    class="mt-2"
                    size="sm"
                    :attachments="attachmentsOf(homework)"
                  />
                </td>
                <td class="px-5 py-4 align-top">
                  <span class="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                    {{ homework.offering.class_group_name }}
                  </span>
                  <p class="mt-1 text-xs text-gray-400">{{ homework.offering.academic_year_label }}</p>
                </td>
                <td class="whitespace-nowrap px-5 py-4 align-top">
                  <span
                    class="inline-flex items-center gap-1.5 text-sm"
                    :class="isOverdue(homework) ? 'text-error-500' : 'text-gray-700 dark:text-gray-300'"
                  >
                    <CalendarDays class="h-3.5 w-3.5" />
                    {{ formatDate(homework.due_date) }}
                  </span>
                </td>
                <td class="px-5 py-4 align-top">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ homework.max_grade }}</span>
                </td>
                <td class="px-5 py-4 align-top">
                  <HomeworkStatusBadge :active="homework.is_active" />
                </td>
                <td class="px-5 py-4 text-right align-top">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-brand-300 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
                      @click="openGrading(homework)"
                    >
                      <ClipboardCheck class="h-3.5 w-3.5" />
                      {{ canGrade(homework) ? t('homeworks.grade') : t('homeworks.viewGrades') }}
                    </button>
                    <!-- Any teacher of the offering may edit or delete, author or not. -->
                    <template v-if="canManage(homework)">
                      <router-link
                        :to="`/homeworks/${homework.id}/edit`"
                        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-brand-300 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
                      >
                        <Pencil class="h-3.5 w-3.5" /> {{ t('common.edit') }}
                      </router-link>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-error-300 hover:text-error-500 dark:border-gray-700 dark:text-gray-300 dark:hover:border-error-500/40"
                        :aria-label="t('common.delete')"
                        @click="askDelete(homework)"
                      >
                        <Trash2 class="h-3.5 w-3.5" /> {{ t('common.delete') }}
                      </button>
                    </template>
                  </div>
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
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('homeworks.noResults') }}</p>
      </div>

      <Pagination
        v-if="!loading && !loadError && total > 0"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[20, 50, 100, 200]"
      />
    </div>

    <HomeworkGradingModal
      :open="gradingOpen"
      :homework="gradingHomework"
      :can-grade="canGrade(gradingHomework)"
      @close="gradingOpen = false"
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
                {{ t('homeworks.deleteTitle') }}
              </h3>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {{ t('homeworks.confirmDelete', {
                  subject: deleteTarget.offering.subject_name,
                  classGroup: deleteTarget.offering.class_group_name,
                }) }}
              </p>
              <p class="mt-2 text-xs text-gray-400">{{ t('homeworks.deleteGradesWarning') }}</p>
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
import flatPickr from 'vue-flatpickr-component'
import { Kazakh } from 'flatpickr/dist/l10n/kz'
import { Russian } from 'flatpickr/dist/l10n/ru'
import {
  AlertTriangle,
  CalendarDays,
  CircleAlert,
  ClipboardCheck,
  Loader2,
  NotebookPen,
  Pencil,
  Plus,
  SearchX,
  Trash2,
  X,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import HomeworkAttachmentList from '@/components/homeworks/HomeworkAttachmentList.vue'
import HomeworkGradingModal from '@/components/homeworks/HomeworkGradingModal.vue'
import HomeworkStatusBadge from '@/components/homeworks/HomeworkStatusBadge.vue'
import Pagination from '@/components/ui/Pagination.vue'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import {
  attachmentsOf,
  deleteHomeworkApi,
  getTeacherHomeworksApi,
  type Homework,
} from '@/api/homeworks'
import { getMySubjectsApi } from '@/api/subjects'
import { useBackdropClose } from '@/composables/useBackdropClose'
import { useHomeworkPermissions } from '@/composables/useHomeworkPermissions'
import { useToast } from '@/composables/useToast'
import type { Subject } from '@/types/subject'

const { t, locale } = useI18n()
const { success } = useToast()
const {
  myTeacherId,
  canManage,
  canGrade,
  loadOfferings,
  classOptions: teacherClasses,
} = useHomeworkPermissions()

const homeworks = ref<Homework[]>([])
const total = ref(0)
const loading = ref(true)
const loadError = ref(false)

const subjects = ref<Subject[]>([])

const filters = ref({
  subject: null as number | string | null,
  classGroup: null as number | string | null,
  status: null as number | string | null,
  dueFrom: '',
  dueTo: '',
})
const currentPage = ref(1)
const pageSize = ref(50)

const gradingOpen = ref(false)
const gradingHomework = ref<Homework | null>(null)

function openGrading(homework: Homework) {
  gradingHomework.value = homework
  gradingOpen.value = true
}

const deleteTarget = ref<Homework | null>(null)
const deleting = ref(false)
const deleteBackdrop = useBackdropClose(() => {
  if (!deleting.value) deleteTarget.value = null
})

function askDelete(homework: Homework) {
  deleteTarget.value = homework
}

async function confirmDelete() {
  const target = deleteTarget.value
  if (!target) return

  deleting.value = true
  try {
    await deleteHomeworkApi(target.id)
    homeworks.value = homeworks.value.filter(homework => homework.id !== target.id)
    total.value = Math.max(0, total.value - 1)
    deleteTarget.value = null
    success(t('homeworks.deletedSuccess'))
    // Deleting the last row of a trailing page would strand the user on an empty
    // page, so step back — the `currentPage` watcher refetches.
    if (!homeworks.value.length && currentPage.value > 1) currentPage.value -= 1
  } catch {
    // The API client's interceptor surfaces the failure; keep the dialog open.
  } finally {
    deleting.value = false
  }
}

const subjectOptions = computed<SelectOption[]>(() =>
  subjects.value.map(subject => ({ value: subject.id, label: subject.name })),
)

/** A teacher filters within the classes they are assigned to. */
const classOptions = computed<SelectOption[]>(() =>
  teacherClasses.value.map(option => ({ value: option.classGroupId, label: option.displayName })),
)

const statusOptions = computed<SelectOption[]>(() => [
  { value: 'active', label: t('homeworks.statuses.active') },
  { value: 'pending', label: t('homeworks.statuses.pending') },
])

const pickerLocale = computed(() => (locale.value === 'kz' ? Kazakh : locale.value === 'ru' ? Russian : undefined))
const datePickerConfig = computed(() => ({
  dateFormat: 'Y-m-d',
  altInput: true,
  altFormat: 'd.m.Y',
  allowInput: false,
  disableMobile: true,
  locale: pickerLocale.value,
}))

const hasActiveFilters = computed(
  () =>
    Boolean(filters.value.subject)
    || Boolean(filters.value.classGroup)
    || Boolean(filters.value.status)
    || Boolean(filters.value.dueFrom)
    || Boolean(filters.value.dueTo),
)

async function fetchHomeworks() {
  // `profile_id` arrives with the user; until it does there is no id to scope by.
  const teacherId = myTeacherId.value
  if (!teacherId) {
    homeworks.value = []
    total.value = 0
    loading.value = false
    return
  }

  loading.value = true
  loadError.value = false

  try {
    // Authored by this teacher and nobody else — a teacher may only ever pass
    // their own profile id, and drafts are theirs to see, so `is_active` filters
    // the full set rather than a pre-trimmed one.
    const { data } = await getTeacherHomeworksApi(teacherId, {
      subject: filters.value.subject ? Number(filters.value.subject) : undefined,
      class_group: filters.value.classGroup ? Number(filters.value.classGroup) : undefined,
      is_active: filters.value.status ? filters.value.status === 'active' : undefined,
      due_from: filters.value.dueFrom || undefined,
      due_to: filters.value.dueTo || undefined,
      page: currentPage.value,
      page_size: pageSize.value,
    })
    homeworks.value = data.results
    total.value = data.count
  } catch {
    homeworks.value = []
    total.value = 0
    loadError.value = true
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.value = {
    subject: null,
    classGroup: null,
    status: null,
    dueFrom: '',
    dueTo: '',
  }
}

watch(
  () => [
    filters.value.subject,
    filters.value.classGroup,
    filters.value.status,
    filters.value.dueFrom,
    filters.value.dueTo,
    pageSize.value,
  ],
  () => {
    if (currentPage.value === 1) fetchHomeworks()
    else currentPage.value = 1
  },
)
watch(currentPage, fetchHomeworks)

// The route is teacher-only, but `profile_id` can land a tick after mount.
watch(myTeacherId, (id, previous) => {
  if (id && !previous) fetchHomeworks()
})

onMounted(() => {
  fetchHomeworks()
  loadFilterOptions()
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

function formatDate(value: string): string {
  if (!value) return '—'
  const localeTag = document.documentElement.lang || 'ru'
  return new Intl.DateTimeFormat(localeTag, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
}

function formatDateTime(value: string): string {
  if (!value) return '—'
  const localeTag = document.documentElement.lang || 'ru'
  return new Intl.DateTimeFormat(localeTag, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function isOverdue(homework: Homework): boolean {
  if (!homework.due_date) return false
  return homework.due_date.slice(0, 10) < new Date().toISOString().slice(0, 10)
}
</script>
