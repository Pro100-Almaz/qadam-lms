<template>
  <div class="space-y-6">
    <!-- Class Header -->
    <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
      <div class="px-6 py-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-bold text-gray-800 dark:text-white/90">{{ data.class_group }}</h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ t('teacherDashboard.homeroomOverview') }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 dark:bg-brand-500/10">
              <Users class="h-4 w-4 text-brand-500" />
              <span class="text-sm font-semibold text-brand-600 dark:text-brand-400">{{ data.student_count }}</span>
            </div>
            <div class="flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2 dark:bg-purple-500/10">
              <BookOpen class="h-4 w-4 text-purple-500" />
              <span class="text-sm font-semibold text-purple-600 dark:text-purple-400">{{ data.subject_count }} {{ t('teacherDashboard.subjects') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          v-model="search"
          type="text"
          :placeholder="t('common.search')"
          class="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        />
      </div>
    </div>

    <!-- Grades Table -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
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
                <p class="text-sm font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">{{ student.full_name }}</p>
              </td>
              <td
                v-for="subj in subjectColumns"
                :key="subj"
                class="px-4 py-3 text-center"
              >
                <span
                  v-if="getSubjectGrade(student, subj)"
                  class="inline-flex min-w-[28px] items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold"
                  :class="letterGradeClass(getSubjectGrade(student, subj)!.letter_grade)"
                >
                  {{ getSubjectGrade(student, subj)!.letter_grade || '—' }}
                </span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Users, BookOpen, Search, ArrowUpDown, Eye } from 'lucide-vue-next'
import type { HomeroomTeacherDashboard, HomeroomStudent, HomeroomStudentSubject } from '@/types/teacherDashboard'

const props = defineProps<{ data: HomeroomTeacherDashboard }>()
const { t } = useI18n()

const search = ref('')
const sortKey = ref<'name' | 'overall'>('name')
const sortAsc = ref(true)

const subjectColumns = computed(() => {
  const subjects = new Set<string>()
  for (const s of props.data.students) {
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
  let list = [...props.data.students]
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

function getSubjectGrade(student: HomeroomStudent, subjectName: string): HomeroomStudentSubject | undefined {
  return student.subjects.find((s) => s.subject_name === subjectName)
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
</script>
