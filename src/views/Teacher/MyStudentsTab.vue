<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="flex flex-col items-center gap-3">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Class Selection (no class selected yet) -->
    <template v-else-if="!selectedClass">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="cls in classes"
          :key="cls.class_group_id"
          @click="selectClass(cls)"
          class="group relative rounded-xl border border-gray-200 bg-white px-5 py-5 text-left shadow-theme-xs transition-all hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-600"
        >
          <!-- Homeroom badge -->
          <span
            v-if="cls.is_homeroom"
            class="absolute right-3 top-3 inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
          >
            {{ t('teacherDashboard.homeroom') }}
          </span>

          <!-- Class name -->
          <h3 class="text-2xl font-bold text-gray-800 group-hover:text-brand-600 dark:text-white/90 dark:group-hover:text-brand-400 transition-colors">
            {{ cls.display_name }}
          </h3>

          <!-- Student count -->
          <div class="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Users class="h-4 w-4" />
            <span>{{ cls.student_count }} {{ t('teacherDashboard.studentsCount') }}</span>
          </div>

          <!-- Subject chips -->
          <div class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="subj in cls.subjects"
              :key="subj.offering_id"
              class="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
            >
              {{ subj.subject_name }}
            </span>
          </div>
        </button>
      </div>

      <div v-if="classes.length === 0" class="flex flex-col items-center justify-center py-16 gap-3">
        <Users class="h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('teacherDashboard.noClasses') }}</p>
      </div>
    </template>

    <!-- Students Table (class selected) -->
    <template v-else>
      <!-- Back to classes + class header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <button
            @click="goBack"
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft class="h-4 w-4" />
          </button>
          <div>
            <h2 class="text-lg font-bold text-gray-800 dark:text-white/90">{{ studentsData?.class_group }}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ studentsData?.student_count }} {{ t('teacherDashboard.studentsCount') }} · {{ studentsData?.subject_count }} {{ t('teacherDashboard.subjectsCount') }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- All subjects toggle (for homeroom teachers) -->
          <label v-if="selectedClass.is_homeroom" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              v-model="showAllSubjects"
              class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
            />
            {{ t('teacherDashboard.allSubjects') }}
          </label>
          <!-- Search -->
          <div class="relative max-w-xs">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              v-model="search"
              type="text"
              :placeholder="t('common.search')"
              class="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            />
          </div>
        </div>
      </div>

      <!-- Loading students -->
      <div v-if="loadingStudents" class="flex items-center justify-center py-16">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>

      <!-- Students table -->
      <div v-else-if="studentsData" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th
                  class="sticky left-0 z-10 bg-white px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  @click="toggleSort('name')"
                >
                  <div class="flex items-center gap-1">
                    {{ t('common.name') }}
                    <ArrowUpDown class="h-3 w-3" />
                  </div>
                </th>
                <th
                  v-for="subj in subjectColumns"
                  :key="subj"
                  class="px-4 py-3.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap"
                >
                  {{ subj }}
                </th>
                <th
                  class="px-4 py-3.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  @click="toggleSort('overall')"
                >
                  <div class="flex items-center justify-center gap-1">
                    {{ t('teacherDashboard.overall') }}
                    <ArrowUpDown class="h-3 w-3" />
                  </div>
                </th>
                <th class="px-4 py-3.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {{ t('teacherDashboard.psychState') }}
                </th>
                <th class="px-4 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {{ t('common.actions') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="student in filteredStudents"
                :key="student.student_id"
                class="border-b border-gray-100 last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td class="sticky left-0 z-10 bg-white px-5 py-3 dark:bg-gray-900">
                  <div class="flex items-center gap-3">
                    <div class="shrink-0">
                      <img
                        v-if="student.avatar"
                        :src="student.avatar"
                        :alt="student.full_name"
                        class="h-8 w-8 rounded-full object-cover"
                      />
                      <div
                        v-else
                        class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                      >
                        {{ initials(student.full_name) }}
                      </div>
                    </div>
                    <p class="text-sm font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">{{ student.full_name }}</p>
                  </div>
                </td>
                <td
                  v-for="subj in subjectColumns"
                  :key="subj"
                  class="px-4 py-3 text-center"
                >
                  <template v-if="getSubjectGrade(student, subj)">
                    <span
                      class="inline-flex min-w-[28px] items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold"
                      :class="letterGradeClass(getSubjectGrade(student, subj)!.letter_grade)"
                    >
                      {{ getSubjectGrade(student, subj)!.letter_grade || '—' }}
                    </span>
                    <span v-if="getSubjectGrade(student, subj)!.average != null" class="ml-1 text-[10px] text-gray-400">
                      {{ getSubjectGrade(student, subj)!.average!.toFixed(0) }}
                    </span>
                  </template>
                  <span v-else class="text-xs text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    v-if="student.overall_letter"
                    class="inline-flex min-w-[28px] items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-bold"
                    :class="letterGradeClass(student.overall_letter)"
                  >
                    {{ student.overall_letter }}
                  </span>
                  <span v-if="student.overall_average != null" class="ml-1 text-xs text-gray-500 dark:text-gray-400">
                    {{ student.overall_average.toFixed(1) }}
                  </span>
                  <span v-else class="text-xs text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    v-if="student.psychological_state"
                    class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    :class="psychScoreClass(student.psychological_state.score)"
                  >
                    <span class="h-1.5 w-1.5 rounded-full" :class="psychDotClass(student.psychological_state.score)"></span>
                    {{ student.psychological_state.name }}
                  </span>
                  <span v-else class="text-xs text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <router-link
                    :to="`/students/${student.user_id}`"
                    class="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
                  >
                    <Eye class="h-3 w-3" />
                    {{ t('common.view') }}
                  </router-link>
                </td>
              </tr>
              <tr v-if="filteredStudents.length === 0">
                <td :colspan="subjectColumns.length + 4" class="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  {{ t('common.noData') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Users, ArrowLeft, Search, ArrowUpDown, Eye } from 'lucide-vue-next'
import { getTeacherMyClassesApi, getClassStudentsApi } from '@/api/teacherDashboard'
import type { TeacherClassGroup, ClassStudentsResponse, ClassStudent, ClassStudentSubject } from '@/types/teacherDashboard'

const { t } = useI18n()

const loading = ref(true)
const loadingStudents = ref(false)
const classes = ref<TeacherClassGroup[]>([])
const selectedClass = ref<TeacherClassGroup | null>(null)
const studentsData = ref<ClassStudentsResponse | null>(null)
const showAllSubjects = ref(false)
const search = ref('')
const sortKey = ref<'name' | 'overall'>('name')
const sortAsc = ref(true)

async function fetchClasses() {
  loading.value = true
  try {
    const { data } = await getTeacherMyClassesApi()
    classes.value = data
  } catch {
    // handled by global interceptor
  } finally {
    loading.value = false
  }
}

async function fetchStudents() {
  if (!selectedClass.value) return
  loadingStudents.value = true
  try {
    const { data } = await getClassStudentsApi(selectedClass.value.class_group_id, showAllSubjects.value)
    studentsData.value = data
  } catch {
    // handled by global interceptor
  } finally {
    loadingStudents.value = false
  }
}

function selectClass(cls: TeacherClassGroup) {
  selectedClass.value = cls
  showAllSubjects.value = cls.is_homeroom
  search.value = ''
  fetchStudents()
}

function goBack() {
  selectedClass.value = null
  studentsData.value = null
  search.value = ''
}

watch(showAllSubjects, () => {
  fetchStudents()
})

const subjectColumns = computed(() => {
  if (!studentsData.value) return []
  const subjects = new Set<string>()
  for (const s of studentsData.value.students) {
    for (const sub of s.subjects) {
      subjects.add(sub.subject_name)
    }
  }
  return [...subjects].sort()
})

function toggleSort(key: 'name' | 'overall') {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value
  else { sortKey.value = key; sortAsc.value = true }
}

const filteredStudents = computed(() => {
  if (!studentsData.value) return []
  let list = [...studentsData.value.students]
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter((s) => s.full_name.toLowerCase().includes(q))
  }
  list.sort((a, b) => {
    if (sortKey.value === 'name') {
      return sortAsc.value ? a.full_name.localeCompare(b.full_name) : b.full_name.localeCompare(a.full_name)
    }
    const aVal = a.overall_average ?? -1
    const bVal = b.overall_average ?? -1
    return sortAsc.value ? aVal - bVal : bVal - aVal
  })
  return list
})

function getSubjectGrade(student: ClassStudent, subjectName: string): ClassStudentSubject | undefined {
  return student.subjects.find((s) => s.subject_name === subjectName)
}

function initials(name: string): string {
  return name.split(' ').map((p) => p[0] || '').join('').toUpperCase().slice(0, 2)
}

function letterGradeClass(grade: string | null) {
  switch (grade) {
    case 'A': return 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
    case 'B': return 'bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-400'
    case 'C': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
    case 'D': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400'
    case 'F': return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
    default: return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
  }
}

function psychScoreClass(score: number) {
  if (score <= 2) return 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
  if (score === 3) return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
  return 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
}

function psychDotClass(score: number) {
  if (score <= 2) return 'bg-red-500'
  if (score === 3) return 'bg-amber-500'
  return 'bg-green-500'
}

onMounted(fetchClasses)
</script>
