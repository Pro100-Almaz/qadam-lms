<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <Loader2 class="h-8 w-8 animate-spin text-brand-500" />
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900"
      >
        <AlertTriangle class="h-12 w-12 text-red-400" />
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">{{ error }}</p>
        <router-link
          to="/lessons"
          class="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition"
        >
          <ArrowLeft class="h-4 w-4" />
          {{ t('common.back') }}
        </router-link>
      </div>

      <!-- Content -->
      <template v-else-if="lesson">
        <!-- Back button -->
        <button
          @click="$router.back()"
          class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90 transition-colors"
        >
          <ArrowLeft class="h-4 w-4" />
          {{ t('common.back') }}
        </button>

        <!-- Header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {{ lesson.title }}
          </h1>
          <div class="flex items-center gap-2">
            <router-link
              :to="`/lessons/${lesson.id}/grading`"
              class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition"
            >
              <ClipboardCheck class="h-4 w-4" />
              {{ t('lessons.gradeStudents') }}
            </router-link>
            <button
              @click="confirmDeleteLesson"
              class="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash2 class="h-4 w-4" />
              {{ t('lessons.deleteLesson') }}
            </button>
          </div>
        </div>

        <!-- Lesson Info Card -->
        <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div class="grid gap-6 md:grid-cols-2">
            <div>
              <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ lesson.title }}</h2>
              <p v-if="lesson.description" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {{ lesson.description }}
              </p>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">{{ t('lessons.subject') }}</span>
                <span class="font-medium text-gray-800 dark:text-white/90">{{ lesson.offering.subject_name }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">{{ t('lessons.class') }}</span>
                <span class="font-medium text-gray-800 dark:text-white/90">{{ lesson.offering.class_group_name }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">{{ t('common.status') }}</span>
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="statusBadgeClass(lesson.status)"
                >
                  {{ lesson.status }}
                </span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">{{ t('lessons.quarter') }}</span>
                <span class="font-medium text-gray-800 dark:text-white/90">{{ lesson.quarter }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">{{ t('lessons.unit') }}</span>
                <span class="font-medium text-gray-800 dark:text-white/90">{{ lesson.unit }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">{{ t('lessons.date') }}</span>
                <span class="font-medium text-gray-800 dark:text-white/90">{{ lesson.date }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="border-b border-gray-200 dark:border-gray-800">
          <nav class="-mb-px flex gap-1">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              @click="activeTab = tab.key"
              class="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors"
              :class="
                activeTab === tab.key
                  ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-300'
              "
            >
              <component :is="tab.icon" class="h-4 w-4" />
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Tab: Topics & Subtopics -->
        <template v-if="activeTab === 'content'">

        <!-- Topics Card -->
        <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div class="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('lessons.topics') }}</h2>
            <div class="flex items-center gap-2">
              <button
                @click="handleDistributeTopicWeights"
                class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                <Scale class="h-4 w-4" />
                {{ t('lessons.distributeWeights') }}
              </button>
              <button
                @click="openAddTopicModal"
                class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition"
              >
                <Plus class="h-4 w-4" />
                {{ t('lessons.addTopic') }}
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table v-if="lesson.topics.length" class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-800">
                  <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">#</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{{ t('common.name') }}</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{{ t('lessons.weight') }}</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{{ t('lessons.commentTemplate') }}</th>
                  <th class="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(topic, idx) in lesson.topics"
                  :key="topic.id"
                  class="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                >
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ idx + 1 }}</td>
                  <td class="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{{ topic.title }}</td>
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ topic.weight }}%</td>
                  <td class="max-w-[200px] truncate px-4 py-3 text-gray-500 dark:text-gray-400">{{ topic.comment_template || '—' }}</td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        @click="openEditTopicModal(topic)"
                        class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-300"
                      >
                        <Pencil class="h-4 w-4" />
                      </button>
                      <button
                        @click="confirmDeleteTopic(topic.id)"
                        class="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="flex flex-col items-center py-10">
              <BookOpen class="h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('lessons.noTopics') }}</p>
            </div>
          </div>
        </div>

        <!-- Subtopics Card -->
        <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div class="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
              <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('lessons.subtopics') }}</h2>
              <select
                v-model="subtopicFilterTopicId"
                class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:border-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600"
              >
                <option :value="null">{{ t('lessons.allTopics') }}</option>
                <option v-for="topic in lesson.topics" :key="topic.id" :value="topic.id">
                  {{ topic.title }}
                </option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="handleDistributeSubtopicWeights"
                class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                <Scale class="h-4 w-4" />
                {{ t('lessons.distributeWeights') }}
              </button>
              <button
                @click="openAddSubtopicModal"
                class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition"
              >
                <Plus class="h-4 w-4" />
                {{ t('lessons.addSubtopic') }}
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table v-if="filteredSubtopics.length" class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-800">
                  <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">#</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{{ t('common.name') }}</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{{ t('lessons.weight') }}</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{{ t('lessons.commentTemplate') }}</th>
                  <th class="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(sub, idx) in filteredSubtopics"
                  :key="sub.subtopic.id"
                  class="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                >
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ idx + 1 }}</td>
                  <td class="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{{ sub.subtopic.title }}</td>
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ sub.subtopic.weight }}%</td>
                  <td class="max-w-[200px] truncate px-4 py-3 text-gray-500 dark:text-gray-400">{{ sub.subtopic.comment_template || '—' }}</td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        @click="openEditSubtopicModal(sub.subtopic, sub.topicId)"
                        class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-300"
                      >
                        <Pencil class="h-4 w-4" />
                      </button>
                      <button
                        @click="confirmDeleteSubtopic(sub.subtopic.id)"
                        class="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="flex flex-col items-center py-10">
              <BookOpen class="h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('lessons.noSubtopics') }}</p>
            </div>
          </div>
        </div>

        </template>

        <!-- Tab: Student Grades -->
        <template v-if="activeTab === 'grades'">

        <!-- Student Grades Card -->
        <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div class="border-b border-gray-200 p-4 dark:border-gray-800">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('lessons.studentGrades') }}</h2>
          </div>
          <div class="overflow-x-auto">
            <table v-if="lesson.students.length" class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-800">
                  <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">#</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{{ t('students.fullName') }}</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{{ t('lessons.points') }}</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{{ t('lessons.grade') }}</th>
                  <th class="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(student, idx) in lesson.students"
                  :key="student.id"
                  class="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                >
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ idx + 1 }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                        {{ getInitials(student.full_name) }}
                      </div>
                      <span class="font-medium text-gray-800 dark:text-white/90">{{ student.full_name }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {{ getStudentTotal(student.user_id) }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                      :class="gradeColorClass(getLetterGrade(getStudentTotal(student.user_id)))"
                    >
                      {{ getLetterGrade(getStudentTotal(student.user_id)) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button
                      @click="openGradeModal(student)"
                      class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      <Eye class="h-3.5 w-3.5" />
                      {{ t('lessons.viewGrade') }}
                    </button>
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
      </template>

      <!-- Add/Edit Topic Modal -->
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
            v-if="showTopicModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            @click.self="showTopicModal = false"
          >
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="scale-95 opacity-0"
              enter-to-class="scale-100 opacity-100"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="scale-100 opacity-100"
              leave-to-class="scale-95 opacity-0"
            >
              <div
                v-if="showTopicModal"
                class="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900"
              >
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {{ editingTopicId ? t('lessons.editTitle') : t('lessons.addTopic') }}
                  </h3>
                  <button @click="showTopicModal = false" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
                    <X class="h-5 w-5" />
                  </button>
                </div>
                <form @submit.prevent="handleSaveTopic" class="mt-4 space-y-4">
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('common.name') }}</label>
                    <input
                      v-model="topicForm.title"
                      type="text"
                      required
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                  <div v-if="editingTopicId">
                    <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('lessons.weight') }}</label>
                    <input
                      v-model="topicForm.weight"
                      type="text"
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('lessons.commentTemplate') }}</label>
                    <textarea
                      v-model="topicForm.comment_template"
                      rows="3"
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    ></textarea>
                  </div>
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      @click="showTopicModal = false"
                      class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      {{ t('common.cancel') }}
                    </button>
                    <button
                      type="submit"
                      :disabled="saving"
                      class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
                    >
                      <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
                      {{ t('common.save') }}
                    </button>
                  </div>
                </form>
              </div>
            </Transition>
          </div>
        </Transition>
      </Teleport>

      <!-- Add/Edit Subtopic Modal -->
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
            v-if="showSubtopicModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            @click.self="showSubtopicModal = false"
          >
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="scale-95 opacity-0"
              enter-to-class="scale-100 opacity-100"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="scale-100 opacity-100"
              leave-to-class="scale-95 opacity-0"
            >
              <div
                v-if="showSubtopicModal"
                class="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900"
              >
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {{ editingSubtopicId ? t('lessons.editTitle') : t('lessons.addSubtopic') }}
                  </h3>
                  <button @click="showSubtopicModal = false" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
                    <X class="h-5 w-5" />
                  </button>
                </div>
                <form @submit.prevent="handleSaveSubtopic" class="mt-4 space-y-4">
                  <div v-if="!editingSubtopicId">
                    <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('lessons.parentTopic') }}</label>
                    <select
                      v-model="subtopicForm.parent"
                      required
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <option v-for="topic in lesson?.topics" :key="topic.id" :value="topic.id">
                        {{ topic.title }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('common.name') }}</label>
                    <input
                      v-model="subtopicForm.title"
                      type="text"
                      required
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                  <div v-if="editingSubtopicId">
                    <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('lessons.weight') }}</label>
                    <input
                      v-model="subtopicForm.weight"
                      type="text"
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('lessons.commentTemplate') }}</label>
                    <textarea
                      v-model="subtopicForm.comment_template"
                      rows="3"
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    ></textarea>
                  </div>
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      @click="showSubtopicModal = false"
                      class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      {{ t('common.cancel') }}
                    </button>
                    <button
                      type="submit"
                      :disabled="saving"
                      class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
                    >
                      <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
                      {{ t('common.save') }}
                    </button>
                  </div>
                </form>
              </div>
            </Transition>
          </div>
        </Transition>
      </Teleport>

      <!-- View Grade Modal -->
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
            v-if="showGradeModal && selectedStudent"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            @click.self="showGradeModal = false"
          >
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="scale-95 opacity-0"
              enter-to-class="scale-100 opacity-100"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="scale-100 opacity-100"
              leave-to-class="scale-95 opacity-0"
            >
              <div
                v-if="showGradeModal && selectedStudent"
                class="mx-4 w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                      {{ selectedStudent.full_name }}
                    </h3>
                    <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {{ t('lessons.points') }}: {{ getStudentTotal(selectedStudent.user_id) }}
                    </p>
                  </div>
                  <button @click="showGradeModal = false" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
                    <X class="h-5 w-5" />
                  </button>
                </div>

                <div class="mt-4 grid gap-4 md:grid-cols-2">
                  <!-- Left: Topics grades -->
                  <div>
                    <h4 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{{ t('lessons.topics') }}</h4>
                    <div class="space-y-2">
                      <div
                        v-for="topic in lesson!.topics"
                        :key="topic.id"
                        class="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                        :class="{ 'cursor-pointer hover:border-brand-300 dark:hover:border-brand-600': true, 'border-brand-400 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-500/10': gradeModalSelectedTopicId === topic.id }"
                        @click="gradeModalSelectedTopicId = topic.id"
                      >
                        <div class="flex items-center justify-between">
                          <span class="text-sm font-medium text-gray-800 dark:text-white/90">{{ topic.title }}</span>
                          <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {{ getTopicGrade(selectedStudent.user_id, topic.id)?.grade ?? '—' }}
                          </span>
                        </div>
                        <p
                          v-if="getTopicGrade(selectedStudent.user_id, topic.id)?.comment"
                          class="mt-1 rounded px-2 py-1 text-xs text-gray-600 dark:text-gray-400"
                          :class="getTopicGrade(selectedStudent.user_id, topic.id)?.comment_selected ? 'bg-green-100 dark:bg-green-500/20' : 'bg-gray-50 dark:bg-gray-800'"
                        >
                          {{ getTopicGrade(selectedStudent.user_id, topic.id)?.comment }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Right: Subtopics for selected topic -->
                  <div>
                    <div class="mb-2 flex items-center justify-between">
                      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ t('lessons.subtopics') }}</h4>
                      <select
                        v-model="gradeModalSelectedTopicId"
                        class="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        <option v-for="topic in lesson!.topics" :key="topic.id" :value="topic.id">
                          {{ topic.title }}
                        </option>
                      </select>
                    </div>
                    <div v-if="gradeModalSubtopics.length" class="space-y-2">
                      <div
                        v-for="sub in gradeModalSubtopics"
                        :key="sub.id"
                        class="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                      >
                        <div class="flex items-center justify-between">
                          <span class="text-sm font-medium text-gray-800 dark:text-white/90">{{ sub.title }}</span>
                          <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {{ getTopicGrade(selectedStudent.user_id, sub.id)?.grade ?? '—' }}
                          </span>
                        </div>
                        <p
                          v-if="getTopicGrade(selectedStudent.user_id, sub.id)?.comment"
                          class="mt-1 rounded px-2 py-1 text-xs text-gray-600 dark:text-gray-400"
                          :class="getTopicGrade(selectedStudent.user_id, sub.id)?.comment_selected ? 'bg-green-100 dark:bg-green-500/20' : 'bg-gray-50 dark:bg-gray-800'"
                        >
                          {{ getTopicGrade(selectedStudent.user_id, sub.id)?.comment }}
                        </p>
                      </div>
                    </div>
                    <div v-else class="flex flex-col items-center py-8">
                      <p class="text-sm text-gray-400 dark:text-gray-500">{{ t('lessons.noSubtopics') }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </Transition>
      </Teleport>

      <!-- Confirm Delete Modal -->
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
            v-if="showConfirmModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            @click.self="showConfirmModal = false"
          >
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="scale-95 opacity-0"
              enter-to-class="scale-100 opacity-100"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="scale-100 opacity-100"
              leave-to-class="scale-95 opacity-0"
            >
              <div
                v-if="showConfirmModal"
                class="mx-4 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900"
              >
                <div class="flex flex-col items-center text-center">
                  <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                    <AlertTriangle class="h-6 w-6 text-red-500" />
                  </div>
                  <h3 class="mt-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('common.confirm') }}</h3>
                  <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ confirmMessage }}</p>
                </div>
                <div class="mt-6 flex justify-center gap-3">
                  <button
                    @click="showConfirmModal = false"
                    class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    {{ t('common.cancel') }}
                  </button>
                  <button
                    @click="executeConfirmAction"
                    :disabled="saving"
                    class="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                  >
                    <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
                    {{ t('common.delete') }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </Transition>
      </Teleport>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  BookOpen,
  Users,
  Eye,
  AlertTriangle,
  ClipboardCheck,
  Scale,
  ListOrdered,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import {
  getLessonDetailApi,
  createTopicApi,
  updateTopicApi,
  deleteTopicApi,
  distributeTopicWeightsApi,
  createSubtopicApi,
  updateSubtopicApi,
  deleteSubtopicApi,
  distributeSubtopicWeightsApi,
  deleteLessonApi,
} from '@/api/lessons'
import type { LessonDetail, Topic, Subtopic, LessonStudent, TopicGrade } from '@/types/lesson'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// State
const lesson = ref<LessonDetail | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'content' | 'grades'>('content')

const tabs = computed(() => [
  { key: 'content' as const, label: t('lessons.topics') + ' & ' + t('lessons.subtopics'), icon: ListOrdered },
  { key: 'grades' as const, label: t('lessons.studentGrades'), icon: Users },
])

// Topic modal
const showTopicModal = ref(false)
const editingTopicId = ref<number | null>(null)
const topicForm = ref({ title: '', weight: '', comment_template: '' })

// Subtopic modal
const showSubtopicModal = ref(false)
const editingSubtopicId = ref<number | null>(null)
const subtopicForm = ref({ parent: 0, title: '', weight: '', comment_template: '' })
const subtopicFilterTopicId = ref<number | null>(null)

// Grade modal
const showGradeModal = ref(false)
const selectedStudent = ref<LessonStudent | null>(null)
const gradeModalSelectedTopicId = ref<number | null>(null)

// Confirm modal
const showConfirmModal = ref(false)
const confirmMessage = ref('')
const confirmAction = ref<(() => Promise<void>) | null>(null)

const lessonId = computed(() => Number(route.params.id))

// Computed
const filteredSubtopics = computed(() => {
  if (!lesson.value) return []
  const items: { subtopic: Subtopic; topicId: number }[] = []
  for (const topic of lesson.value.topics) {
    for (const sub of topic.subtopics) {
      if (subtopicFilterTopicId.value === null || subtopicFilterTopicId.value === topic.id) {
        items.push({ subtopic: sub, topicId: topic.id })
      }
    }
  }
  return items
})

const gradeModalSubtopics = computed(() => {
  if (!lesson.value || !gradeModalSelectedTopicId.value) return []
  const topic = lesson.value.topics.find((t) => t.id === gradeModalSelectedTopicId.value)
  return topic?.subtopics ?? []
})

// Helpers
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getStudentTotal(userId: number): number {
  const grades = lesson.value?.student_grades?.[String(userId)]
  if (!grades) return 0
  return grades.grade_total
}

function getLetterGrade(score: number): number {
  if (score >= 90) return 5
  if (score >= 70) return 4
  if (score >= 50) return 3
  return 2
}

function getTopicGrade(userId: number, topicId: number): TopicGrade | null {
  const grades = lesson.value?.student_grades?.[String(userId)]
  if (!grades) return null
  const val = grades[String(topicId)]
  if (typeof val === 'object' && val !== null) return val as TopicGrade
  return null
}

function gradeColorClass(grade: number): string {
  if (grade >= 5) return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
  if (grade >= 4) return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
  if (grade >= 3) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
  return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase()
  if (s === 'active' || s === 'published') return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
  if (s === 'draft') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
  return 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400'
}

// Data fetching
async function fetchLesson() {
  loading.value = true
  error.value = null
  try {
    const { data } = await getLessonDetailApi(lessonId.value)
    lesson.value = data
  } catch (e) {
    error.value = 'Failed to load lesson details.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function refreshLesson() {
  try {
    const { data } = await getLessonDetailApi(lessonId.value)
    lesson.value = data
  } catch (e) {
    console.error('Failed to refresh lesson:', e)
  }
}

// Topic CRUD
function openAddTopicModal() {
  editingTopicId.value = null
  topicForm.value = { title: '', weight: '', comment_template: '' }
  showTopicModal.value = true
}

function openEditTopicModal(topic: Topic) {
  editingTopicId.value = topic.id
  topicForm.value = {
    title: topic.title,
    weight: topic.weight,
    comment_template: topic.comment_template,
  }
  showTopicModal.value = true
}

async function handleSaveTopic() {
  saving.value = true
  try {
    if (editingTopicId.value) {
      await updateTopicApi(editingTopicId.value, {
        title: topicForm.value.title,
        weight: topicForm.value.weight,
        comment_template: topicForm.value.comment_template,
      })
    } else {
      await createTopicApi(lessonId.value, {
        title: topicForm.value.title,
        comment_template: topicForm.value.comment_template,
      })
    }
    showTopicModal.value = false
    await refreshLesson()
  } catch (e) {
    console.error('Failed to save topic:', e)
  } finally {
    saving.value = false
  }
}

function confirmDeleteTopic(topicId: number) {
  confirmMessage.value = t('lessons.confirmDeleteTopic')
  confirmAction.value = async () => {
    await deleteTopicApi(topicId)
    await refreshLesson()
  }
  showConfirmModal.value = true
}

async function handleDistributeTopicWeights() {
  saving.value = true
  try {
    await distributeTopicWeightsApi(lessonId.value)
    await refreshLesson()
  } catch (e) {
    console.error('Failed to distribute topic weights:', e)
  } finally {
    saving.value = false
  }
}

// Subtopic CRUD
function openAddSubtopicModal() {
  editingSubtopicId.value = null
  subtopicForm.value = {
    parent: lesson.value?.topics[0]?.id ?? 0,
    title: '',
    weight: '',
    comment_template: '',
  }
  showSubtopicModal.value = true
}

function openEditSubtopicModal(subtopic: Subtopic, topicId: number) {
  editingSubtopicId.value = subtopic.id
  subtopicForm.value = {
    parent: topicId,
    title: subtopic.title,
    weight: subtopic.weight,
    comment_template: subtopic.comment_template,
  }
  showSubtopicModal.value = true
}

async function handleSaveSubtopic() {
  saving.value = true
  try {
    if (editingSubtopicId.value) {
      await updateSubtopicApi(editingSubtopicId.value, {
        title: subtopicForm.value.title,
        weight: subtopicForm.value.weight,
        comment_template: subtopicForm.value.comment_template,
      })
    } else {
      await createSubtopicApi(lessonId.value, {
        parent: subtopicForm.value.parent,
        title: subtopicForm.value.title,
      })
    }
    showSubtopicModal.value = false
    await refreshLesson()
  } catch (e) {
    console.error('Failed to save subtopic:', e)
  } finally {
    saving.value = false
  }
}

function confirmDeleteSubtopic(subtopicId: number) {
  confirmMessage.value = t('lessons.confirmDeleteSubtopic')
  confirmAction.value = async () => {
    await deleteSubtopicApi(subtopicId)
    await refreshLesson()
  }
  showConfirmModal.value = true
}

async function handleDistributeSubtopicWeights() {
  saving.value = true
  try {
    await distributeSubtopicWeightsApi(lessonId.value)
    await refreshLesson()
  } catch (e) {
    console.error('Failed to distribute subtopic weights:', e)
  } finally {
    saving.value = false
  }
}

// Grade modal
function openGradeModal(student: LessonStudent) {
  selectedStudent.value = student
  gradeModalSelectedTopicId.value = lesson.value?.topics[0]?.id ?? null
  showGradeModal.value = true
}

// Delete lesson
function confirmDeleteLesson() {
  confirmMessage.value = t('lessons.confirmDeleteLesson')
  confirmAction.value = async () => {
    await deleteLessonApi(lessonId.value)
    router.push('/lessons')
  }
  showConfirmModal.value = true
}

async function executeConfirmAction() {
  if (!confirmAction.value) return
  saving.value = true
  try {
    await confirmAction.value()
    showConfirmModal.value = false
  } catch (e) {
    console.error('Action failed:', e)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchLesson()
})
</script>
