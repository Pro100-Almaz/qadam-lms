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
        <!-- Academic year filter -->
        <div class="relative" ref="yearDropdownRef">
          <button
            @click="yearDropdownOpen = !yearDropdownOpen"
            class="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <CalendarDays class="h-4 w-4 text-gray-400" />
            {{ selectedYearLabel || $t('students.allYears') }}
            <ChevronDown class="h-4 w-4 text-gray-400" />
          </button>
          <div
            v-show="yearDropdownOpen"
            class="absolute left-0 z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
          >
            <button
              @click="selectedYearId = null; yearDropdownOpen = false"
              class="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              :class="{ 'bg-brand-50 text-brand-500 dark:bg-brand-500/10': !selectedYearId }"
            >
              {{ $t('students.allYears') }}
            </button>
            <button
              v-for="year in academicYears"
              :key="year.id"
              @click="selectedYearId = year.id; yearDropdownOpen = false"
              class="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              :class="{ 'bg-brand-50 text-brand-500 dark:bg-brand-500/10': selectedYearId === year.id }"
            >
              {{ year.year }}
              <span v-if="year.is_active" class="ml-auto text-xs text-success-600 dark:text-success-400">{{ $t('common.current') }}</span>
            </button>
          </div>
        </div>
        <!-- Class group filter -->
        <div class="relative" ref="classDropdownRef">
          <button
            @click="classDropdownOpen = !classDropdownOpen"
            class="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <Filter class="h-4 w-4 text-gray-400" />
            {{ selectedClassLabel || $t('students.allClasses') }}
            <ChevronDown class="h-4 w-4 text-gray-400" />
          </button>
          <div
            v-show="classDropdownOpen"
            class="absolute left-0 z-50 mt-1 max-h-60 w-44 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
          >
            <button
              @click="selectedClassGroupId = null; classDropdownOpen = false"
              class="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              :class="{ 'bg-brand-50 text-brand-500 dark:bg-brand-500/10': !selectedClassGroupId }"
            >
              {{ $t('students.allClasses') }}
            </button>
            <button
              v-for="cg in classGroups"
              :key="cg.id"
              @click="selectedClassGroupId = cg.id; classDropdownOpen = false"
              class="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              :class="{ 'bg-brand-50 text-brand-500 dark:bg-brand-500/10': selectedClassGroupId === cg.id }"
            >
              {{ cg.display_name }}
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
                  <div class="flex cursor-pointer items-center gap-3" @click="viewStudent(student)">
                    <div
                      v-if="student.user.avatar"
                      class="h-10 w-10 shrink-0 overflow-hidden rounded-full"
                    >
                      <img :src="student.user.avatar" :alt="fullName(student)" class="h-full w-full object-cover" />
                    </div>
                    <div
                      v-else
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      :class="avatarColorClass(student.user.id)"
                    >
                      {{ initials(student) }}
                    </div>
                    <div>
                      <p class="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">{{ fullName(student) }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ student.user.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <span
                    v-if="student.current_class_group"
                    class="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300"
                  >
                    {{ student.current_class_group.display_name }}
                  </span>
                  <span v-else class="text-sm text-gray-400">—</span>
                </td>
                <td class="px-5 py-4">
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {{ student.current_class_group?.academic_year?.year || '—' }}
                  </span>
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
                      class="absolute right-0 z-50 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
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
        v-if="!loading"
        :total="filteredStudents.length"
        v-model:currentPage="currentPage"
        v-model:pageSize="pageSize"
      />
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
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
import { getStudentsApi } from '@/api/students'
import { getAcademicYearsApi, getClassGroupsApi } from '@/api/academic'
import type { Student } from '@/types/student'
import type { AcademicYear, ClassGroup } from '@/types/academic'

const router = useRouter()

const students = ref<Student[]>([])
const academicYears = ref<AcademicYear[]>([])
const classGroups = ref<ClassGroup[]>([])
const loading = ref(false)

const searchQuery = ref('')
const selectedYearId = ref<number | null>(null)
const selectedClassGroupId = ref<number | null>(null)
const classDropdownOpen = ref(false)
const yearDropdownOpen = ref(false)
const openActionId = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)

const classDropdownRef = ref<HTMLElement>()
const yearDropdownRef = ref<HTMLElement>()
const actionRefs: Record<number, HTMLElement | null> = {}

function setActionRef(el: any, id: number) {
  actionRefs[id] = el
}

const selectedYearLabel = computed(() => {
  if (!selectedYearId.value) return ''
  return academicYears.value.find((y) => y.id === selectedYearId.value)?.year || ''
})

const selectedClassLabel = computed(() => {
  if (!selectedClassGroupId.value) return ''
  return classGroups.value.find((c) => c.id === selectedClassGroupId.value)?.display_name || ''
})

async function fetchFilters() {
  try {
    const [yearsRes, classesRes] = await Promise.all([
      getAcademicYearsApi(),
      getClassGroupsApi(),
    ])
    academicYears.value = yearsRes.data
    classGroups.value = classesRes.data

    const activeYear = academicYears.value.find((y) => y.is_active)
    if (activeYear) selectedYearId.value = activeYear.id
  } catch {
    // filters stay empty
  }
}

async function fetchStudents() {
  loading.value = true
  try {
    const params: Record<string, number> = {}
    if (selectedYearId.value) params.year = selectedYearId.value
    if (selectedClassGroupId.value) params.class_group = selectedClassGroupId.value
    const { data } = await getStudentsApi(params)
    students.value = data
  } catch {
    students.value = []
  } finally {
    loading.value = false
  }
}

function fullName(student: Student) {
  return `${student.user.last_name} ${student.user.first_name}`
}

function initials(student: Student) {
  const first = student.user.first_name?.[0] || ''
  const last = student.user.last_name?.[0] || ''
  return (last + first).toUpperCase()
}

const avatarColors = [
  'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
  'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
]

function avatarColorClass(userId: number) {
  return avatarColors[userId % avatarColors.length]
}

const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value
  const q = searchQuery.value.toLowerCase()
  return students.value.filter((s) => {
    const name = fullName(s).toLowerCase()
    const email = s.user.email.toLowerCase()
    return name.includes(q) || email.includes(q)
  })
})

watch([searchQuery, pageSize], () => {
  currentPage.value = 1
})

watch([selectedYearId, selectedClassGroupId], () => {
  currentPage.value = 1
  fetchStudents()
})

watch(selectedYearId, (yearId) => {
  selectedClassGroupId.value = null
  if (yearId) {
    getClassGroupsApi({ year: yearId }).then(({ data }) => {
      classGroups.value = data
    }).catch(() => { /* keep existing */ })
  }
})

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredStudents.value.slice(start, start + pageSize.value)
})

function toggleActions(id: number) {
  openActionId.value = openActionId.value === id ? null : id
}

function viewStudent(student: Student) {
  openActionId.value = null
  router.push(`/students/${student.user.id}`)
}

function editStudent(student: Student) {
  openActionId.value = null
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

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  await fetchFilters()
  await fetchStudents()
})
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>
