<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {{ $t('students.title') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ $t('common.total') }}: {{ filteredStudents.length }}
        </p>
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
        <!-- Class filter -->
        <div class="relative" ref="classDropdownRef">
          <button
            @click="classDropdownOpen = !classDropdownOpen"
            class="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <Filter class="h-4 w-4 text-gray-400" />
            {{ selectedClass || $t('students.allClasses') }}
            <ChevronDown class="h-4 w-4 text-gray-400" />
          </button>
          <div
            v-show="classDropdownOpen"
            class="absolute left-0 z-20 mt-1 max-h-60 w-44 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
          >
            <button
              @click="selectedClass = ''; classDropdownOpen = false"
              class="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              :class="{ 'bg-brand-50 text-brand-500 dark:bg-brand-500/10': !selectedClass }"
            >
              {{ $t('students.allClasses') }}
            </button>
            <button
              v-for="cls in classOptions"
              :key="cls"
              @click="selectedClass = cls; classDropdownOpen = false"
              class="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              :class="{ 'bg-brand-50 text-brand-500 dark:bg-brand-500/10': selectedClass === cls }"
            >
              {{ cls }}
            </button>
          </div>
        </div>
        <!-- Year filter -->
        <div class="relative" ref="yearDropdownRef">
          <button
            @click="yearDropdownOpen = !yearDropdownOpen"
            class="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <CalendarDays class="h-4 w-4 text-gray-400" />
            {{ selectedYear || $t('students.allYears') }}
            <ChevronDown class="h-4 w-4 text-gray-400" />
          </button>
          <div
            v-show="yearDropdownOpen"
            class="absolute left-0 z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
          >
            <button
              @click="selectedYear = ''; yearDropdownOpen = false"
              class="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              :class="{ 'bg-brand-50 text-brand-500 dark:bg-brand-500/10': !selectedYear }"
            >
              {{ $t('students.allYears') }}
            </button>
            <button
              v-for="year in yearOptions"
              :key="year"
              @click="selectedYear = year; yearDropdownOpen = false"
              class="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              :class="{ 'bg-brand-50 text-brand-500 dark:bg-brand-500/10': selectedYear === year }"
            >
              {{ year }}
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
                  {{ $t('students.fullName') }}
                </th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('students.class') }}
                </th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('students.yearOfEducation') }}
                </th>
                <th class="px-5 py-3.5 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('common.actions') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="student in paginatedStudents"
                :key="student.id"
                class="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      :class="avatarColorClasses(student.avatarColor)"
                    >
                      {{ student.initials }}
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ student.fullName }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ student.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <span
                    class="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300"
                  >
                    {{ student.className }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ student.yearOfEducation }}</span>
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="relative inline-block" :ref="el => setActionRef(el, student.id)">
                    <button
                      @click="toggleActions(student.id)"
                      class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                    >
                      <MoreVertical class="h-4 w-4" />
                    </button>
                    <div
                      v-show="openActionId === student.id"
                      class="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
                    >
                      <button
                        @click="viewStudent(student)"
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <Eye class="h-3.5 w-3.5" />
                        {{ $t('common.view') }}
                      </button>
                      <button
                        @click="editStudent(student)"
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <Pencil class="h-3.5 w-3.5" />
                        {{ $t('common.edit') }}
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredStudents.length === 0">
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
        :total="filteredStudents.length"
        v-model:currentPage="currentPage"
        v-model:pageSize="pageSize"
      />
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Search,
  Filter,
  ChevronDown,
  CalendarDays,
  MoreVertical,
  Eye,
  Pencil,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import Pagination from '@/components/ui/Pagination.vue'

interface Student {
  id: string
  fullName: string
  initials: string
  email: string
  className: string
  yearOfEducation: string
  avatarColor: string
}

const students = ref<Student[]>([
  { id: '1', fullName: 'Алтынбек Арман Ерланұлы', initials: 'АА', email: 'altynbek@qadam.edu.kz', className: '5А', yearOfEducation: '2024-2025', avatarColor: 'blue' },
  { id: '2', fullName: 'Бекболатова Аяна Серікқызы', initials: 'БА', email: 'bekbolatova@qadam.edu.kz', className: '5А', yearOfEducation: '2024-2025', avatarColor: 'pink' },
  { id: '3', fullName: 'Ғалымжанов Тимур Бауыржанұлы', initials: 'ҒТ', email: 'galymzhanov@qadam.edu.kz', className: '5Б', yearOfEducation: '2024-2025', avatarColor: 'green' },
  { id: '4', fullName: 'Досымова Камила Нұрланқызы', initials: 'ДК', email: 'dossymova@qadam.edu.kz', className: '6А', yearOfEducation: '2024-2025', avatarColor: 'purple' },
  { id: '5', fullName: 'Ерболатов Дамир Асқарұлы', initials: 'ЕД', email: 'erbolatov@qadam.edu.kz', className: '6А', yearOfEducation: '2024-2025', avatarColor: 'orange' },
  { id: '6', fullName: 'Жұмабекова Інжу Мұратқызы', initials: 'ЖІ', email: 'zhumabekova@qadam.edu.kz', className: '6Б', yearOfEducation: '2024-2025', avatarColor: 'teal' },
  { id: '7', fullName: 'Қасенов Алдияр Ерікұлы', initials: 'ҚА', email: 'kassenov@qadam.edu.kz', className: '7А', yearOfEducation: '2024-2025', avatarColor: 'red' },
  { id: '8', fullName: 'Мұратова Дарина Қайратқызы', initials: 'МД', email: 'muratova@qadam.edu.kz', className: '7А', yearOfEducation: '2024-2025', avatarColor: 'amber' },
  { id: '9', fullName: 'Нұрланов Ерасыл Бекзатұлы', initials: 'НЕ', email: 'nurlanov@qadam.edu.kz', className: '7Б', yearOfEducation: '2024-2025', avatarColor: 'cyan' },
  { id: '10', fullName: 'Оразбекова Сабина Дәуренқызы', initials: 'ОС', email: 'orazbekova@qadam.edu.kz', className: '8А', yearOfEducation: '2024-2025', avatarColor: 'indigo' },
  { id: '11', fullName: 'Петрова Анна Дмитриевна', initials: 'ПА', email: 'petrova@qadam.edu.kz', className: '8А', yearOfEducation: '2024-2025', avatarColor: 'rose' },
  { id: '12', fullName: 'Сатыбалдиев Нұрсұлтан Маратұлы', initials: 'СН', email: 'satybaldiev@qadam.edu.kz', className: '8Б', yearOfEducation: '2024-2025', avatarColor: 'emerald' },
  { id: '13', fullName: 'Тасболатова Жансая Ержанқызы', initials: 'ТЖ', email: 'tasbolatova@qadam.edu.kz', className: '5Б', yearOfEducation: '2023-2024', avatarColor: 'blue' },
  { id: '14', fullName: 'Уалиханов Асан Талғатұлы', initials: 'УА', email: 'ualihanov@qadam.edu.kz', className: '9А', yearOfEducation: '2023-2024', avatarColor: 'green' },
  { id: '15', fullName: 'Хасенова Мадина Бақытқызы', initials: 'ХМ', email: 'khasenova@qadam.edu.kz', className: '9А', yearOfEducation: '2023-2024', avatarColor: 'purple' },
])

const searchQuery = ref('')
const selectedClass = ref('')
const selectedYear = ref('')
const classDropdownOpen = ref(false)
const yearDropdownOpen = ref(false)
const openActionId = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)

const classOptions = computed(() => {
  const classes = new Set(students.value.map((s) => s.className))
  return Array.from(classes).sort()
})

const yearOptions = computed(() => {
  const years = new Set(students.value.map((s) => s.yearOfEducation))
  return Array.from(years).sort().reverse()
})

const classDropdownRef = ref<HTMLElement>()
const yearDropdownRef = ref<HTMLElement>()
const actionRefs: Record<string, HTMLElement | null> = {}

function setActionRef(el: any, id: string) {
  actionRefs[id] = el
}

const filteredStudents = computed(() => {
  return students.value.filter((s) => {
    const matchesSearch =
      !searchQuery.value ||
      s.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesClass = !selectedClass.value || s.className === selectedClass.value
    const matchesYear = !selectedYear.value || s.yearOfEducation === selectedYear.value
    return matchesSearch && matchesClass && matchesYear
  })
})

watch([searchQuery, selectedClass, selectedYear, pageSize], () => {
  currentPage.value = 1
})

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredStudents.value.slice(start, start + pageSize.value)
})

function toggleActions(id: string) {
  openActionId.value = openActionId.value === id ? null : id
}

function viewStudent(student: Student) {
  openActionId.value = null
}

function editStudent(student: Student) {
  openActionId.value = null
}

function avatarColorClasses(color: string): string {
  const map: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
    teal: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
    pink: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  }
  return map[color] || map.blue
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (classDropdownRef.value && !classDropdownRef.value.contains(target)) {
    classDropdownOpen.value = false
  }
  if (yearDropdownRef.value && !yearDropdownRef.value.contains(target)) {
    yearDropdownOpen.value = false
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
