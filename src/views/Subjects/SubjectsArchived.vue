<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {{ $t('subjects.archived') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ $t('common.total') }}: {{ filteredSubjects.length }}
        </p>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3">
        <div class="relative w-full sm:w-64">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('common.search') + '...'"
            class="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
        </div>
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
                      class="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
                    >
                      <button
                        @click="viewSubject(subject)"
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <Eye class="h-3.5 w-3.5" />
                        {{ $t('common.view') }}
                      </button>
                      <button
                        @click="restoreSubject(subject)"
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-success-600 hover:bg-gray-50 dark:text-success-400 dark:hover:bg-white/5"
                      >
                        <ArchiveRestore class="h-3.5 w-3.5" />
                        {{ $t('subjects.restore') }}
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
                <td colspan="4" class="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
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
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  Search,
  Globe,
  ChevronDown,
  MoreVertical,
  ArchiveRestore,
  Trash2,
  Eye,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { getSubjectsApi, changeSubjectStatusApi, deleteSubjectApi } from '@/api/subjects'
import type { Subject } from '@/types/subject'

const { t } = useI18n()
const router = useRouter()

const subjects = ref<Subject[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedLanguage = ref('')
const langDropdownOpen = ref(false)
const openActionId = ref<number | null>(null)
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
    const params: Record<string, string> = { status: 'archived' }
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

async function restoreSubject(subject: Subject) {
  openActionId.value = null
  if (confirm(t('subjects.confirmRestore'))) {
    try {
      await changeSubjectStatusApi(subject.id, 'activate')
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

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  fetchSubjects()
})
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>
