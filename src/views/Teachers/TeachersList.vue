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
        <!-- Position filter -->
        <div class="relative" ref="positionDropdownRef">
          <button
            @click="positionDropdownOpen = !positionDropdownOpen"
            class="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <Filter class="h-4 w-4 text-gray-400" />
            {{ selectedPosition ? selectedPosition : $t('teachers.allPositions') }}
            <ChevronDown class="h-4 w-4 text-gray-400" />
          </button>
          <div
            v-show="positionDropdownOpen"
            class="absolute left-0 z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
          >
            <button
              @click="selectedPosition = ''; positionDropdownOpen = false"
              class="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              :class="{ 'bg-brand-50 text-brand-500 dark:bg-brand-500/10': !selectedPosition }"
            >
              {{ $t('teachers.allPositions') }}
            </button>
            <button
              v-for="pos in positionOptions"
              :key="pos"
              @click="selectedPosition = pos; positionDropdownOpen = false"
              class="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              :class="{ 'bg-brand-50 text-brand-500 dark:bg-brand-500/10': selectedPosition === pos }"
            >
              {{ pos }}
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
                  {{ $t('teachers.fullName') }}
                </th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('teachers.position') }}
                </th>
                <th class="px-5 py-3.5 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ $t('teachers.class') }}
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
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      :class="avatarColorClasses(teacher.avatarColor)"
                    >
                      {{ teacher.initials }}
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ teacher.fullName }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ teacher.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ teacher.position }}</span>
                </td>
                <td class="px-5 py-4">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="cls in teacher.classes"
                      :key="cls"
                      class="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300"
                    >
                      {{ cls }}
                    </span>
                  </div>
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
                      class="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
                    >
                      <button
                        @click="editTeacher(teacher)"
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <Pencil class="h-3.5 w-3.5" />
                        {{ $t('common.edit') }}
                      </button>
                      <button
                        @click="deleteTeacher(teacher)"
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-error-600 hover:bg-gray-50 dark:text-error-400 dark:hover:bg-white/5"
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                        {{ $t('common.delete') }}
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
import {
  Search,
  Filter,
  ChevronDown,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import Pagination from '@/components/ui/Pagination.vue'

const { t } = useI18n()

interface Teacher {
  id: string
  fullName: string
  initials: string
  email: string
  position: string
  classes: string[]
  avatarColor: string
}

const teachers = ref<Teacher[]>([
  { id: '1', fullName: 'Назарова Айгүл Кенжеқызы', initials: 'НА', email: 'nazarova@qadam.edu.kz', position: 'Учитель математики', classes: ['5А', '5Б', '6А'], avatarColor: 'blue' },
  { id: '2', fullName: 'Сейтова Балнұр Маратқызы', initials: 'СБ', email: 'seitova@qadam.edu.kz', position: 'Учитель казахского языка', classes: ['5А', '5Б', '6А', '6Б'], avatarColor: 'green' },
  { id: '3', fullName: 'Иванова Наталья Петровна', initials: 'ИН', email: 'ivanova@qadam.edu.kz', position: 'Учитель русского языка', classes: ['5А', '5Б', '7А'], avatarColor: 'purple' },
  { id: '4', fullName: 'Ахметов Дархан Серікұлы', initials: 'АД', email: 'akhmetov@qadam.edu.kz', position: 'Учитель физики', classes: ['7А', '7Б', '8А'], avatarColor: 'red' },
  { id: '5', fullName: 'Жанбырова Камила Ерланқызы', initials: 'ЖК', email: 'zhanbyrova@qadam.edu.kz', position: 'Учитель химии', classes: ['8А', '8Б', '9А'], avatarColor: 'teal' },
  { id: '6', fullName: 'Тұрсынова Гүлнәр Асқарқызы', initials: 'ТГ', email: 'tursynova@qadam.edu.kz', position: 'Учитель биологии', classes: ['6А', '6Б', '7А'], avatarColor: 'emerald' },
  { id: '7', fullName: 'Қасымов Мұрат Тілеуұлы', initials: 'ҚМ', email: 'kassymov@qadam.edu.kz', position: 'Учитель истории', classes: ['5А', '5Б', '6А', '6Б', '7А'], avatarColor: 'amber' },
  { id: '8', fullName: 'Бекенова Сәуле Жанатқызы', initials: 'БС', email: 'bekenova@qadam.edu.kz', position: 'Учитель географии', classes: ['6А', '7А', '7Б'], avatarColor: 'cyan' },
  { id: '9', fullName: 'Ли Виктор Сергеевич', initials: 'ЛВ', email: 'li@qadam.edu.kz', position: 'Учитель информатики', classes: ['5А', '5Б', '6А', '8Б'], avatarColor: 'indigo' },
  { id: '10', fullName: 'Smith John Robert', initials: 'SJ', email: 'smith@qadam.edu.kz', position: 'English Teacher', classes: ['5А', '6А', '7А'], avatarColor: 'orange' },
  { id: '11', fullName: 'Омарова Дана Бауыржанқызы', initials: 'ОД', email: 'omarova@qadam.edu.kz', position: 'Учитель музыки', classes: ['1А', '2А', '2Б', '3А'], avatarColor: 'pink' },
  { id: '12', fullName: 'Серіков Ержан Нұрланұлы', initials: 'СЕ', email: 'serikov@qadam.edu.kz', position: 'Учитель физкультуры', classes: ['5А', '5Б', '6А', '6Б', '7А', '7Б'], avatarColor: 'rose' },
])

const searchQuery = ref('')
const selectedPosition = ref('')
const positionDropdownOpen = ref(false)
const openActionId = ref<string | null>(null)
const showAddModal = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

const positionOptions = computed(() => {
  const positions = new Set(teachers.value.map((t) => t.position))
  return Array.from(positions).sort()
})

const positionDropdownRef = ref<HTMLElement>()
const actionRefs: Record<string, HTMLElement | null> = {}

function setActionRef(el: any, id: string) {
  actionRefs[id] = el
}

const filteredTeachers = computed(() => {
  return teachers.value.filter((teacher) => {
    const matchesSearch =
      !searchQuery.value ||
      teacher.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesPosition = !selectedPosition.value || teacher.position === selectedPosition.value
    return matchesSearch && matchesPosition
  })
})

watch([searchQuery, selectedPosition, pageSize], () => {
  currentPage.value = 1
})

const paginatedTeachers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTeachers.value.slice(start, start + pageSize.value)
})

function toggleActions(id: string) {
  openActionId.value = openActionId.value === id ? null : id
}

function editTeacher(teacher: Teacher) {
  openActionId.value = null
}

function deleteTeacher(teacher: Teacher) {
  openActionId.value = null
  if (confirm(t('teachers.confirmDelete'))) {
    teachers.value = teachers.value.filter((t) => t.id !== teacher.id)
  }
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
  if (positionDropdownRef.value && !positionDropdownRef.value.contains(target)) {
    positionDropdownOpen.value = false
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
