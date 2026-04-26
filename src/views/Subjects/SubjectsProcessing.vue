<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {{ $t('subjects.processing') }}
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
            class="absolute left-0 z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
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

      <!-- Table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('subjects.name') }}
                </th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('subjects.description') }}
                </th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('subjects.language') }}
                </th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('subjects.classes') }}
                </th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('subjects.studentsCount') }}
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
                  <div>
                    <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ subject.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ subject.code }}</p>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ subject.description }}</span>
                </td>
                <td class="px-5 py-4">
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {{ $t('subjects.languages.' + subject.language) }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="cls in subject.classes"
                      :key="cls"
                      class="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300"
                    >
                      {{ cls }}
                    </span>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ subject.studentsCount }}</span>
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
                      class="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
                    >
                      <button
                        @click="editSubject(subject)"
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <Pencil class="h-3.5 w-3.5" />
                        {{ $t('common.edit') }}
                      </button>
                      <button
                        @click="activateSubject(subject)"
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-success-600 hover:bg-gray-50 dark:text-success-400 dark:hover:bg-white/5"
                      >
                        <CheckCircle class="h-3.5 w-3.5" />
                        {{ $t('subjects.makeActive') }}
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
                <td colspan="6" class="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  {{ $t('common.noData') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <Pagination
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
import {
  Plus,
  Search,
  Globe,
  ChevronDown,
  MoreVertical,
  Pencil,
  CheckCircle,
  Trash2,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import Pagination from '@/components/ui/Pagination.vue'

const { t } = useI18n()

interface Subject {
  id: string
  name: string
  code: string
  description: string
  language: 'kazakh' | 'russian' | 'english'
  classes: string[]
  studentsCount: number
}

const subjects = ref<Subject[]>([
  { id: '1', name: 'Дүниетану', code: 'WORLD-101', description: 'Қоршаған ортаны танып білу пәні', language: 'kazakh', classes: ['3А', '3Б'], studentsCount: 52 },
  { id: '2', name: 'Музыка', code: 'MUS-101', description: 'Музыкалық білім беру', language: 'kazakh', classes: ['1А', '2А', '2Б'], studentsCount: 75 },
  { id: '3', name: 'Технология', code: 'TECH-101', description: 'Практикалық еңбек дағдылары', language: 'russian', classes: ['5А', '5Б'], studentsCount: 48 },
  { id: '4', name: 'Физическая культура', code: 'PE-101', description: 'Физическое развитие и здоровье', language: 'russian', classes: ['6А', '6Б', '7А'], studentsCount: 81 },
  { id: '5', name: 'Art & Design', code: 'ART-101', description: 'Creative expression and visual arts', language: 'english', classes: ['4А', '4Б'], studentsCount: 44 },
])

const searchQuery = ref('')
const selectedLanguage = ref('')
const langDropdownOpen = ref(false)
const openActionId = ref<string | null>(null)
const showAddModal = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

const languageOptions = ['kazakh', 'russian', 'english']

const langDropdownRef = ref<HTMLElement>()
const actionRefs: Record<string, HTMLElement | null> = {}

function setActionRef(el: any, id: string) {
  actionRefs[id] = el
}

const filteredSubjects = computed(() => {
  return subjects.value.filter((s) => {
    const matchesSearch =
      !searchQuery.value ||
      s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesLang = !selectedLanguage.value || s.language === selectedLanguage.value
    return matchesSearch && matchesLang
  })
})

watch([searchQuery, selectedLanguage, pageSize], () => {
  currentPage.value = 1
})

const paginatedSubjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredSubjects.value.slice(start, start + pageSize.value)
})

function toggleActions(id: string) {
  openActionId.value = openActionId.value === id ? null : id
}

function editSubject(subject: Subject) {
  openActionId.value = null
}

function activateSubject(subject: Subject) {
  openActionId.value = null
  if (confirm(t('subjects.confirmActivate'))) {
    subjects.value = subjects.value.filter((s) => s.id !== subject.id)
  }
}

function deleteSubject(subject: Subject) {
  openActionId.value = null
  if (confirm(t('subjects.confirmDelete'))) {
    subjects.value = subjects.value.filter((s) => s.id !== subject.id)
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

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>
