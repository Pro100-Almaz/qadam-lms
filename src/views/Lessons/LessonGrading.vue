<template>
  <AdminLayout>
    <div class="space-y-6">

      <!-- Back button -->
      <button
        @click="$router.back()"
        class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90 transition-colors"
      >
        <ArrowLeft class="h-4 w-4" />
        {{ t('common.back') }}
      </button>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <Loader2 class="h-8 w-8 animate-spin text-brand-500" />
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900"
      >
        <AlertTriangle class="h-12 w-12 text-error-400" />
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">{{ error }}</p>
      </div>

      <!-- Content -->
      <template v-else-if="grading">

        <!-- Header -->
        <div class="flex flex-col gap-2">
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {{ t('grading.title') }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ grading.title }} — Q{{ grading.quarter }}
          </p>
        </div>

        <!-- Lesson Info -->
        <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('lessons.quarter') }}</p>
              <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">Q{{ grading.quarter }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('common.status') }}</p>
              <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">{{ grading.status }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('lessons.topics') }}</p>
              <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">{{ grading.topics.length }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('students.title') }}</p>
              <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">{{ grading.students.length }}</p>
            </div>
          </div>
        </div>

        <!-- Student Grades Table -->
        <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('grading.studentGrades') }}</h2>
          </div>
          <div class="overflow-x-auto">
            <table v-if="grading.students.length" class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-800">
                  <th class="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">#</th>
                  <th class="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{{ t('students.fullName') }}</th>
                  <th class="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">{{ t('lessons.points') }}</th>
                  <th class="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">{{ t('lessons.grade') }}</th>
                  <th class="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{{ t('grading.comment') }}</th>
                  <th class="px-5 py-3 text-right font-medium text-gray-500 dark:text-gray-400">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(student, idx) in grading.students"
                  :key="student.id"
                  class="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                >
                  <td class="px-5 py-3 text-gray-500 dark:text-gray-400">{{ idx + 1 }}</td>
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-3">
                      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                        {{ getInitials(student.full_name) }}
                      </div>
                      <span class="font-medium text-gray-800 dark:text-white/90">{{ student.full_name }}</span>
                    </div>
                  </td>
                  <td class="px-5 py-3 text-center">
                    <span v-if="hasGrade(student.user_id)" class="font-semibold text-gray-800 dark:text-white/90">
                      {{ getStudentTotal(student.user_id).toFixed(1) }}
                    </span>
                    <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                  </td>
                  <td class="px-5 py-3 text-center">
                    <span
                      v-if="hasGrade(student.user_id)"
                      class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                      :class="gradeColorClass(getLetterGrade(getStudentTotal(student.user_id)))"
                    >
                      {{ getLetterGrade(getStudentTotal(student.user_id)) }}
                    </span>
                    <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                  </td>
                  <td class="px-5 py-3 max-w-[200px]">
                    <button
                      v-if="getStudentComment(student.user_id)"
                      @click="showCommentModal(getStudentComment(student.user_id)!)"
                      class="truncate text-left text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 underline max-w-[180px] block"
                    >
                      {{ getStudentComment(student.user_id)!.slice(0, 30) }}{{ getStudentComment(student.user_id)!.length > 30 ? '...' : '' }}
                    </button>
                    <span v-else class="text-xs text-gray-400 dark:text-gray-500 italic">{{ t('grading.noComment') }}</span>
                  </td>
                  <td class="px-5 py-3 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        @click="openGradingModal(student)"
                        class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition"
                      >
                        <Pencil class="h-3.5 w-3.5" />
                        {{ hasGrade(student.user_id) ? t('common.edit') : t('grading.setGrade') }}
                      </button>
                      <button
                        v-if="hasGrade(student.user_id)"
                        @click="confirmDeleteGrade(student)"
                        class="inline-flex items-center gap-1.5 rounded-lg border border-error-200 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-50 dark:border-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10 transition"
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="flex flex-col items-center py-10">
              <Users class="h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('lessons.noStudents') }}</p>
            </div>
          </div>
        </div>
      </template>

      <!-- ─── Grading Modal ───────────────────────────────────── -->
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
            v-if="showModal && modalStudent"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            @click.self="showModal = false"
          >
            <div class="mx-4 w-full max-w-5xl rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 max-h-[90vh] flex flex-col">
              <!-- Modal Header -->
              <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800 shrink-0">
                <div>
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {{ t('grading.gradeFor') }} {{ modalStudent.full_name }}
                  </h3>
                  <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {{ t('grading.totalGrade') }}: <strong class="text-gray-800 dark:text-white/90">{{ calculatedTotal.toFixed(1) }}</strong>
                  </p>
                </div>
                <button @click="showModal = false" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
                  <X class="h-5 w-5" />
                </button>
              </div>

              <!-- Mode toggles -->
              <div class="flex flex-wrap items-center gap-4 border-b border-gray-100 px-6 py-3 dark:border-gray-800 shrink-0">
                <!-- Comment mode -->
                <div class="flex items-center gap-1.5">
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ t('grading.commentMode') }}:</span>
                  <div class="flex rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                      @click="commentMode = 'selected'"
                      :class="['px-3 py-1.5 text-xs font-medium transition rounded-l-lg', commentMode === 'selected' ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5']"
                    >
                      {{ t('grading.selectedComment') }}
                    </button>
                    <button
                      @click="commentMode = 'merged'"
                      :class="['px-3 py-1.5 text-xs font-medium transition rounded-r-lg', commentMode === 'merged' ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5']"
                    >
                      {{ t('grading.mergedComment') }}
                    </button>
                  </div>
                </div>
                <!-- Grading mode -->
                <div class="flex items-center gap-1.5">
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ t('grading.gradingMode') }}:</span>
                  <div class="flex rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                      @click="cascadeMode = true"
                      :class="['px-3 py-1.5 text-xs font-medium transition rounded-l-lg', cascadeMode ? 'bg-success-500 text-white' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5']"
                    >
                      {{ t('grading.cascade') }}
                    </button>
                    <button
                      @click="cascadeMode = false"
                      :class="['px-3 py-1.5 text-xs font-medium transition rounded-r-lg', !cascadeMode ? 'bg-success-500 text-white' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5']"
                    >
                      {{ t('grading.independent') }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Modal Body: Topics/Subtopics -->
              <div class="flex-1 overflow-y-auto px-6 py-4">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-800">
                      <th class="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">{{ t('lessons.topics') }}</th>
                      <th class="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-400 w-20">{{ t('lessons.weight') }}</th>
                      <th class="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-400 w-20">{{ t('grading.covered') }}</th>
                      <th class="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">{{ t('grading.comment') }}</th>
                      <th v-if="commentMode === 'selected'" class="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-400 w-20">{{ t('grading.select') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="topic in grading!.topics" :key="topic.id">
                      <!-- Topic row -->
                      <tr class="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
                        <td class="px-3 py-2.5">
                          <div class="flex items-center gap-2">
                            <button
                              v-if="topic.subtopics.length"
                              @click="toggleExpanded(topic.id)"
                              class="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <ChevronRight :class="['h-4 w-4 transition-transform', expandedTopics.has(topic.id) && 'rotate-90']" />
                            </button>
                            <span class="font-medium text-gray-800 dark:text-white/90">{{ topic.title }}</span>
                          </div>
                        </td>
                        <td class="px-3 py-2.5 text-center text-gray-600 dark:text-gray-300">{{ topic.weight }}%</td>
                        <td class="px-3 py-2.5 text-center">
                          <input
                            v-if="!topic.subtopics.length"
                            type="checkbox"
                            :checked="topicStates[topic.id]?.covered"
                            @change="onTopicCoveredChange(topic)"
                            class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                          />
                        </td>
                        <td class="px-3 py-2.5">
                          <textarea
                            v-model="topicStates[topic.id].comment"
                            rows="1"
                            class="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 resize-none"
                            :placeholder="t('grading.addComment')"
                          />
                        </td>
                        <td v-if="commentMode === 'selected'" class="px-3 py-2.5 text-center">
                          <input
                            v-if="!topic.subtopics.length"
                            type="checkbox"
                            :checked="topicStates[topic.id]?.comment_selected"
                            @change="onCommentSelectedChange(topic.id, 'topic')"
                            class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                          />
                          <span v-else class="text-xs text-gray-400">—</span>
                        </td>
                      </tr>

                      <!-- Subtopic rows -->
                      <template v-if="topic.subtopics.length && expandedTopics.has(topic.id)">
                        <tr
                          v-for="sub in topic.subtopics"
                          :key="sub.id"
                          class="border-b border-gray-100 dark:border-gray-800"
                        >
                          <td class="py-2.5 pl-11 pr-3">
                            <div class="flex items-center gap-2">
                              <div class="h-4 w-0.5 rounded-full bg-brand-400" />
                              <span class="text-gray-700 dark:text-gray-300">{{ sub.title }}</span>
                            </div>
                          </td>
                          <td class="px-3 py-2.5 text-center">
                            <span class="text-xs text-gray-500 dark:text-gray-400">{{ sub.weight }}%</span>
                            <span class="block text-[10px] text-gray-400 dark:text-gray-500">
                              ({{ ((parseFloat(topic.weight) * parseFloat(sub.weight)) / 100).toFixed(1) }}%)
                            </span>
                          </td>
                          <td class="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              :checked="subtopicStates[sub.id]?.covered"
                              @change="onSubtopicCoveredChange(topic, sub)"
                              class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                            />
                          </td>
                          <td class="px-3 py-2.5">
                            <textarea
                              v-model="subtopicStates[sub.id].comment"
                              rows="1"
                              class="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 resize-none"
                              :placeholder="t('grading.addComment')"
                            />
                          </td>
                          <td v-if="commentMode === 'selected'" class="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              :checked="subtopicStates[sub.id]?.comment_selected"
                              @change="onCommentSelectedChange(sub.id, 'subtopic', topic.id)"
                              class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                            />
                          </td>
                        </tr>
                      </template>
                    </template>
                  </tbody>
                  <tfoot>
                    <tr class="border-t-2 border-gray-200 dark:border-gray-700">
                      <td class="px-3 py-3 font-semibold text-gray-800 dark:text-white/90">{{ t('grading.totalGrade') }}</td>
                      <td class="px-3 py-3 text-center">
                        <span
                          class="inline-flex rounded-full px-3 py-1 text-sm font-bold"
                          :class="gradeColorClass(getLetterGrade(calculatedTotal))"
                        >
                          {{ calculatedTotal.toFixed(1) }}
                        </span>
                      </td>
                      <td :colspan="commentMode === 'selected' ? 3 : 2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Modal Footer -->
              <div class="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800 shrink-0">
                <button
                  @click="showModal = false"
                  class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  @click="submitGrading"
                  :disabled="saving"
                  class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition"
                >
                  <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
                  {{ t('common.save') }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ─── Comment Display Modal ───────────────────────────── -->
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
            v-if="showCommentModalVisible"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            @click.self="showCommentModalVisible = false"
          >
            <div class="mx-4 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('grading.fullComment') }}</h3>
                <button @click="showCommentModalVisible = false" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
                  <X class="h-5 w-5" />
                </button>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">{{ commentModalText }}</p>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ─── Delete Confirm Modal ────────────────────────────── -->
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
            v-if="showDeleteConfirm"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            @click.self="showDeleteConfirm = false"
          >
            <div class="mx-4 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900 text-center">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error-100 dark:bg-error-500/20">
                <AlertTriangle class="h-6 w-6 text-error-500" />
              </div>
              <h3 class="mt-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('common.confirm') }}</h3>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ t('grading.confirmDeleteGrade') }}</p>
              <div class="mt-6 flex justify-center gap-3">
                <button
                  @click="showDeleteConfirm = false"
                  class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  @click="executeDeleteGrade"
                  :disabled="saving"
                  class="inline-flex items-center gap-2 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600 disabled:opacity-50"
                >
                  <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
                  {{ t('common.delete') }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Pencil,
  Trash2,
  Users,
  X,
  ChevronRight,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getGradingApi, submitGradingApi, updateGradingApi, deleteStudentGradingApi } from '@/api/grading'
import type { GradingData } from '@/types/grading'
import type { LessonStudent, Topic, Subtopic } from '@/types/lesson'

const route = useRoute()
const { t } = useI18n()

const lessonId = computed(() => Number(route.params.id))

const grading = ref<GradingData | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

// Modal state
const showModal = ref(false)
const modalStudent = ref<LessonStudent | null>(null)
const commentMode = ref<'selected' | 'merged'>('selected')
const cascadeMode = ref(true)
const expandedTopics = reactive(new Set<number>())

// Topic/subtopic grading states inside modal
const topicStates = reactive<Record<number, { covered: boolean; comment: string; comment_selected: boolean }>>({})
const subtopicStates = reactive<Record<number, { covered: boolean; comment: string; comment_selected: boolean }>>({})

// Comment modal
const showCommentModalVisible = ref(false)
const commentModalText = ref('')

// Delete confirm
const showDeleteConfirm = ref(false)
const deleteStudentRef = ref<LessonStudent | null>(null)

// ─── Fetch ──────────────────────────────────────────────────────────────────────

async function fetchGrading() {
  loading.value = true
  error.value = null
  try {
    const { data } = await getGradingApi(lessonId.value)
    grading.value = data
  } catch {
    error.value = t('common.noData')
  } finally {
    loading.value = false
  }
}

onMounted(fetchGrading)

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function hasGrade(userId: number): boolean {
  return grading.value?.student_grades[String(userId)] !== undefined
}

function getStudentTotal(userId: number): number {
  return grading.value?.student_grades[String(userId)] ?? 0
}

function getLetterGrade(score: number): number {
  if (score >= 90) return 5
  if (score >= 70) return 4
  if (score >= 50) return 3
  return 2
}

function getStudentComment(userId: number): string | null {
  const merged = grading.value?.merged_comment_map[String(userId)]
  if (merged) return merged
  const selected = grading.value?.selected_comments_map[String(userId)]
  if (selected) return selected
  return null
}

function gradeColorClass(grade: number): string {
  if (grade >= 5) return 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400'
  if (grade >= 4) return 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400'
  if (grade >= 3) return 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400'
  return 'bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400'
}

// ─── Comment modal ──────────────────────────────────────────────────────────────

function showCommentModal(text: string) {
  commentModalText.value = text
  showCommentModalVisible.value = true
}

// ─── Grading modal ──────────────────────────────────────────────────────────────

function openGradingModal(student: LessonStudent) {
  modalStudent.value = student
  const userId = String(student.user_id)
  const g = grading.value!

  // Determine comment mode from existing data
  if (g.merged_comment_map[userId]) {
    commentMode.value = 'merged'
  } else {
    commentMode.value = 'selected'
  }

  // Determine comment mode from server data
  const serverMode = g.comment_modes[userId]
  if (serverMode === 'merged') commentMode.value = 'merged'
  else if (serverMode === 'selected') commentMode.value = 'selected'

  // Initialize topic states
  for (const topic of g.topics) {
    const key = `${userId}-${topic.id}`
    const existing = g.topic_grade_map[key]

    topicStates[topic.id] = {
      covered: existing ? existing.grade >= 100 : false,
      comment: existing?.comment ?? '',
      comment_selected: existing?.comment_selected ?? false,
    }

    // Expand topics with subtopics by default
    if (topic.subtopics.length) {
      expandedTopics.add(topic.id)
    }

    // Initialize subtopic states
    for (const sub of topic.subtopics) {
      const subKey = `${userId}-${sub.id}`
      const subExisting = g.topic_grade_map[subKey]

      subtopicStates[sub.id] = {
        covered: subExisting ? subExisting.grade >= 100 : false,
        comment: subExisting?.comment ?? '',
        comment_selected: subExisting?.comment_selected ?? false,
      }
    }
  }

  showModal.value = true
}

function toggleExpanded(topicId: number) {
  if (expandedTopics.has(topicId)) {
    expandedTopics.delete(topicId)
  } else {
    expandedTopics.add(topicId)
  }
}

// ─── Covered change handlers ────────────────────────────────────────────────────

function onTopicCoveredChange(topic: Topic) {
  const state = topicStates[topic.id]
  state.covered = !state.covered

  // Prefill comment template
  if (state.covered && !state.comment.trim()) {
    const template = grading.value?.comment_templates[String(topic.id)]
    if (template) state.comment = template
  } else if (!state.covered) {
    state.comment = ''
  }

  // Cascade: auto-check all previous topics
  if (state.covered && cascadeMode.value) {
    const topics = grading.value!.topics.filter(t => !t.subtopics.length)
    const currentIdx = topics.findIndex(t => t.id === topic.id)
    for (let i = 0; i < currentIdx; i++) {
      const prev = topicStates[topics[i].id]
      if (!prev.covered) {
        prev.covered = true
        if (!prev.comment.trim()) {
          const tmpl = grading.value?.comment_templates[String(topics[i].id)]
          if (tmpl) prev.comment = tmpl
        }
      }
    }
  }
}

function onSubtopicCoveredChange(topic: Topic, sub: Subtopic) {
  const state = subtopicStates[sub.id]
  state.covered = !state.covered

  // Prefill comment template
  if (state.covered && !state.comment.trim()) {
    const template = grading.value?.comment_templates[String(sub.id)]
    if (template) state.comment = template
  } else if (!state.covered) {
    state.comment = ''
  }

  // Cascade: auto-check all previous subtopics within same topic
  if (state.covered && cascadeMode.value) {
    const currentIdx = topic.subtopics.findIndex(s => s.id === sub.id)
    for (let i = 0; i < currentIdx; i++) {
      const prev = subtopicStates[topic.subtopics[i].id]
      if (!prev.covered) {
        prev.covered = true
        if (!prev.comment.trim()) {
          const tmpl = grading.value?.comment_templates[String(topic.subtopics[i].id)]
          if (tmpl) prev.comment = tmpl
        }
      }
    }
  }

  // Recalculate topic grade from subtopics
  let weightSum = 0
  let totalWeight = 0
  for (const s of topic.subtopics) {
    const w = parseFloat(s.weight) || 0
    totalWeight += w
    if (subtopicStates[s.id]?.covered) {
      weightSum += w
    }
  }
  const topicGrade = totalWeight > 0 ? (weightSum / totalWeight) * 100 : 0
  topicStates[topic.id].covered = topicGrade >= 100
}

function onCommentSelectedChange(id: number, type: 'topic' | 'subtopic', parentTopicId?: number) {
  if (type === 'topic') {
    topicStates[id].comment_selected = !topicStates[id].comment_selected
  } else {
    const newVal = !subtopicStates[id].comment_selected
    // Only one selected per topic group
    if (newVal && parentTopicId) {
      const topic = grading.value!.topics.find(t => t.id === parentTopicId)
      if (topic) {
        for (const s of topic.subtopics) {
          if (s.id !== id) subtopicStates[s.id].comment_selected = false
        }
      }
    }
    subtopicStates[id].comment_selected = newVal
  }
}

// ─── Calculated total ───────────────────────────────────────────────────────────

const calculatedTotal = computed(() => {
  if (!grading.value) return 0
  let total = 0
  for (const topic of grading.value.topics) {
    const weight = parseFloat(topic.weight) || 0
    if (topic.subtopics.length) {
      // Calculate from subtopics
      let subWeightSum = 0
      let subTotalWeight = 0
      for (const sub of topic.subtopics) {
        const sw = parseFloat(sub.weight) || 0
        subTotalWeight += sw
        if (subtopicStates[sub.id]?.covered) {
          subWeightSum += sw
        }
      }
      const topicGrade = subTotalWeight > 0 ? (subWeightSum / subTotalWeight) * 100 : 0
      total += topicGrade * (weight / 100)
    } else {
      const grade = topicStates[topic.id]?.covered ? 100 : 0
      total += grade * (weight / 100)
    }
  }
  return total
})

// ─── Submit ─────────────────────────────────────────────────────────────────────

async function submitGrading() {
  if (!modalStudent.value || !grading.value) return
  saving.value = true

  const topics: Record<string, { covered: boolean; comment: string; comment_selected: boolean }> = {}
  const subtopics: Record<string, { covered: boolean; comment: string; comment_selected: boolean }> = {}

  for (const topic of grading.value.topics) {
    if (!topic.subtopics.length) {
      topics[String(topic.id)] = {
        covered: topicStates[topic.id]?.covered ?? false,
        comment: topicStates[topic.id]?.comment ?? '',
        comment_selected: topicStates[topic.id]?.comment_selected ?? false,
      }
    }
    for (const sub of topic.subtopics) {
      subtopics[String(sub.id)] = {
        covered: subtopicStates[sub.id]?.covered ?? false,
        comment: subtopicStates[sub.id]?.comment ?? '',
        comment_selected: subtopicStates[sub.id]?.comment_selected ?? false,
      }
    }
  }

  const payload = {
    student_id: modalStudent.value.user_id,
    comment_mode: commentMode.value as 'merged' | 'selected' | 'none',
    topics,
    subtopics,
  }

  try {
    if (hasGrade(modalStudent.value.user_id)) {
      await updateGradingApi(lessonId.value, payload)
    } else {
      await submitGradingApi(lessonId.value, payload)
    }
    showModal.value = false
    await fetchGrading()
  } catch (e) {
    console.error('Failed to submit grading:', e)
  } finally {
    saving.value = false
  }
}

// ─── Delete grade ───────────────────────────────────────────────────────────────

function confirmDeleteGrade(student: LessonStudent) {
  deleteStudentRef.value = student
  showDeleteConfirm.value = true
}

async function executeDeleteGrade() {
  if (!deleteStudentRef.value) return
  saving.value = true
  try {
    await deleteStudentGradingApi(lessonId.value, deleteStudentRef.value.user_id)
    showDeleteConfirm.value = false
    await fetchGrading()
  } catch (e) {
    console.error('Failed to delete grade:', e)
  } finally {
    saving.value = false
  }
}
</script>
