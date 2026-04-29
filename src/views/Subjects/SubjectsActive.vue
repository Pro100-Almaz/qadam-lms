<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {{ $t('subjects.active') }}
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ $t('common.total') }}: {{ filteredSubjects.length }}
          </p>
        </div>
        <button
          @click="showAddModal = true"
          class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition"
        >
          <Plus class="h-4 w-4" />
          {{ $t('subjects.addNew') }}
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3">
        <!-- Search -->
        <div class="relative w-full sm:w-64">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('common.search') + '...'"
            class="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
        </div>
        <!-- Language filter -->
        <div class="relative" ref="langDropdownRef">
          <button
            @click="langDropdownOpen = !langDropdownOpen"
            class="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <Globe class="h-4 w-4 text-gray-400" />
            {{ selectedLanguage ? $t('subjects.languages.' + selectedLanguage) : $t('subjects.allLanguages') }}
            <ChevronDown class="h-4 w-4 text-gray-400" />
          </button>
          <div
            v-show="langDropdownOpen"
            class="absolute left-0 z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
          >
            <button
              @click="selectedLanguage = ''; langDropdownOpen = false"
              class="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              :class="{ 'bg-brand-50 text-brand-500 dark:bg-brand-500/10': !selectedLanguage }"
            >
              {{ $t('subjects.allLanguages') }}
            </button>
            <button
              v-for="lang in languageOptions"
              :key="lang"
              @click="selectedLanguage = lang; langDropdownOpen = false"
              class="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              :class="{ 'bg-brand-50 text-brand-500 dark:bg-brand-500/10': selectedLanguage === lang }"
            >
              {{ $t('subjects.languages.' + lang) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        {{ $t('common.loading') }}
      </div>

      <!-- Table -->
      <div v-else class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div class="overflow-x-visible">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('subjects.name') }}
                </th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('subjects.language') }}
                </th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('subjects.status') }}
                </th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('subjects.addedBy') }}
                </th>
                <th class="px-5 py-3.5 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('common.actions') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="subject in paginatedSubjects"
                :key="subject.id"
                class="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                <td class="px-5 py-4">
                  <p class="cursor-pointer text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300" @click="viewSubject(subject)">{{ subject.name }}</p>
                </td>
                <td class="px-5 py-4">
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {{ $t('subjects.languages.' + subject.language_group) }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <span
                    class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                  >
                    {{ $t('subjects.statusActive') }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {{ subject.added_by.first_name }} {{ subject.added_by.last_name }}
                  </span>
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="relative inline-block" :ref="el => setActionRef(el, subject.id)">
                    <button
                      @click="toggleActions(subject.id)"
                      class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                    >
                      <MoreVertical class="h-4 w-4" />
                    </button>
                    <div
                      v-show="openActionId === subject.id"
                      class="absolute right-0 z-50 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
                    >
                      <button
                        @click="viewSubject(subject)"
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <Eye class="h-3.5 w-3.5" />
                        {{ $t('common.view') }}
                      </button>
                      <button
                        @click="editSubject(subject)"
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <Pencil class="h-3.5 w-3.5" />
                        {{ $t('common.edit') }}
                      </button>
                      <button
                        @click="archiveSubject(subject)"
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-warning-600 hover:bg-gray-50 dark:text-warning-400 dark:hover:bg-white/5"
                      >
                        <Archive class="h-3.5 w-3.5" />
                        {{ $t('subjects.archive') }}
                      </button>
                      <button
                        @click="deleteSubject(subject)"
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-error-600 hover:bg-gray-50 dark:text-error-400 dark:hover:bg-white/5"
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                        {{ $t('common.delete') }}
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredSubjects.length === 0">
                <td colspan="5" class="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  {{ $t('common.noData') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="!loading"
        :total="filteredSubjects.length"
        v-model:currentPage="currentPage"
        v-model:pageSize="pageSize"
      />

      <!-- Add Subject Modal -->
      <Teleport to="body">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showAddModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            @click.self="showAddModal = false"
          >
            <div class="mx-4 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {{ $t('subjects.createTitle') }}
                </h3>
                <button @click="showAddModal = false" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
                  <X class="h-5 w-5" />
                </button>
              </div>
              <form @submit.prevent="handleCreateSubject" class="mt-4 space-y-4">
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('subjects.name') }}</label>
                  <input
                    v-model="createForm.name"
                    type="text"
                    required
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('subjects.language') }}</label>
                  <select
                    v-model="createForm.language_group"
                    required
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    <option value="kaz">{{ $t('subjects.languages.kazakh') }}</option>
                    <option value="rus">{{ $t('subjects.languages.russian') }}</option>
                    <option value="eng">{{ $t('subjects.languages.english') }}</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('subjects.status') }}</label>
                  <select
                    v-model="createForm.status"
                    required
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    <option value="active">{{ $t('subjects.statusActive') }}</option>
                    <option value="planned">{{ $t('subjects.statusPlanned') }}</option>
                    <option value="disabled">{{ $t('subjects.statusDisabled') }}</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('academicYears.title') }}</label>
                  <select
                    v-model="createForm.academic_year"
                    required
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    <option :value="null" disabled>{{ $t('common.selectOption') }}</option>
                    <option v-for="year in academicYears" :key="year.id" :value="year.id">
                      {{ year.year }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('subjects.classes') }}</label>
                  <div class="max-h-40 overflow-y-auto rounded-lg border border-gray-300 p-2 dark:border-gray-700">
                    <label
                      v-for="group in classGroups"
                      :key="group.id"
                      class="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        :value="group.id"
                        v-model="createForm.class_groups"
                        class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                      />
                      {{ group.display_name }}
                    </label>
                    <p v-if="!classGroups.length" class="text-xs text-gray-400 dark:text-gray-500 py-2 text-center">
                      {{ $t('common.noData') }}
                    </p>
                  </div>
                </div>
                <div class="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    @click="showAddModal = false"
                    class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    {{ $t('common.cancel') }}
                  </button>
                  <button
                    type="submit"
                    :disabled="savingSubject"
                    class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition"
                  >
                    {{ $t('common.save') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  Globe,
  ChevronDown,
  MoreVertical,
  Pencil,
  Archive,
  Trash2,
  Eye,
  X,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { getSubjectsApi, changeSubjectStatusApi, deleteSubjectApi, createSubjectApi } from '@/api/subjects'
import { getAcademicYearsApi, getClassGroupsApi } from '@/api/academic'
import type { Subject, LanguageGroup, SubjectStatus } from '@/types/subject'
import type { AcademicYear, ClassGroup } from '@/types/academic'

const { t } = useI18n()
const router = useRouter()

const subjects = ref<Subject[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedLanguage = ref('')
const langDropdownOpen = ref(false)
const openActionId = ref<number | null>(null)
const showAddModal = ref(false)
const savingSubject = ref(false)
const academicYears = ref<AcademicYear[]>([])
const classGroups = ref<ClassGroup[]>([])
const createForm = ref({
  name: '',
  language_group: 'kaz' as LanguageGroup,
  status: 'active' as SubjectStatus,
  academic_year: null as number | null,
  class_groups: [] as number[],
})
const currentPage = ref(1)
const pageSize = ref(10)

const languageOptions = ['kaz', 'rus', 'eng']

const langDropdownRef = ref<HTMLElement>()
const actionRefs: Record<number, HTMLElement | null> = {}

function setActionRef(el: any, id: number) {
  actionRefs[id] = el
}

async function fetchSubjects() {
  loading.value = true
  try {
    const params: Record<string, string> = { status: 'active' }
    if (selectedLanguage.value) params.lang = selectedLanguage.value
    const { data } = await getSubjectsApi(params)
    subjects.value = data
  } catch {
    subjects.value = []
  } finally {
    loading.value = false
  }
}

const filteredSubjects = computed(() => {
  if (!searchQuery.value) return subjects.value
  const q = searchQuery.value.toLowerCase()
  return subjects.value.filter((s) => s.name.toLowerCase().includes(q))
})

watch([searchQuery, pageSize], () => {
  currentPage.value = 1
})

watch(selectedLanguage, () => {
  currentPage.value = 1
  fetchSubjects()
})

const paginatedSubjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredSubjects.value.slice(start, start + pageSize.value)
})

function toggleActions(id: number) {
  openActionId.value = openActionId.value === id ? null : id
}

function viewSubject(subject: Subject) {
  openActionId.value = null
  router.push(`/subjects/${subject.id}`)
}

function editSubject(subject: Subject) {
  openActionId.value = null
}

async function archiveSubject(subject: Subject) {
  openActionId.value = null
  if (confirm(t('subjects.confirmArchive'))) {
    try {
      await changeSubjectStatusApi(subject.id, 'archive')
      subjects.value = subjects.value.filter((s) => s.id !== subject.id)
    } catch {
      // error handled by interceptor
    }
  }
}

async function deleteSubject(subject: Subject) {
  openActionId.value = null
  if (confirm(t('subjects.confirmDelete'))) {
    try {
      await deleteSubjectApi(subject.id)
      subjects.value = subjects.value.filter((s) => s.id !== subject.id)
    } catch {
      // error handled by interceptor
    }
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (langDropdownRef.value && !langDropdownRef.value.contains(target)) {
    langDropdownOpen.value = false
  }
  if (openActionId.value) {
    const ref = actionRefs[openActionId.value]
    if (ref && !ref.contains(target)) {
      openActionId.value = null
    }
  }
}

async function fetchFormData() {
  try {
    const [yearsRes, groupsRes] = await Promise.all([getAcademicYearsApi(), getClassGroupsApi()])
    academicYears.value = yearsRes.data
    classGroups.value = groupsRes.data
    const activeYear = academicYears.value.find(y => y.is_active)
    if (activeYear) createForm.value.academic_year = activeYear.id
  } catch {
    // silent
  }
}

async function handleCreateSubject() {
  if (!createForm.value.name || !createForm.value.academic_year) return
  savingSubject.value = true
  try {
    await createSubjectApi({
      name: createForm.value.name,
      language_group: createForm.value.language_group,
      status: createForm.value.status,
      academic_year: createForm.value.academic_year,
      class_groups: createForm.value.class_groups,
    })
    showAddModal.value = false
    createForm.value = { name: '', language_group: 'kaz', status: 'active', academic_year: academicYears.value.find(y => y.is_active)?.id ?? null, class_groups: [] }
    await fetchSubjects()
  } catch {
    // error handled by interceptor
  } finally {
    savingSubject.value = false
  }
}

watch(showAddModal, (val) => {
  if (val && !academicYears.value.length) fetchFormData()
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  fetchSubjects()
})
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>
