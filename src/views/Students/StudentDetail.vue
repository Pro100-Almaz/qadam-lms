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
      <Breadcrumb backTo="/students" :crumbs="[{ label: t('students.title'), to: '/students' }]" />
    </div>

    <!-- Content -->
    <div v-else-if="student" class="space-y-6">
      <!-- Back button -->
      <Breadcrumb backTo="/students" :crumbs="[{ label: t('students.title'), to: '/students' }, { label: fullName }]" />

      <!-- Profile Header Card -->
      <div
        class="relative overflow-hidden rounded-xl border shadow-theme-md"
        :class="schoolGradientStyle ? 'border-white/10' : 'bg-gradient-to-r from-slate-600 to-slate-700 border-slate-200 dark:border-slate-800'"
        :style="schoolGradientStyle || {}"
      >
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
            <div v-if="schoolGroup" class="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-white/15 px-5 pt-3 pb-3 backdrop-blur-sm">
              <img v-if="schoolGroup.avatar" :src="schoolGroup.avatar" :alt="schoolGroup.name" class="h-16 w-16 rounded-xl object-cover mb-1" />
              <span class="font-extrabold uppercase tracking-widest text-white">{{ schoolGroup.name }}</span>
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
        <nav class="-mb-px flex gap-1 overflow-scroll no-scrollbar">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="!tab.disabled && (activeTab = tab.key)"
            :disabled="tab.disabled"
            class="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors"
            :class="
              tab.disabled
                ? 'border-transparent text-gray-300 cursor-not-allowed dark:text-gray-600'
                : activeTab === tab.key
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
                    {{ t('students.score') }}
                  </th>
                  <th class="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 w-40">
                    {{ t('subjects.completion') }}
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
              height="300"
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
              height="300"
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
            v-if="isAdmin"
            @click="openAddStateModal"
            class="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            <Plus class="h-4 w-4" />
            {{ t('students.addState') }}
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
                  {{ t('students.history') }}
                </button>
                <button
                  v-if="isAdmin"
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
            v-if="isAdmin"
            @click="openAddStateModal"
            class="mt-4 flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            <Plus class="h-4 w-4" />
            {{ t('students.addFirstState') }}
          </button>
        </div>
      </div>

      <!-- TAB: Clubs -->
      <div v-show="activeTab === 'clubs'" class="space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.clubs') }}</h2>
          <button
            v-if="isAdmin"
            @click="openAddClubModal"
            class="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            <Plus class="h-4 w-4" />
            {{ t('students.addClubEntry') }}
          </button>
        </div>

        <div v-if="loadingClubs" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</div>

        <div v-else-if="clubEntries.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="club in clubEntries"
            :key="club.id"
            class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ club.club_name }}</h3>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ monthNames[club.month - 1] }} · {{ club.academic_year }}
                </p>
              </div>
              <button
                v-if="isAdmin"
                @click="removeClubEntry(club.id)"
                class="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>

            <!-- Attendance bar -->
            <div class="mt-3">
              <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{{ t('students.attendance') }}</span>
                <span class="font-medium">{{ club.attended_sessions }}/{{ club.total_sessions }}</span>
              </div>
              <div class="mt-1 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  class="h-full rounded-full bg-brand-500 transition-all"
                  :style="{ width: club.total_sessions ? (club.attended_sessions / club.total_sessions * 100) + '%' : '0%' }"
                ></div>
              </div>
            </div>

            <div v-if="club.plan" class="mt-3">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('students.plan') }}</p>
              <p class="mt-0.5 text-xs text-gray-700 dark:text-gray-300">{{ club.plan }}</p>
            </div>

            <div v-if="club.criteria" class="mt-2">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('students.criteria') }}</p>
              <p class="mt-0.5 text-xs text-gray-700 dark:text-gray-300">{{ club.criteria }}</p>
            </div>

            <div v-if="club.comments" class="mt-2 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800/60">
              <p class="text-xs italic text-gray-600 dark:text-gray-400">"{{ club.comments }}"</p>
            </div>

            <!-- Attachments -->
            <div v-if="club.attachments?.length" class="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
              <p class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('students.attachments') }}</p>
              <div class="flex flex-wrap gap-2">
                <template v-for="att in club.attachments" :key="att.id">
                  <div v-if="isImageFile(att)" class="group/att relative">
                    <button type="button" @click="previewAttachment = att" class="block h-16 w-16 overflow-hidden rounded-lg border border-gray-200 hover:opacity-80 dark:border-gray-700 transition-opacity">
                      <img :src="att.file" :alt="att.original_name" class="h-full w-full object-cover" />
                    </button>
                    <button v-if="isAdmin" @click="removeAttachment(att.id, 'clubentry')" class="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow-sm opacity-0 group-hover/att:opacity-100 hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-500/10 transition-opacity">
                      <Trash2 class="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                  <div v-else class="group/att flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 dark:border-gray-700 dark:bg-gray-800/50">
                    <FileText class="h-3.5 w-3.5 text-gray-400" />
                    <button @click="previewAttachment = att" class="max-w-[100px] truncate text-xs text-brand-500 hover:underline">{{ att.original_name }}</button>
                    <button v-if="isAdmin" @click="removeAttachment(att.id, 'clubentry')" class="rounded p-0.5 hover:bg-red-50 dark:hover:bg-red-500/10">
                      <Trash2 class="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 dark:border-gray-800">
          <Puzzle class="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('students.noClubEntries') }}</p>
          <button
            v-if="isAdmin"
            @click="openAddClubModal"
            class="mt-4 flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            <Plus class="h-4 w-4" />
            {{ t('students.addClubEntry') }}
          </button>
        </div>
      </div>

      <!-- TAB: Rating / Achievements -->
      <div v-show="activeTab === 'rating'" class="space-y-8">
        <!-- Achievements -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.achievements') }}</h2>
            <button
              v-if="isAdmin"
              @click="openAddAchievementModal"
              class="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              <Plus class="h-4 w-4" />
              {{ t('students.addAchievement') }}
            </button>
          </div>

          <div v-if="loadingAchievements" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</div>

          <div v-else-if="achievements.length > 0" class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs overflow-hidden">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-800">
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('students.category') }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('common.description') }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('students.awardType') }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('students.place') }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('students.attachments') }}</th>
                  <th class="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="ach in achievements"
                  :key="ach.id"
                  class="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td class="px-5 py-3">
                    <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                      :class="{
                        'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400': ach.category === 'olympiad',
                        'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400': ach.category === 'additional_education',
                        'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400': ach.category === 'extracurricular',
                        'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400': ach.category === 'project',
                      }"
                    >
                      {{ t(categoryLabels[ach.category]) }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {{ ach.description || '—' }}
                    <span v-if="ach.subject_name" class="ml-1 text-xs text-gray-400">({{ ach.subject_name }})</span>
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{{ ach.award_type || '—' }}</td>
                  <td class="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{{ ach.place || '—' }}</td>
                  <td class="px-5 py-3">
                    <div v-if="ach.attachments?.length" class="flex flex-wrap gap-1.5">
                      <template v-for="att in ach.attachments" :key="att.id">
                        <div v-if="isImageFile(att)" class="group/att relative">
                          <button type="button" @click="previewAttachment = att" class="block h-10 w-10 overflow-hidden rounded border border-gray-200 hover:opacity-80 dark:border-gray-700 transition-opacity">
                            <img :src="att.file" :alt="att.original_name" class="h-full w-full object-cover" />
                          </button>
                          <button v-if="isAdmin" @click="removeAttachment(att.id, 'achievement')" class="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow-sm opacity-0 group-hover/att:opacity-100 hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-500/10 transition-opacity">
                            <Trash2 class="h-2.5 w-2.5 text-red-500" />
                          </button>
                        </div>
                        <div v-else class="group/att flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-800/50">
                          <FileText class="h-3 w-3 text-gray-400" />
                          <button @click="previewAttachment = att" class="max-w-[60px] truncate text-xs text-brand-500 hover:underline">{{ att.original_name }}</button>
                          <button v-if="isAdmin" @click="removeAttachment(att.id, 'achievement')" class="rounded p-0.5 opacity-0 group-hover/att:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10 transition-opacity">
                            <Trash2 class="h-2.5 w-2.5 text-red-500" />
                          </button>
                        </div>
                      </template>
                    </div>
                    <span v-else class="text-xs text-gray-400">—</span>
                  </td>
                  <td class="px-5 py-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        v-if="ach.certificate"
                        @click="downloadCertificate(ach.id)"
                        class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/5 transition-colors"
                        :title="t('students.download')"
                      >
                        <Download class="h-4 w-4" />
                      </button>
                      <button
                        v-if="isAdmin"
                        @click="removeAchievement(ach.id)"
                        class="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12 dark:border-gray-800">
            <Award class="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('students.noAchievements') }}</p>
          </div>
        </div>

        <!-- Reading List -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.readingList') }}</h2>
            <button
              v-if="isAdmin"
              @click="openAddReadingModal"
              class="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              <Plus class="h-4 w-4" />
              {{ t('students.addReadingEntry') }}
            </button>
          </div>

          <div v-if="loadingReading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</div>

          <div v-else-if="readingEntries.length > 0" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div
              v-for="entry in readingEntries"
              :key="entry.id"
              class="group rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-theme-xs overflow-hidden"
            >
              <div v-if="entry.cover" class="h-32 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img :src="entry.cover" :alt="entry.title" class="h-full w-full object-cover" />
              </div>
              <div v-else class="flex h-32 w-full items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                <BookText class="h-10 w-10 text-gray-300 dark:text-gray-600" />
              </div>
              <div class="p-4">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90 line-clamp-2">{{ entry.title }}</h3>
                  <button
                    v-if="isAdmin"
                    @click="removeReadingEntry(entry.id)"
                    class="shrink-0 rounded-lg p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ monthNames[entry.month - 1] }} · {{ entry.academic_year }}</p>
                <div class="mt-3 flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <span class="flex items-center gap-1">
                    <FileText class="h-3.5 w-3.5" />
                    {{ entry.pages_read }} {{ t('students.pagesRead').toLowerCase() }}
                  </span>
                  <span v-if="entry.test_score !== null" class="flex items-center gap-1">
                    <Star class="h-3.5 w-3.5" />
                    {{ entry.test_score }}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12 dark:border-gray-800">
            <BookText class="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('students.noReadingEntries') }}</p>
          </div>
        </div>
      </div>

      <!-- TAB: AI Reports -->
      <div v-show="activeTab === 'reports'" class="space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('reports.aiReports') }}</h2>
          <button
            v-if="canGenerateReport"
            @click="showReportModal = true"
            class="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            <Sparkles class="h-4 w-4" />
            {{ t('reports.generate') }}
          </button>
        </div>

        <ReportHistoryList ref="reportHistoryRef" :student-id="studentPk" />
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
            <h3 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{{ t('students.schoolInformation') }}</h3>
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
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.addState') }}</h3>
            <button
              @click="closeAddModal"
              class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="space-y-4">
            <!-- Template selector -->
            <div v-if="templates?.length > 0">
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                {{ t('students.useTemplate') }}
              </label>
              <select
                @change="applyTemplate($event)"
                class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">{{ t('students.selectTemplate') }}</option>
                <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
              </select>
            </div>

            <!-- Name -->
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                {{ t('students.stateName') }} <span class="text-red-500">*</span>
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
                {{ t('students.scoreRange') }} <span class="text-red-500">*</span>
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
                {{ t('students.comment') }}
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

    <!-- Add Achievement Modal -->
    <Modal v-if="showAddAchievementModal" :fullScreenBackdrop="true" @close="showAddAchievementModal = false">
      <template #body>
        <div class="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md dark:border-gray-800 dark:bg-gray-900">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.addAchievement') }}</h3>
            <button @click="showAddAchievementModal = false" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"><X class="h-5 w-5" /></button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.category') }} <span class="text-red-500">*</span></label>
              <select v-model="newAchievement.category" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                <option value="olympiad">{{ t('students.olympiad') }}</option>
                <option value="additional_education">{{ t('students.additionalEducation') }}</option>
                <option value="extracurricular">{{ t('students.extracurricular') }}</option>
                <option value="project">{{ t('students.project') }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('academicYears.title') }} <span class="text-red-500">*</span></label>
              <select v-model="newAchievement.academic_year" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.year }}</option>
              </select>
            </div>
            <div v-if="newAchievement.category !== 'extracurricular'">
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.awardType') }}</label>
              <input v-model="newAchievement.award_type" type="text" placeholder="e.g. Gold Medal" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
            </div>
            <div v-if="newAchievement.category !== 'extracurricular'">
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.place') }}</label>
              <input v-model="newAchievement.place" type="text" placeholder="e.g. National, Regional" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
            </div>
            <div v-if="newAchievement.category === 'extracurricular'">
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.role') }} <span class="text-red-500">*</span></label>
              <input v-model="newAchievement.role" type="text" placeholder="e.g. Club President" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
            </div>
            <div v-if="newAchievement.category === 'extracurricular'">
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.duration') }}</label>
              <input v-model="newAchievement.duration" type="text" placeholder="e.g. Sep 2025 – May 2026" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('common.description') }}</label>
              <textarea v-model="newAchievement.description" rows="3" placeholder="Describe the achievement..." class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"></textarea>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.attachments') }}</label>
              <div
                @click="achievementFileInput?.click()"
                class="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-500 hover:border-brand-400 hover:bg-brand-50/50 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/5 transition-colors"
              >
                <Paperclip class="h-4 w-4" />
                <span>{{ achievementFiles.length > 0 ? `${achievementFiles.length} file(s) selected` : t('students.attachFiles') }}</span>
              </div>
              <input ref="achievementFileInput" type="file" multiple accept="image/*,.pdf,.doc,.docx" class="hidden" @change="onAchievementFileChange" />
              <div v-if="achievementFiles.length > 0" class="mt-2 flex flex-wrap gap-1.5">
                <span v-for="(f, idx) in achievementFiles" :key="idx" class="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  {{ f.name }}
                </span>
              </div>
            </div>
          </div>
          <div class="mt-6 flex gap-3">
            <button @click="showAddAchievementModal = false; achievementFiles = []" class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5">{{ t('common.cancel') }}</button>
            <button @click="submitAchievement" :disabled="!newAchievement.academic_year || savingAchievement" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
              <Loader2 v-if="savingAchievement" class="h-4 w-4 animate-spin" />
              {{ t('common.save') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Add Club Entry Modal -->
    <Modal v-if="showAddClubModal" :fullScreenBackdrop="true" @close="showAddClubModal = false">
      <template #body>
        <div class="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md dark:border-gray-800 dark:bg-gray-900">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.addClubEntry') }}</h3>
            <button @click="showAddClubModal = false" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"><X class="h-5 w-5" /></button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.clubName') }} <span class="text-red-500">*</span></label>
              <input v-model="newClub.club_name" type="text" placeholder="e.g. Chess Club" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('academicYears.title') }} <span class="text-red-500">*</span></label>
                <select v-model="newClub.academic_year" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                  <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.year }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.month') }} <span class="text-red-500">*</span></label>
                <select v-model="newClub.month" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                  <option v-for="(name, idx) in monthNames" :key="idx" :value="idx + 1">{{ name }}</option>
                </select>
              </div>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.plan') }}</label>
              <textarea v-model="newClub.plan" rows="2" class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"></textarea>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.criteria') }}</label>
              <input v-model="newClub.criteria" type="text" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.totalSessions') }}</label>
                <input v-model.number="newClub.total_sessions" type="number" min="0" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.attendedSessions') }}</label>
                <input v-model.number="newClub.attended_sessions" type="number" min="0" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
              </div>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.comments') }}</label>
              <textarea v-model="newClub.comments" rows="2" class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"></textarea>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.attachments') }}</label>
              <div
                @click="clubFileInput?.click()"
                class="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-500 hover:border-brand-400 hover:bg-brand-50/50 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/5 transition-colors"
              >
                <Paperclip class="h-4 w-4" />
                <span>{{ clubFiles.length > 0 ? `${clubFiles.length} file(s) selected` : t('students.attachFiles') }}</span>
              </div>
              <input ref="clubFileInput" type="file" multiple accept="image/*,.pdf,.doc,.docx" class="hidden" @change="onClubFileChange" />
              <div v-if="clubFiles.length > 0" class="mt-2 flex flex-wrap gap-1.5">
                <span v-for="(f, idx) in clubFiles" :key="idx" class="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  {{ f.name }}
                </span>
              </div>
            </div>
          </div>
          <div class="mt-6 flex gap-3">
            <button @click="showAddClubModal = false; clubFiles = []" class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5">{{ t('common.cancel') }}</button>
            <button @click="submitClubEntry" :disabled="!newClub.club_name || !newClub.academic_year || savingClub" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
              <Loader2 v-if="savingClub" class="h-4 w-4 animate-spin" />
              {{ t('common.save') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Add Reading Entry Modal -->
    <Modal v-if="showAddReadingModal" :fullScreenBackdrop="true" @close="showAddReadingModal = false">
      <template #body>
        <div class="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md dark:border-gray-800 dark:bg-gray-900">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.addReadingEntry') }}</h3>
            <button @click="showAddReadingModal = false" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"><X class="h-5 w-5" /></button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.bookTitle') }} <span class="text-red-500">*</span></label>
              <input v-model="newReading.title" type="text" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('academicYears.title') }} <span class="text-red-500">*</span></label>
                <select v-model="newReading.academic_year" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                  <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.year }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.month') }} <span class="text-red-500">*</span></label>
                <select v-model="newReading.month" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                  <option v-for="(name, idx) in monthNames" :key="idx" :value="idx + 1">{{ name }}</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.pagesRead') }}</label>
                <input v-model.number="newReading.pages_read" type="number" min="0" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.testScore') }}</label>
                <input v-model.number="newReading.test_score" type="number" min="0" max="100" placeholder="0-100" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
              </div>
            </div>
          </div>
          <div class="mt-6 flex gap-3">
            <button @click="showAddReadingModal = false" class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5">{{ t('common.cancel') }}</button>
            <button @click="submitReadingEntry" :disabled="!newReading.title || !newReading.academic_year || savingReading" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
              <Loader2 v-if="savingReading" class="h-4 w-4 animate-spin" />
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
              {{ t('students.history') }}: {{ historyStateName }}
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
            <p class="text-sm">{{ t('students.noHistory') }}</p>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Generate Report Modal -->
    <GenerateReportModal
      v-if="showReportModal"
      :student-id="studentPk"
      :student-name="fullName"
      :class-group="student?.current_class_group?.display_name || '—'"
      :current-quarter="currentQuarter"
      @close="showReportModal = false"
      @generated="onReportGenerated"
    />

    <DocumentPreviewModal :attachment="previewAttachment" @close="previewAttachment = null" />
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
  Trophy,
  Puzzle,
  Award,
  BookText,
  Download,
  Calendar,
  FileText,
  Paperclip,
  Eye,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import Breadcrumb from '@/components/ui/Breadcrumb.vue'
import Modal from '@/components/ui/Modal.vue'
import DocumentPreviewModal from '@/components/ui/DocumentPreviewModal.vue'
import {
  getStudentDetailApi,
  createPsychologicalStateApi,
  deletePsychologicalStateApi,
  getPsychologicalStateTemplatesApi,
} from '@/api/students'
import type { StudentDetail, PsychologicalState, PsychologicalStateTemplate } from '@/types/student'
import {
  getAchievementsApi,
  createAchievementApi,
  deleteAchievementApi,
  downloadAchievementCertificateApi,
  getReadingEntriesApi,
  createReadingEntryApi,
  deleteReadingEntryApi,
  getClubEntriesApi,
  createClubEntryApi,
  deleteClubEntryApi,
  uploadAttachmentsApi,
  deleteAttachmentApi,
} from '@/api/achievements'
import { getAcademicYearsApi } from '@/api/academic'
import type { Achievement, ReadingEntry, ClubEntry, AchievementCategory, Attachment } from '@/types/achievement'
import type { AcademicYear } from '@/types/academic'
import { getSchoolGroupApi, type SchoolGroup } from '@/api/auth'
import { useAuth } from '@/composables/useAuth'
import GenerateReportModal from '@/components/reports/GenerateReportModal.vue'
import ReportHistoryList from '@/components/reports/ReportHistoryList.vue'
import type { StudentReport } from '@/types/report'

// ─── i18n / route ────────────────────────────────────────────────────────────
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { user: authUser } = useAuth()
const isAdmin = computed(() =>
  ['admin', 'supervisor', 'teacher', 'homeroom_teacher', 'principal'].includes(authUser.value?.role || ''),
)

const canGenerateReport = computed(() =>
  ['admin', 'supervisor', 'teacher', 'homeroom_teacher', 'principal'].includes(authUser.value?.role || ''),
)

const showReportModal = ref(false)
const reportHistoryRef = ref<InstanceType<typeof ReportHistoryList> | null>(null)
const currentQuarter = ref(1)

function onReportGenerated(_report: StudentReport) {
  showReportModal.value = false
  reportHistoryRef.value?.refresh()
}

// ─── State ───────────────────────────────────────────────────────────────────
const loading = ref(true)
const error = ref<string | null>(null)
const student = ref<StudentDetail | null>(null)
const templates = ref<PsychologicalStateTemplate[]>([])

// ─── Tabs ────────────────────────────────────────────────────────────────────
const activeTab = ref<'subjects' | 'clubs' | 'psych' | 'rating' | 'reports' | 'info'>('subjects')
const tabs = computed(() => [
  { key: 'subjects' as const, label: t('subjects.title'), icon: BookMarked, disabled: false },
  { key: 'clubs' as const, label: t('students.clubs'), icon: Puzzle, disabled: false },
  { key: 'psych' as const, label: t('students.psychologicalStates'), icon: Brain, disabled: false },
  { key: 'rating' as const, label: t('students.rating'), icon: Trophy, disabled: false },
  { key: 'reports' as const, label: t('reports.aiReports'), icon: Sparkles, disabled: false },
  { key: 'info' as const, label: t('profile.personalInfo'), icon: User, disabled: false },
])

// ─── Achievements / Clubs / Reading ─────────────────────────────────────────
const achievements = ref<Achievement[]>([])
const readingEntries = ref<ReadingEntry[]>([])
const clubEntries = ref<ClubEntry[]>([])
const academicYears = ref<AcademicYear[]>([])
const loadingAchievements = ref(false)
const loadingClubs = ref(false)
const loadingReading = ref(false)

const showAddAchievementModal = ref(false)
const showAddClubModal = ref(false)
const showAddReadingModal = ref(false)
const savingAchievement = ref(false)
const savingClub = ref(false)
const savingReading = ref(false)

const categoryLabels: Record<AchievementCategory, string> = {
  olympiad: 'students.olympiad',
  additional_education: 'students.additionalEducation',
  extracurricular: 'students.extracurricular',
  project: 'students.project',
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const newAchievement = ref({
  academic_year: null as number | null,
  category: 'olympiad' as AchievementCategory,
  award_type: '',
  place: '',
  role: '',
  duration: '',
  description: '',
})

const newClub = ref({
  academic_year: null as number | null,
  month: new Date().getMonth() + 1,
  club_name: '',
  plan: '',
  criteria: '',
  total_sessions: 0,
  attended_sessions: 0,
  comments: '',
})

const newReading = ref({
  academic_year: null as number | null,
  title: '',
  month: new Date().getMonth() + 1,
  pages_read: 0,
  test_score: null as number | null,
})

const achievementFiles = ref<File[]>([])
const clubFiles = ref<File[]>([])
const achievementFileInput = ref<HTMLInputElement | null>(null)
const clubFileInput = ref<HTMLInputElement | null>(null)

const previewAttachment = ref<Attachment | null>(null)

function isImageFile(attachment: Attachment): boolean {
  return attachment.file_type.startsWith('image/')
}

function onAchievementFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) achievementFiles.value = Array.from(input.files)
}

function onClubFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) clubFiles.value = Array.from(input.files)
}

function downloadAttachment(attachment: Attachment) {
  const a = document.createElement('a')
  a.href = attachment.file
  a.download = attachment.original_name
  a.target = '_blank'
  a.click()
}

async function removeAttachment(attachmentId: number, entryType: 'achievement' | 'clubentry') {
  if (!confirm(t('students.confirmDeleteAttachment'))) return
  try {
    await deleteAttachmentApi(attachmentId)
    if (entryType === 'achievement') {
      achievements.value = achievements.value.map(a => ({
        ...a,
        attachments: (a.attachments || []).filter(att => att.id !== attachmentId),
      }))
    } else {
      clubEntries.value = clubEntries.value.map(c => ({
        ...c,
        attachments: (c.attachments || []).filter(att => att.id !== attachmentId),
      }))
    }
  } catch { /* silent */ }
}

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

const schoolGroup = ref<SchoolGroup | null>(null)

const schoolGradientStyle = computed(() => {
  const color = schoolGroup.value?.color
  if (!color) return null
  return {
    background: `linear-gradient(135deg, ${color}, ${adjustColor(color, -40)})`,
    borderColor: `${color}33`,
  }
})

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xFF) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + amount))
  const b = Math.max(0, Math.min(255, (num & 0xFF) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

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
  if (grade >= 5) return t('students.excellent')
  if (grade >= 4) return t('students.good')
  if (grade >= 3) return t('students.average')
  return t('students.belowAvg')
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
  const keys: Record<number, string> = {
    5: 'students.excellent',
    4: 'students.good',
    3: 'students.average',
    2: 'students.concerning',
    1: 'students.critical',
  }
  return keys[score] ? t(keys[score]) : `${t('students.score')} ${score}`
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
  return [{ name: t('students.quarterGrade'), data }]
})

const lineChartOptions = computed(() => ({
  chart: {
    fontFamily: 'Outfit, sans-serif',
    type: 'line',
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, easing: 'easeinout', speed: 600 },
  },
  colors: ['#465FFF'],
  stroke: { curve: 'smooth', width: 3 },
  markers: {
    size: 7,
    colors: ['#465FFF'],
    strokeWidth: 3,
    strokeColors: '#fff',
    hover: { sizeOffset: 3 },
  },
  dataLabels: {
    enabled: true,
    offsetY: -10,
    style: { fontSize: '13px', fontWeight: 600, colors: ['#465FFF'] },
    background: { enabled: false },
  },
  xaxis: {
    categories: ['Q1', 'Q2', 'Q3', 'Q4'],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#9CA3AF', fontSize: '13px', fontWeight: 500 } },
  },
  yaxis: {
    min: 0,
    max: 5,
    tickAmount: 5,
    labels: {
      style: { colors: '#9CA3AF', fontSize: '12px' },
      formatter: (v: number) => v.toFixed(1),
    },
  },
  grid: {
    borderColor: '#E5E7EB',
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
    padding: { top: 10, bottom: 5 },
  },
  tooltip: {
    theme: 'light',
    y: { formatter: (v: number) => `${v.toFixed(2)} / 5.00` },
  },
}))

const radarChartSeries = computed(() => {
  if (!student.value) return [{ name: t('students.score'), data: [] }]
  const entries = Object.entries(student.value.cumulative_subject_grades)
  return [{ name: t('students.scorePercent'), data: entries.map(([, v]) => Math.round(v)) }]
})

const radarChartOptions = computed(() => {
  if (!student.value) return {}
  const labels = Object.keys(student.value.cumulative_subject_grades)
  return {
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'radar',
      toolbar: { show: false },
      dropShadow: { enabled: true, blur: 4, left: 1, top: 1, opacity: 0.1 },
    },
    colors: ['#465FFF'],
    fill: { opacity: 0.15, type: 'solid' },
    stroke: { width: 2.5 },
    markers: {
      size: 5,
      colors: ['#465FFF'],
      strokeWidth: 2,
      strokeColors: '#fff',
      hover: { sizeOffset: 2 },
    },
    xaxis: {
      categories: labels,
      labels: {
        style: { fontSize: '12px', fontWeight: 500, colors: Array(labels.length).fill('#6B7280') },
      },
    },
    yaxis: {
      show: true,
      min: 0,
      max: 100,
      tickAmount: 4,
      labels: {
        style: { fontSize: '10px', colors: ['#9CA3AF'] },
        formatter: (v: number) => `${v}%`,
      },
    },
    dataLabels: {
      enabled: true,
      style: { fontSize: '11px', fontWeight: 600, colors: ['#465FFF'] },
      background: { enabled: true, borderRadius: 2, padding: 3, borderColor: 'transparent', foreColor: '#465FFF', dropShadow: { enabled: false } },
      formatter: (v: number) => `${v}%`,
    },
    tooltip: {
      theme: 'light',
      y: { formatter: (v: number) => `${v}%` },
    },
    plotOptions: {
      radar: {
        size: undefined,
        polygons: {
          strokeColors: '#E5E7EB',
          connectorColors: '#E5E7EB',
          fill: { colors: ['#F9FAFB', 'transparent'] },
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

// ─── Achievements CRUD ──────────────────────────────────────────────────────
const studentPk = computed(() => student.value?.id ?? 0)

async function fetchAchievements() {
  if (!studentPk.value) return
  loadingAchievements.value = true
  try {
    const { data } = await getAchievementsApi(studentPk.value)
    achievements.value = data
  } catch { achievements.value = [] }
  finally { loadingAchievements.value = false }
}

async function fetchAcademicYears() {
  if (academicYears.value?.length) return
  try {
    const res = await getAcademicYearsApi()
    academicYears.value = res.data
    const active = academicYears.value.find(y => y.is_active)
    if (active) {
      newAchievement.value.academic_year = active.id
      newClub.value.academic_year = active.id
      newReading.value.academic_year = active.id
      if (active.current_quarter) currentQuarter.value = active.current_quarter
    }
  } catch { /* silent */ }
}

async function openAddAchievementModal() {
  await fetchAcademicYears()
  const activeYear = (academicYears.value || []).find(y => y.is_active)
  newAchievement.value = { academic_year: activeYear?.id ?? null, category: 'olympiad', award_type: '', place: '', role: '', duration: '', description: '' }
  showAddAchievementModal.value = true
}

async function submitAchievement() {
  if (!studentPk.value || !newAchievement.value.academic_year) return
  savingAchievement.value = true
  try {
    const res = await createAchievementApi(studentPk.value, {
      academic_year: newAchievement.value.academic_year,
      category: newAchievement.value.category,
      award_type: newAchievement.value.award_type || undefined,
      place: newAchievement.value.place || undefined,
      role: newAchievement.value.role || undefined,
      duration: newAchievement.value.duration || undefined,
      description: newAchievement.value.description || undefined,
    })
    let created = { ...res.data, attachments: res.data.attachments || [] }
    if (achievementFiles.value.length > 0) {
      try {
        const attRes = await uploadAttachmentsApi('achievement', created.id, achievementFiles.value)
        created.attachments = attRes.data
      } catch { /* silent */ }
    }
    achievements.value.unshift(created)
    achievementFiles.value = []
    showAddAchievementModal.value = false
  } catch (e) { console.error('Failed to create achievement:', e) }
  finally { savingAchievement.value = false }
}

async function removeAchievement(id: number) {
  if (!confirm(t('students.confirmDeleteAchievement'))) return
  try {
    await deleteAchievementApi(id)
    achievements.value = achievements.value.filter(a => a.id !== id)
  } catch { /* silent */ }
}

async function downloadCertificate(id: number) {
  try {
    const { data, headers } = await downloadAchievementCertificateApi(id)
    const disposition = headers['content-disposition'] || ''
    const match = disposition.match(/filename="?(.+?)"?$/)
    const filename = match?.[1] || 'certificate'
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  } catch { /* silent */ }
}

// ─── Club Entries CRUD ──────────────────────────────────────────────────────
async function fetchClubEntries() {
  if (!studentPk.value) return
  loadingClubs.value = true
  try {
    const { data } = await getClubEntriesApi(studentPk.value)
    clubEntries.value = data
  } catch { clubEntries.value = [] }
  finally { loadingClubs.value = false }
}

async function openAddClubModal() {
  await fetchAcademicYears()
  const activeYear = (academicYears.value || []).find(y => y.is_active)
  newClub.value = { academic_year: activeYear?.id ?? null, month: new Date().getMonth() + 1, club_name: '', plan: '', criteria: '', total_sessions: 0, attended_sessions: 0, comments: '' }
  showAddClubModal.value = true
}

async function submitClubEntry() {
  if (!studentPk.value || !newClub.value.academic_year || !newClub.value.club_name) return
  savingClub.value = true
  try {
    const res = await createClubEntryApi(studentPk.value, {
      academic_year: newClub.value.academic_year,
      month: newClub.value.month,
      club_name: newClub.value.club_name,
      plan: newClub.value.plan || undefined,
      criteria: newClub.value.criteria || undefined,
      total_sessions: newClub.value.total_sessions,
      attended_sessions: newClub.value.attended_sessions,
      comments: newClub.value.comments || undefined,
    })
    let created = { ...res.data, attachments: res.data.attachments || [] }
    if (clubFiles.value.length > 0) {
      try {
        const attRes = await uploadAttachmentsApi('clubentry', created.id, clubFiles.value)
        created.attachments = attRes.data
      } catch { /* silent */ }
    }
    clubEntries.value.unshift(created)
    clubFiles.value = []
    showAddClubModal.value = false
  } catch (e) { console.error('Failed to create club entry:', e) }
  finally { savingClub.value = false }
}

async function removeClubEntry(id: number) {
  if (!confirm(t('students.confirmDeleteClubEntry'))) return
  try {
    await deleteClubEntryApi(id)
    clubEntries.value = clubEntries.value.filter(c => c.id !== id)
  } catch { /* silent */ }
}

// ─── Reading Entries CRUD ───────────────────────────────────────────────────
async function fetchReadingEntries() {
  if (!studentPk.value) return
  loadingReading.value = true
  try {
    const { data } = await getReadingEntriesApi(studentPk.value)
    readingEntries.value = data
  } catch { readingEntries.value = [] }
  finally { loadingReading.value = false }
}

async function openAddReadingModal() {
  await fetchAcademicYears()
  const activeYear = (academicYears.value || []).find(y => y.is_active)
  newReading.value = { academic_year: activeYear?.id ?? null, title: '', month: new Date().getMonth() + 1, pages_read: 0, test_score: null }
  showAddReadingModal.value = true
}

async function submitReadingEntry() {
  if (!studentPk.value || !newReading.value.academic_year || !newReading.value.title) return
  savingReading.value = true
  try {
    const res = await createReadingEntryApi(studentPk.value, {
      academic_year: newReading.value.academic_year,
      title: newReading.value.title,
      month: newReading.value.month,
      pages_read: newReading.value.pages_read,
      test_score: newReading.value.test_score,
    })
    readingEntries.value.unshift(res.data)
    showAddReadingModal.value = false
  } catch (e) { console.error('Failed to create reading entry:', e) }
  finally { savingReading.value = false }
}

async function removeReadingEntry(id: number) {
  if (!confirm(t('students.confirmDeleteReadingEntry'))) return
  try {
    await deleteReadingEntryApi(id)
    readingEntries.value = readingEntries.value.filter(r => r.id !== id)
  } catch { /* silent */ }
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
    const [studentRes, templatesRes, yearsRes] = await Promise.all([
      getStudentDetailApi(userId),
      getPsychologicalStateTemplatesApi(),
      getAcademicYearsApi(),
    ])
    student.value = studentRes.data
    templates.value = templatesRes.data
    academicYears.value = yearsRes.data
    // Fetch school group and tab data in parallel
    const fetches: Promise<any>[] = [fetchAchievements(), fetchClubEntries(), fetchReadingEntries()]
    if (student.value.school_group != null) {
      fetches.push(
        getSchoolGroupApi(student.value.school_group)
          .then(res => { schoolGroup.value = res.data })
          .catch(() => { /* silent */ })
      )
    }
    await Promise.all(fetches)
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
