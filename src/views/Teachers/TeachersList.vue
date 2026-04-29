<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {{ $t('teachers.title') }}
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ $t('common.total') }}: {{ filteredTeachers.length }}
          </p>
        </div>
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
        <!-- Occupation filter -->
        <div class="relative" ref="occupationDropdownRef">
          <button
            @click="occupationDropdownOpen = !occupationDropdownOpen"
            class="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <Filter class="h-4 w-4 text-gray-400" />
            {{ selectedOccupation || $t('teachers.allPositions') }}
            <ChevronDown class="h-4 w-4 text-gray-400" />
          </button>
          <div
            v-show="occupationDropdownOpen"
            class="absolute left-0 z-50 mt-1 w-56 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
          >
            <button
              @click="selectedOccupation = ''; occupationDropdownOpen = false"
              class="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              :class="{ 'bg-brand-50 text-brand-500 dark:bg-brand-500/10': !selectedOccupation }"
            >
              {{ $t('teachers.allPositions') }}
            </button>
            <button
              v-for="occ in occupationOptions"
              :key="occ"
              @click="selectedOccupation = occ; occupationDropdownOpen = false"
              class="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              :class="{ 'bg-brand-50 text-brand-500 dark:bg-brand-500/10': selectedOccupation === occ }"
            >
              {{ occ }}
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
                  {{ $t('teachers.fullName') }}
                </th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('teachers.position') }}
                </th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('teachers.phone') }}
                </th>
                <th class="px-5 py-3.5 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('common.actions') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="teacher in paginatedTeachers"
                :key="teacher.id"
                class="border-b border-gray-100 last:border-0 dark:border-gray-800"
              >
                <td class="px-5 py-4">
                  <div class="flex cursor-pointer items-center gap-3" @click="viewTeacher(teacher)">
                    <div
                      v-if="teacher.user.avatar"
                      class="h-10 w-10 shrink-0 overflow-hidden rounded-full"
                    >
                      <img :src="teacher.user.avatar" :alt="fullName(teacher)" class="h-full w-full object-cover" />
                    </div>
                    <div
                      v-else
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      :class="avatarColorClass(teacher.user.id)"
                    >
                      {{ initials(teacher) }}
                    </div>
                    <div>
                      <p class="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">{{ fullName(teacher) }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ teacher.user.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ teacher.occupation }}</span>
                </td>
                <td class="px-5 py-4">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ teacher.user.phone_number || '—' }}</span>
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="relative inline-block" :ref="el => setActionRef(el, teacher.id)">
                    <button
                      @click="toggleActions(teacher.id)"
                      class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                    >
                      <MoreVertical class="h-4 w-4" />
                    </button>
                    <div
                      v-show="openActionId === teacher.id"
                      class="absolute right-0 z-50 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
                    >
                      <button
                        @click="viewTeacher(teacher)"
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <Eye class="h-3.5 w-3.5" />
                        {{ $t('common.view') }}
                      </button>
                      <button
                        @click="editTeacher(teacher)"
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <Pencil class="h-3.5 w-3.5" />
                        {{ $t('common.edit') }}
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredTeachers.length === 0">
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
        :total="filteredTeachers.length"
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
  Filter,
  ChevronDown,
  MoreVertical,
  Eye,
  Pencil,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { getTeachersApi } from '@/api/teachers'
import type { Teacher } from '@/types/teacher'

const { t } = useI18n()
const router = useRouter()

const teachers = ref<Teacher[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedOccupation = ref('')
const occupationDropdownOpen = ref(false)
const openActionId = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)

const occupationDropdownRef = ref<HTMLElement>()
const actionRefs: Record<number, HTMLElement | null> = {}

function setActionRef(el: any, id: number) {
  actionRefs[id] = el
}

const occupationOptions = computed(() => {
  const occupations = new Set(teachers.value.map((t) => t.occupation).filter(Boolean))
  return Array.from(occupations).sort()
})

async function fetchTeachers() {
  loading.value = true
  try {
    const { data } = await getTeachersApi()
    teachers.value = data
  } catch {
    teachers.value = []
  } finally {
    loading.value = false
  }
}

function fullName(teacher: Teacher) {
  return `${teacher.user.last_name} ${teacher.user.first_name}`
}

function initials(teacher: Teacher) {
  const first = teacher.user.first_name?.[0] || ''
  const last = teacher.user.last_name?.[0] || ''
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

const filteredTeachers = computed(() => {
  return teachers.value.filter((teacher) => {
    const name = fullName(teacher).toLowerCase()
    const email = teacher.user.email.toLowerCase()
    const matchesSearch =
      !searchQuery.value ||
      name.includes(searchQuery.value.toLowerCase()) ||
      email.includes(searchQuery.value.toLowerCase())
    const matchesOccupation = !selectedOccupation.value || teacher.occupation === selectedOccupation.value
    return matchesSearch && matchesOccupation
  })
})

watch([searchQuery, selectedOccupation, pageSize], () => {
  currentPage.value = 1
})

const paginatedTeachers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTeachers.value.slice(start, start + pageSize.value)
})

function toggleActions(id: number) {
  openActionId.value = openActionId.value === id ? null : id
}

function viewTeacher(teacher: Teacher) {
  openActionId.value = null
  router.push(`/teachers/${teacher.user.id}`)
}

function editTeacher(teacher: Teacher) {
  openActionId.value = null
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (occupationDropdownRef.value && !occupationDropdownRef.value.contains(target)) {
    occupationDropdownOpen.value = false
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
  fetchTeachers()
})
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>
