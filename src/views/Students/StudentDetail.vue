<template>
  <AdminLayout>
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <div class="flex flex-col items-center gap-3">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
        <AlertCircle class="h-8 w-8 text-red-500" />
      </div>
      <p class="text-base font-medium text-gray-800 dark:text-white/90">{{ error }}</p>
      <button
        @click="router.back()"
        class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
      >
        <ArrowLeft class="h-4 w-4" />
        {{ t('common.back') }}
      </button>
    </div>

    <!-- Content -->
    <div v-else-if="student" class="space-y-6">
      <!-- Back button -->
      <button
        @click="router.back()"
        class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90 transition-colors"
      >
        <ArrowLeft class="h-4 w-4" />
        {{ t('common.back') }}
      </button>

      <!-- Profile Header Card -->
      <div :class="['relative overflow-hidden rounded-xl border bg-gradient-to-r shadow-theme-md', schoolGradient]">
        <!-- Decorative circles -->
        <div class="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5"></div>
        <div class="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/5"></div>

        <div class="relative px-6 py-8">
          <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <!-- Left: Avatar + Info -->
            <div class="flex items-center gap-5">
              <!-- Avatar -->
              <div class="shrink-0">
                <img
                  v-if="student.user.avatar"
                  :src="student.user.avatar"
                  :alt="fullName"
                  class="h-20 w-20 rounded-full object-cover ring-4 ring-white/20"
                />
                <div
                  v-else
                  class="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/20 text-2xl font-bold text-white"
                >
                  {{ initials }}
                </div>
              </div>
              <!-- Name / meta -->
              <div>
                <h1 class="text-2xl font-bold text-white">{{ fullName }}</h1>
                <p class="mt-1 text-sm text-white/70">{{ student.user.email }}</p>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    v-if="student.current_class_group"
                    class="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-xs font-medium text-white"
                  >
                    <GraduationCap class="h-3 w-3" />
                    {{ student.current_class_group.display_name }}
                  </span>
                  <span class="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-xs font-medium text-white">
                    <BookOpen class="h-3 w-3" />
                    {{ student.user.role_display }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Right: Overall grade badge -->
            <div class="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-white/15 px-8 py-5 backdrop-blur-sm">
              <span class="text-4xl font-extrabold text-white">{{ student.student_total_grade }}</span>
              <span class="mt-1 text-xs font-medium uppercase tracking-widest text-white/70">{{ t('students.grades') }}</span>
            </div>
          </div>

          <!-- Stat cards row -->
          <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p class="text-xs text-white/60">{{ t('students.grades') }}</p>
              <p class="mt-1 text-xl font-bold text-white">{{ student.student_total_grade }}</p>
            </div>
            <div class="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p class="text-xs text-white/60">{{ t('students.class') }}</p>
              <p class="mt-1 text-xl font-bold text-white truncate">
                {{ student.current_class_group?.display_name || '—' }}
              </p>
            </div>
            <div class="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p class="text-xs text-white/60">{{ t('students.yearOfEducation') }}</p>
              <p class="mt-1 text-xl font-bold text-white">
                {{ student.current_class_group?.academic_year?.year || '—' }}
              </p>
            </div>
            <div class="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm overflow-hidden">
              <p class="text-xs text-white/60">{{ t('students.email') }}</p>
              <p class="mt-1 text-sm font-semibold text-white truncate">{{ student.user.email }}</p>
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

      <!-- TAB: Subjects -->
      <div v-show="activeTab === 'subjects'" class="space-y-6">
        <!-- Quarter indicator cards -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div
            v-for="q in [1, 2, 3, 4]"
            :key="q"
            class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs"
          >
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Q{{ q }}</p>
            <div class="mt-2 flex items-end justify-between">
              <span class="text-2xl font-bold text-gray-800 dark:text-white/90">
                {{ student.total_quarter_grades[String(q)] ?? '—' }}
              </span>
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="quarterBadgeClass(student.total_quarter_grades[String(q)])"
              >
                {{ quarterLabel(student.total_quarter_grades[String(q)]) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Subjects table -->
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
          <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">
              {{ t('subjects.title') }}
            </h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-800">
                  <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {{ t('common.name') }}
                  </th>
                  <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Score
                  </th>
                  <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 w-40">
                    Progress
                  </th>
                  <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(score, subject) in student.cumulative_subject_grades"
                  :key="subject"
                  class="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td class="px-5 py-3.5">
                    <span class="text-sm font-medium text-gray-800 dark:text-white/90">{{ subject }}</span>
                  </td>
                  <td class="px-5 py-3.5">
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ score.toFixed(1) }}%</span>
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :class="progressBarColor(score)"
                        :style="{ width: `${Math.min(score, 100)}%` }"
                      ></div>
                    </div>
                  </td>
                  <td class="px-5 py-3.5">
                    <span
                      class="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                      :class="gradeCircleClass(score)"
                    >
                      {{ scoreToGrade(score) }}
                    </span>
                  </td>
                </tr>
                <tr v-if="Object.keys(student.cumulative_subject_grades).length === 0">
                  <td colspan="4" class="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    {{ t('common.noData') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- Line chart: Quarter Performance -->
          <div class="rounded-xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
            <h3 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">Quarter Performance</h3>
            <VueApexCharts
              type="line"
              height="260"
              :options="lineChartOptions"
              :series="lineChartSeries"
            />
          </div>
          <!-- Radar chart: Subject Performance -->
          <div class="rounded-xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs">
            <h3 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">Subject Performance</h3>
            <VueApexCharts
              v-if="radarChartSeries[0].data.length > 0"
              type="radar"
              height="260"
              :options="radarChartOptions"
              :series="radarChartSeries"
            />
            <div v-else class="flex h-64 items-center justify-center text-sm text-gray-400">
              {{ t('common.noData') }}
            </div>
          </div>
        </div>
      </div>

      <!-- TAB: Psychological States -->
      <div v-show="activeTab === 'psych'" class="space-y-5">
        <!-- Header row -->
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.psychologicalStates') }}</h2>
          <button
            @click="openAddStateModal"
            class="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            <Plus class="h-4 w-4" />
            Add State
          </button>
        </div>

        <!-- States grid -->
        <div v-if="student.psychological_states.current.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="state in student.psychological_states.current"
            :key="state.id"
            class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs overflow-hidden"
            :class="stateBorderClass(state.score)"
            style="border-left-width: 4px"
          >
            <div class="p-4">
              <!-- Name + score -->
              <div class="flex items-start justify-between gap-2">
                <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ state.name }}</h3>
                <div class="flex shrink-0 items-center gap-0.5">
                  <Star
                    v-for="i in 5"
                    :key="i"
                    class="h-3.5 w-3.5"
                    :class="i <= state.score ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'"
                  />
                </div>
              </div>

              <!-- Score label -->
              <span
                class="mt-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="scoreChipClass(state.score)"
              >
                {{ scoreLabel(state.score) }}
              </span>

              <!-- Comment -->
              <blockquote v-if="state.comment" class="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
                <p class="text-xs italic leading-relaxed text-gray-600 dark:text-gray-400">"{{ state.comment }}"</p>
              </blockquote>

              <!-- Footer -->
              <div class="mt-4 flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <User class="h-3.5 w-3.5 text-gray-400" />
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ state.added_by }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Clock class="h-3.5 w-3.5 text-gray-400" />
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(state.time_added) }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                <button
                  @click="openHistoryModal(state.name)"
                  class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
                >
                  <History class="h-3.5 w-3.5" />
                  History
                </button>
                <button
                  @click="deleteState(state.id)"
                  class="flex items-center justify-center rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-500/10 transition-colors"
                  :disabled="deletingStateId === state.id"
                >
                  <Loader2 v-if="deletingStateId === state.id" class="h-3.5 w-3.5 animate-spin" />
                  <Trash2 v-else class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 dark:border-gray-800">
          <Brain class="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('students.noPsychologicalStates') }}</p>
          <button
            @click="openAddStateModal"
            class="mt-4 flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            <Plus class="h-4 w-4" />
            Add First State
          </button>
        </div>
      </div>

      <!-- TAB: Personal Info -->
      <div v-show="activeTab === 'info'">
        <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs overflow-hidden">
          <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('profile.personalInfo') }}</h2>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow :label="t('profile.username')" :value="student.user.username">
              <template #icon><AtSign class="h-4 w-4 text-gray-400" /></template>
            </InfoRow>
            <InfoRow :label="t('profile.email')" :value="student.user.email">
              <template #icon><Mail class="h-4 w-4 text-gray-400" /></template>
            </InfoRow>
            <InfoRow :label="t('profile.firstName')" :value="student.user.first_name">
              <template #icon><UserCircle class="h-4 w-4 text-gray-400" /></template>
            </InfoRow>
            <InfoRow :label="t('profile.lastName')" :value="student.user.last_name">
              <template #icon><UserCircle class="h-4 w-4 text-gray-400" /></template>
            </InfoRow>
            <InfoRow :label="t('profile.dateOfBirth')" :value="student.user.date_of_birth || '—'">
              <template #icon><CalendarDays class="h-4 w-4 text-gray-400" /></template>
            </InfoRow>
            <InfoRow :label="t('profile.phone')" :value="student.user.phone_number || '—'">
              <template #icon><Phone class="h-4 w-4 text-gray-400" /></template>
            </InfoRow>
            <InfoRow :label="t('profile.address')" :value="student.user.address || '—'">
              <template #icon><MapPin class="h-4 w-4 text-gray-400" /></template>
            </InfoRow>
          </div>

          <div class="border-t border-gray-200 px-5 py-4 dark:border-gray-800">
            <h3 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">School Information</h3>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-gray-800">
            <div class="flex items-center gap-4 px-5 py-3.5">
              <div class="flex w-5 shrink-0 justify-center">
                <ShieldCheck class="h-4 w-4 text-gray-400" />
              </div>
              <span class="w-36 shrink-0 text-sm text-gray-500 dark:text-gray-400">{{ t('profile.role') }}</span>
              <span
                class="inline-flex rounded-full bg-brand-50 px-3 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
              >
                {{ student.user.role_display }}
              </span>
            </div>
            <InfoRow :label="t('profile.school')" :value="student.user.school">
              <template #icon><Building2 class="h-4 w-4 text-gray-400" /></template>
            </InfoRow>
            <InfoRow :label="t('students.class')" :value="student.current_class_group?.display_name || '—'">
              <template #icon><GraduationCap class="h-4 w-4 text-gray-400" /></template>
            </InfoRow>
          </div>
        </div>
      </div>
    </div>

    <!-- Add State Modal -->
    <Modal v-if="showAddModal" :fullScreenBackdrop="true" @close="closeAddModal">
      <template #body>
        <div class="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md dark:border-gray-800 dark:bg-gray-900">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Add Psychological State</h3>
            <button
              @click="closeAddModal"
              class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="space-y-4">
            <!-- Template selector -->
            <div v-if="templates.length > 0">
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Use Template
              </label>
              <select
                @change="applyTemplate($event)"
                class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">— Select template —</option>
                <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
              </select>
            </div>

            <!-- Name -->
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                State Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="newState.name"
                type="text"
                placeholder="e.g. Anxious, Motivated..."
                class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>

            <!-- Star rating -->
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Score (1–5) <span class="text-red-500">*</span>
              </label>
              <div class="flex items-center gap-1">
                <button
                  v-for="i in 5"
                  :key="i"
                  type="button"
                  @click="newState.score = i"
                  class="rounded p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    class="h-7 w-7 transition-colors"
                    :class="i <= newState.score ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'"
                  />
                </button>
                <span class="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">{{ scoreLabel(newState.score) }}</span>
              </div>
            </div>

            <!-- Comment -->
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Comment
              </label>
              <textarea
                v-model="newState.comment"
                rows="3"
                placeholder="Optional notes about the student's state..."
                class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              ></textarea>
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button
              @click="closeAddModal"
              class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              @click="submitNewState"
              :disabled="!newState.name || newState.score === 0 || submittingState"
              class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              <Loader2 v-if="submittingState" class="h-4 w-4 animate-spin" />
              {{ t('common.save') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- History Modal -->
    <Modal v-if="showHistoryModal" :fullScreenBackdrop="true" @close="showHistoryModal = false">
      <template #body>
        <div class="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md dark:border-gray-800 dark:bg-gray-900 max-h-[80vh] overflow-y-auto">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
              History: {{ historyStateName }}
            </h3>
            <button
              @click="showHistoryModal = false"
              class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div v-if="historyEntries.length > 0" class="relative">
            <!-- Timeline line -->
            <div class="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"></div>

            <div class="space-y-4">
              <div
                v-for="(entry, idx) in historyEntries"
                :key="idx"
                class="relative flex gap-4"
              >
                <!-- Dot -->
                <div
                  class="relative z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  :class="stateDotClass(entry.score)"
                >
                  {{ entry.score }}
                </div>
                <!-- Content -->
                <div class="flex-1 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                      <Star
                        v-for="i in 5"
                        :key="i"
                        class="h-3 w-3"
                        :class="i <= entry.score ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'"
                      />
                    </div>
                    <span class="text-xs text-gray-400">{{ formatDate(entry.time_added) }}</span>
                  </div>
                  <p v-if="entry.comment" class="mt-2 text-xs italic text-gray-600 dark:text-gray-400">"{{ entry.comment }}"</p>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">by {{ entry.added_by }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="flex flex-col items-center py-10 text-gray-400">
            <History class="mb-2 h-8 w-8" />
            <p class="text-sm">No history available.</p>
          </div>
        </div>
      </template>
    </Modal>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import VueApexCharts from 'vue3-apexcharts'
import {
  ArrowLeft,
  AlertCircle,
  GraduationCap,
  BookOpen,
  BookMarked,
  Brain,
  User,
  Clock,
  Star,
  Plus,
  Trash2,
  History,
  X,
  Loader2,
  AtSign,
  Mail,
  UserCircle,
  CalendarDays,
  Phone,
  MapPin,
  ShieldCheck,
  Building2,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import Modal from '@/components/ui/Modal.vue'
import {
  getStudentDetailApi,
  createPsychologicalStateApi,
  deletePsychologicalStateApi,
  getPsychologicalStateTemplatesApi,
} from '@/api/students'
import type { StudentDetail, PsychologicalState, PsychologicalStateTemplate } from '@/types/student'

// ─── i18n / route ────────────────────────────────────────────────────────────
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// ─── State ───────────────────────────────────────────────────────────────────
const loading = ref(true)
const error = ref<string | null>(null)
const student = ref<StudentDetail | null>(null)
const templates = ref<PsychologicalStateTemplate[]>([])

// ─── Tabs ────────────────────────────────────────────────────────────────────
const activeTab = ref<'subjects' | 'psych' | 'info'>('subjects')
const tabs = [
  { key: 'subjects' as const, label: t('subjects.title'), icon: BookMarked },
  { key: 'psych' as const, label: t('students.psychologicalStates'), icon: Brain },
  { key: 'info' as const, label: t('profile.personalInfo'), icon: User },
]

// ─── Computed helpers ────────────────────────────────────────────────────────
const fullName = computed(() => {
  if (!student.value) return ''
  return `${student.value.user.last_name} ${student.value.user.first_name}`.trim()
})

const initials = computed(() => {
  if (!student.value) return ''
  const f = student.value.user.first_name?.[0] || ''
  const l = student.value.user.last_name?.[0] || ''
  return (l + f).toUpperCase()
})

const schoolGradient = computed(() => {
  const school = student.value?.user.school || ''
  const map: Record<string, string> = {
    nisa: 'from-emerald-500 to-teal-600 border-emerald-200 dark:border-emerald-800',
    muzafar_alimbayev: 'from-indigo-500 to-purple-600 border-indigo-200 dark:border-indigo-800',
    qadam: 'from-brand-500 to-brand-600 border-brand-200 dark:border-brand-800',
  }
  return map[school] || 'from-slate-600 to-slate-700 border-slate-200 dark:border-slate-800'
})

// ─── Grade helpers ───────────────────────────────────────────────────────────
function scoreToGrade(score: number): number {
  if (score > 80) return 5
  if (score > 60) return 4
  if (score > 40) return 3
  return 2
}

function progressBarColor(score: number): string {
  if (score > 80) return 'bg-success-500'
  if (score > 60) return 'bg-warning-500'
  return 'bg-error-500'
}

function gradeCircleClass(score: number): string {
  if (score > 80) return 'bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400'
  if (score > 60) return 'bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
  return 'bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400'
}

function quarterBadgeClass(grade: number | undefined): string {
  if (grade === undefined) return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
  if (grade >= 5) return 'bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400'
  if (grade >= 4) return 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
  if (grade >= 3) return 'bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
  return 'bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400'
}

function quarterLabel(grade: number | undefined): string {
  if (grade === undefined) return '—'
  if (grade >= 5) return 'Excellent'
  if (grade >= 4) return 'Good'
  if (grade >= 3) return 'Average'
  return 'Below avg'
}

// ─── Psychological state helpers ─────────────────────────────────────────────
function stateBorderClass(score: number): string {
  if (score >= 5) return '!border-l-success-400'
  if (score >= 4) return '!border-l-brand-400'
  if (score >= 3) return '!border-l-warning-400'
  return '!border-l-error-400'
}

function stateDotClass(score: number): string {
  if (score >= 5) return 'bg-success-500'
  if (score >= 4) return 'bg-brand-500'
  if (score >= 3) return 'bg-warning-500'
  return 'bg-error-500'
}

function scoreChipClass(score: number): string {
  if (score >= 5) return 'bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400'
  if (score >= 4) return 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
  if (score >= 3) return 'bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
  return 'bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400'
}

function scoreLabel(score: number): string {
  const labels: Record<number, string> = {
    5: 'Excellent',
    4: 'Good',
    3: 'Average',
    2: 'Concerning',
    1: 'Critical',
  }
  return labels[score] || `Score ${score}`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

// ─── Charts ──────────────────────────────────────────────────────────────────
const lineChartSeries = computed(() => {
  if (!student.value) return []
  const data = [1, 2, 3, 4].map((q) => student.value!.total_quarter_grades[String(q)] ?? 0)
  return [{ name: 'Quarter Grade', data }]
})

const lineChartOptions = computed(() => ({
  chart: {
    fontFamily: 'Outfit, sans-serif',
    type: 'line',
    toolbar: { show: false },
    animations: { enabled: true },
  },
  colors: ['#465FFF'],
  stroke: { curve: 'smooth', width: 3 },
  markers: { size: 6, colors: ['#465FFF'], strokeWidth: 2, strokeColors: '#fff' },
  dataLabels: { enabled: false },
  xaxis: {
    categories: ['Q1', 'Q2', 'Q3', 'Q4'],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#9CA3AF', fontSize: '12px' } },
  },
  yaxis: {
    min: 0,
    max: 5,
    tickAmount: 5,
    labels: { style: { colors: '#9CA3AF', fontSize: '12px' } },
  },
  grid: { borderColor: '#E5E7EB', strokeDashArray: 4, yaxis: { lines: { show: true } } },
  tooltip: { theme: 'light', y: { formatter: (v: number) => String(v) } },
}))

const radarChartSeries = computed(() => {
  if (!student.value) return [{ name: 'Score', data: [] }]
  const entries = Object.entries(student.value.cumulative_subject_grades)
  return [{ name: 'Score (%)', data: entries.map(([, v]) => Math.round(v)) }]
})

const radarChartOptions = computed(() => {
  if (!student.value) return {}
  const labels = Object.keys(student.value.cumulative_subject_grades)
  return {
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'radar',
      toolbar: { show: false },
    },
    colors: ['#465FFF'],
    fill: { opacity: 0.2 },
    stroke: { width: 2 },
    markers: { size: 4 },
    xaxis: { categories: labels },
    yaxis: { show: false, min: 0, max: 100 },
    dataLabels: { enabled: false },
    tooltip: { theme: 'light', y: { formatter: (v: number) => `${v}%` } },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: '#E5E7EB',
          fill: { colors: ['transparent'] },
        },
      },
    },
  }
})

// ─── Psychological state CRUD ────────────────────────────────────────────────
const showAddModal = ref(false)
const submittingState = ref(false)
const deletingStateId = ref<number | null>(null)
const newState = ref({ name: '', score: 3, comment: '' })

function openAddStateModal() {
  newState.value = { name: '', score: 3, comment: '' }
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
}

function applyTemplate(e: Event) {
  const id = Number((e.target as HTMLSelectElement).value)
  const tpl = templates.value.find((t) => t.id === id)
  if (!tpl) return
  newState.value.name = tpl.name
  newState.value.comment = tpl.comment
}

async function submitNewState() {
  if (!student.value || !newState.value.name || newState.value.score === 0) return
  submittingState.value = true
  try {
    const { data } = await createPsychologicalStateApi(student.value.id, {
      state_name: newState.value.name,
      score: newState.value.score,
      comment: newState.value.comment,
    })
    student.value.psychological_states.current.unshift(data)
    closeAddModal()
  } catch {
    // silently ignore — in production you'd show a toast
  } finally {
    submittingState.value = false
  }
}

async function deleteState(stateId: number) {
  if (!student.value) return
  deletingStateId.value = stateId
  try {
    await deletePsychologicalStateApi(stateId)
    student.value.psychological_states.current = student.value.psychological_states.current.filter(
      (s) => s.id !== stateId,
    )
  } catch {
    // silently ignore
  } finally {
    deletingStateId.value = null
  }
}

// ─── History modal ───────────────────────────────────────────────────────────
const showHistoryModal = ref(false)
const historyStateName = ref('')
const historyEntries = ref<PsychologicalState[]>([])

function openHistoryModal(stateName: string) {
  historyStateName.value = stateName
  historyEntries.value = student.value?.psychological_states.history[stateName] ?? []
  showHistoryModal.value = true
}

// ─── Fetch ───────────────────────────────────────────────────────────────────
async function fetchStudent() {
  const userId = Number(route.params.userId)
  if (!userId) {
    error.value = 'Invalid student ID.'
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  try {
    const [studentRes, templatesRes] = await Promise.all([
      getStudentDetailApi(userId),
      getPsychologicalStateTemplatesApi(),
    ])
    student.value = studentRes.data
    templates.value = templatesRes.data
  } catch (err: any) {
    if (err?.response?.status === 404) {
      error.value = 'Student not found.'
    } else {
      error.value = 'Failed to load student data.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchStudent)

// ─── InfoRow inline component ─────────────────────────────────────────────────
const InfoRow = defineComponent({
  name: 'InfoRow',
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  setup(props, { slots }) {
    return () =>
      h('div', { class: 'flex items-center gap-4 px-5 py-3.5' }, [
        h('div', { class: 'flex w-5 shrink-0 justify-center' }, [slots.icon?.()]),
        h('span', { class: 'w-36 shrink-0 text-sm text-gray-500 dark:text-gray-400' }, props.label),
        h('span', { class: 'text-sm font-medium text-gray-800 dark:text-white/90' }, props.value || '—'),
      ])
  },
})
</script>
