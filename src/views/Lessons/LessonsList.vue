<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {{ $t('lessons.title') }}
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ formattedDateRange }}
          </p>
        </div>
        <button
          v-if="canAddLesson"
          @click="showAddModal = true"
          class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition"
        >
          <Plus class="h-4 w-4" />
          {{ $t('lessons.addNew') }}
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3">
        <select
          v-model="filterClassGroup"
          @change="fetchLessons()"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600"
        >
          <option value="all">{{ $t('lessons.allClasses') }}</option>
          <option v-for="cg in classGroups" :key="cg.id" :value="cg.id">
            {{ cg.display_name }}
          </option>
        </select>

        <select
          v-model="filterSubject"
          @change="fetchLessons()"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600"
        >
          <option value="all">{{ $t('lessons.allSubjects') }}</option>
          <option v-for="s in subjects" :key="s.id" :value="s.id">
            {{ s.name }}
          </option>
        </select>

        <select
          v-model="filterQuarter"
          @change="fetchLessons()"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600"
        >
          <option value="all">{{ $t('lessons.allQuarters') }}</option>
          <option v-for="q in [1, 2, 3, 4]" :key="q" :value="q">
            {{ $t('lessons.quarter') }} {{ q }}
          </option>
        </select>
      </div>

      <!-- Calendar toolbar -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <!-- Navigation -->
        <div class="flex items-center gap-2">
          <button
            @click="navigatePrev"
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <button
            @click="goToToday"
            class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            {{ $t('lessons.today') }}
          </button>
          <button
            @click="navigateNext"
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
          <h2 class="ml-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            {{ currentTitle }}
          </h2>
        </div>

        <!-- View toggle -->
        <div class="inline-flex rounded-lg border border-gray-300 dark:border-gray-700">
          <button
            v-for="v in views"
            :key="v"
            @click="currentView = v"
            class="px-4 py-1.5 text-sm font-medium transition first:rounded-l-lg last:rounded-r-lg"
            :class="
              currentView === v
                ? 'bg-brand-500 text-white'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
            "
          >
            {{ $t('lessons.view' + capitalize(v)) }}
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <Loader2 class="h-8 w-8 animate-spin text-brand-500" />
      </div>

      <!-- Month View -->
      <div v-else-if="currentView === 'month'" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <!-- Day headers -->
        <div class="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
          <div
            v-for="day in weekDayNames"
            :key="day"
            class="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {{ day }}
          </div>
        </div>
        <!-- Calendar grid -->
        <div class="grid grid-cols-7">
          <div
            v-for="(day, idx) in monthDays"
            :key="idx"
            class="min-h-[100px] border-b border-r border-gray-100 p-1.5 last:border-r-0 dark:border-gray-800 sm:min-h-[120px]"
            :class="{
              'bg-gray-50/50 dark:bg-white/[0.02]': !day.isCurrentMonth,
              'bg-brand-50/30 dark:bg-brand-500/5': day.isToday,
            }"
          >
            <div class="mb-1 flex items-center justify-between">
              <span
                class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
                :class="{
                  'text-gray-400 dark:text-gray-600': !day.isCurrentMonth,
                  'bg-brand-500 text-white': day.isToday,
                  'text-gray-700 dark:text-gray-300': day.isCurrentMonth && !day.isToday,
                }"
              >
                {{ day.date.getDate() }}
              </span>
            </div>
            <div class="space-y-0.5">
              <div
                v-for="event in getEventsForDate(day.date).slice(0, 3)"
                :key="event.id"
                @click="selectedEvent = event"
                class="cursor-pointer truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight sm:text-xs"
                :class="subjectColorClasses(event.subjectColor)"
              >
                <span class="hidden sm:inline">{{ formatTime(event.startTime) }}</span>
                {{ event.subjectName }}
              </div>
              <div
                v-if="getEventsForDate(day.date).length > 3"
                class="px-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400"
              >
                +{{ getEventsForDate(day.date).length - 3 }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Week View -->
      <div v-else-if="currentView === 'week'" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div class="overflow-x-auto">
          <div class="min-w-[700px]">
            <!-- Day headers -->
            <div class="grid grid-cols-[60px_repeat(6,1fr)] border-b border-gray-200 dark:border-gray-800">
              <div class="border-r border-gray-200 dark:border-gray-800"></div>
              <div
                v-for="day in weekDays"
                :key="day.date.toISOString()"
                class="border-r border-gray-200 px-2 py-3 text-center last:border-r-0 dark:border-gray-800"
                :class="{ 'bg-brand-50/30 dark:bg-brand-500/5': isToday(day.date) }"
              >
                <div class="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ shortDayName(day.date) }}
                </div>
                <div
                  class="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
                  :class="isToday(day.date)
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-800 dark:text-white/90'"
                >
                  {{ day.date.getDate() }}
                </div>
              </div>
            </div>
            <!-- Time grid -->
            <div class="relative">
              <div
                v-for="hour in timeSlots"
                :key="hour"
                class="grid grid-cols-[60px_repeat(6,1fr)] border-b border-gray-100 dark:border-gray-800"
              >
                <div class="flex h-16 items-start justify-end border-r border-gray-200 pr-2 pt-1 text-[10px] text-gray-400 dark:border-gray-800 dark:text-gray-500">
                  {{ formatHour(hour) }}
                </div>
                <div
                  v-for="day in weekDays"
                  :key="day.date.toISOString() + hour"
                  class="relative h-16 border-r border-gray-100 last:border-r-0 dark:border-gray-800"
                  :class="{ 'bg-brand-50/20 dark:bg-brand-500/[0.03]': isToday(day.date) }"
                >
                  <div
                    v-for="event in getEventsForHour(day.date, hour)"
                    :key="event.id"
                    @click="selectedEvent = event"
                    class="absolute inset-x-0.5 z-10 cursor-pointer overflow-hidden rounded px-1.5 py-1"
                    :class="subjectColorClasses(event.subjectColor)"
                    :style="eventPositionStyle(event, hour)"
                  >
                    <div class="text-[10px] font-semibold leading-tight sm:text-xs">{{ event.subjectName }}</div>
                    <div class="text-[9px] leading-tight opacity-80 sm:text-[10px]">{{ event.className }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Day View -->
      <div v-else-if="currentView === 'day'" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div
          v-for="hour in timeSlots"
          :key="hour"
          class="grid grid-cols-[60px_1fr] border-b border-gray-100 last:border-b-0 dark:border-gray-800"
        >
          <div class="flex h-20 items-start justify-end border-r border-gray-200 pr-2 pt-1 text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
            {{ formatHour(hour) }}
          </div>
          <div class="relative h-20 p-1">
            <div
              v-for="event in getEventsForHour(currentDate, hour)"
              :key="event.id"
              @click="selectedEvent = event"
              class="cursor-pointer rounded-lg px-3 py-2"
              :class="subjectColorClasses(event.subjectColor)"
              :style="eventPositionStyleDay(event, hour)"
            >
              <div class="flex items-center gap-3">
                <div>
                  <div class="text-sm font-semibold">{{ event.subjectName }}</div>
                  <div class="mt-0.5 text-xs opacity-80">
                    {{ formatTime(event.startTime) }} – {{ formatTime(event.endTime) }}
                  </div>
                </div>
                <div class="ml-auto text-right text-xs opacity-80">
                  <div>{{ event.className }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="!loading && allEvents.length === 0"
        class="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900"
      >
        <CalendarDays class="h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">{{ $t('lessons.noLessons') }}</p>
      </div>

      <!-- Event detail modal -->
      <div
        v-if="selectedEvent"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        @click.self="selectedEvent = null"
      >
        <div class="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <div class="flex items-start justify-between">
            <div>
              <div
                class="mb-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="subjectColorClasses(selectedEvent.subjectColor)"
              >
                {{ selectedEvent.subjectName }}
              </div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                {{ selectedEvent.title || selectedEvent.subjectName }}
              </h3>
            </div>
            <button
              @click="selectedEvent = null"
              class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            >
              <X class="h-5 w-5" />
            </button>
          </div>
          <div class="mt-4 space-y-3">
            <div class="flex items-center gap-3 text-sm">
              <Clock class="h-4 w-4 text-gray-400" />
              <span class="text-gray-700 dark:text-gray-300">
                {{ formatTime(selectedEvent.startTime) }} – {{ formatTime(selectedEvent.endTime) }}
              </span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <CalendarDays class="h-4 w-4 text-gray-400" />
              <span class="text-gray-700 dark:text-gray-300">
                {{ formatFullDate(selectedEvent.date) }}
              </span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <Users class="h-4 w-4 text-gray-400" />
              <span class="text-gray-700 dark:text-gray-300">{{ selectedEvent.className }}</span>
            </div>
            <div v-if="selectedEvent.teacher" class="flex items-center gap-3 text-sm">
              <User class="h-4 w-4 text-gray-400" />
              <span class="text-gray-700 dark:text-gray-300">{{ selectedEvent.teacher }}</span>
            </div>
            <div v-if="selectedEvent.status" class="flex items-center gap-3 text-sm">
              <BookOpen class="h-4 w-4 text-gray-400" />
              <span class="text-gray-700 dark:text-gray-300">
                {{ $t('lessons.quarter') }} {{ selectedEvent.quarter }}
                · {{ $t('lessons.unit') }} {{ selectedEvent.unit }}
                · {{ selectedEvent.status }}
              </span>
            </div>
          </div>
          <div class="mt-5 flex gap-3">
            <router-link
              :to="`/lessons/${selectedEvent.lessonId}`"
              class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              {{ $t('common.view') }}
            </router-link>
            <button
              @click="selectedEvent = null"
              class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              {{ $t('common.cancel') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Create Lesson Modal -->
      <Teleport to="body">
        <Transition name="fade">
          <div
            v-if="showAddModal"
            class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
            @click.self="showAddModal = false"
          >
            <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ $t('lessons.createTitle') }}</h3>
                <button @click="showAddModal = false" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
                  <X class="h-5 w-5" />
                </button>
              </div>
              <!-- Loading offerings -->
              <div v-if="loadingOfferings" class="flex items-center justify-center py-8">
                <Loader2 class="h-6 w-6 animate-spin text-brand-500" />
              </div>
              <form v-else @submit.prevent="handleCreateLesson" class="mt-4 space-y-4">
                <!-- Offering -->
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('lessons.subject') }} / {{ $t('lessons.class') }}</label>
                  <select
                    v-model="lessonForm.offering"
                    required
                    class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    <option :value="null" disabled>{{ $t('common.select') }}</option>
                    <option v-for="o in teacherOfferings" :key="o.id" :value="o.id">
                      {{ o.subject.name }} — {{ o.class_group.display_name }}
                    </option>
                  </select>
                </div>
                <!-- Title -->
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('subjects.name') }}</label>
                  <input
                    v-model="lessonForm.title"
                    type="text"
                    required
                    class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <!-- Date -->
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('lessons.date') }}</label>
                    <input
                      v-model="lessonForm.date"
                      type="text"
                      placeholder="YYYY-MM-DD"
                      pattern="\d{4}-\d{2}-\d{2}"
                      class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                  <!-- Quarter -->
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('lessons.quarter') }}</label>
                    <select
                      v-model="lessonForm.quarter"
                      required
                      class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <option v-for="q in [1, 2, 3, 4]" :key="q" :value="q">Q{{ q }}</option>
                    </select>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <!-- Unit -->
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('lessons.unit') }}</label>
                    <input
                      v-model.number="lessonForm.unit"
                      type="number"
                      min="1"
                      max="15"
                      required
                      class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                  <!-- Order -->
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('lessons.order') }}</label>
                    <input
                      v-model.number="lessonForm.order"
                      type="number"
                      min="0"
                      class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                </div>
                <!-- Status -->
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('subjects.status') }}</label>
                  <select
                    v-model="lessonForm.status"
                    class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    <option value="pending">{{ $t('lessons.statusPending') }}</option>
                    <option value="completed">{{ $t('lessons.statusCompleted') }}</option>
                    <option value="delayed">{{ $t('lessons.statusDelayed') }}</option>
                    <option value="on schedule">{{ $t('lessons.statusOnSchedule') }}</option>
                  </select>
                </div>
                <!-- Description -->
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('subjects.description') }}</label>
                  <textarea
                    v-model="lessonForm.description"
                    rows="2"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
                <!-- Actions -->
                <div class="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    @click="showAddModal = false"
                    class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    {{ $t('common.cancel') }}
                  </button>
                  <button
                    type="submit"
                    :disabled="savingLesson"
                    class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition"
                  >
                    <Loader2 v-if="savingLesson" class="h-4 w-4 animate-spin" />
                    {{ $t('common.save') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  CalendarDays,
  Users,
  User,
  BookOpen,
  Loader2,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getCalendarLessonsApi, createLessonApi } from '@/api/lessons'
import { getClassGroupsApi } from '@/api/academic'
import { getSubjectsApi, getMySubjectsApi } from '@/api/subjects'
import type { CalendarLesson } from '@/types/lesson'
import type { ClassGroup } from '@/types/academic'
import type { Subject, SubjectOffering } from '@/types/subject'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { t, locale } = useI18n()
const router = useRouter()
const { user: authUser } = useAuth()
const canAddLesson = computed(() => authUser.value?.role !== 'parent')

type ViewType = 'month' | 'week' | 'day'
const views: ViewType[] = ['month', 'week', 'day']
const currentView = ref<ViewType>('week')
const currentDate = ref(new Date())
const showAddModal = ref(false)
const loading = ref(false)
const loadingOfferings = ref(false)
const savingLesson = ref(false)
const teacherOfferings = ref<SubjectOffering[]>([])
const lessonForm = ref({
  offering: null as number | null,
  title: '',
  date: new Date().toISOString().split('T')[0],
  quarter: 1,
  unit: 1,
  order: 0,
  status: 'pending',
  description: '',
})

watch(showAddModal, async (val) => {
  if (val && teacherOfferings.value.length === 0) {
    loadingOfferings.value = true
    try {
      const { data } = await getMySubjectsApi({ status: 'active' })
      const offerings: SubjectOffering[] = []
      for (const subj of data) {
        if ('offerings' in subj && Array.isArray((subj as any).offerings)) {
          for (const o of (subj as any).offerings) {
            offerings.push(o)
          }
        }
      }
      teacherOfferings.value = offerings
    } catch {
      // handled by global interceptor
    } finally {
      loadingOfferings.value = false
    }
  }
})

async function handleCreateLesson() {
  if (!lessonForm.value.offering || !lessonForm.value.title) return
  savingLesson.value = true
  try {
    const { data } = await createLessonApi({
      offering: lessonForm.value.offering,
      title: lessonForm.value.title,
      date: lessonForm.value.date || undefined,
      quarter: lessonForm.value.quarter,
      unit: lessonForm.value.unit,
      order: lessonForm.value.order || undefined,
      status: lessonForm.value.status,
      description: lessonForm.value.description || undefined,
    })
    showAddModal.value = false
    router.push(`/lessons/${data.id}`)
  } catch {
    // handled by global interceptor
  } finally {
    savingLesson.value = false
  }
}

// Filter state
const filterClassGroup = ref<number | 'all'>('all')
const filterSubject = ref<number | 'all'>('all')
const filterQuarter = ref<number | 'all'>('all')

// Data from API
const calendarLessons = ref<CalendarLesson[]>([])
const classGroups = ref<ClassGroup[]>([])
const subjects = ref<Subject[]>([])

interface CalendarEvent {
  lessonId: number
  id: string
  subjectName: string
  subjectColor: string
  className: string
  title: string
  teacher: string
  status: string
  quarter: number
  unit: number
  date: Date
  startTime: number
  endTime: number
  dayOfWeek: number
}

const selectedEvent = ref<CalendarEvent | null>(null)

// Color palette for subject-based hashing
const colorPalette = [
  'blue', 'green', 'purple', 'orange', 'red',
  'teal', 'emerald', 'amber', 'cyan', 'indigo',
] as const

function hashSubjectColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  }
  return colorPalette[Math.abs(hash) % colorPalette.length]
}

function mapLessonToEvent(lesson: CalendarLesson): CalendarEvent {
  const lessonDate = new Date(lesson.date + 'T00:00:00')
  const startTime = 7 + (lesson.order || 1)
  const endTime = startTime + 1

  return {
    lessonId: lesson.id,
    id: String(lesson.id),
    subjectName: lesson.subject_name,
    subjectColor: hashSubjectColor(lesson.subject_name),
    className: lesson.class_group_name,
    title: lesson.title,
    teacher: lesson.teacher?.full_name || '',
    status: lesson.status,
    quarter: lesson.quarter,
    unit: lesson.unit,
    date: lessonDate,
    startTime,
    endTime,
    dayOfWeek: (lessonDate.getDay() + 6) % 7,
  }
}

const allEvents = computed<CalendarEvent[]>(() => {
  return calendarLessons.value.map(mapLessonToEvent)
})

function formatDateParam(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getDateRange(): { start_date: string; end_date: string } {
  if (currentView.value === 'month') {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDay = firstDay.getDay() - 1 < 0 ? 6 : firstDay.getDay() - 1
    const start = new Date(firstDay)
    start.setDate(start.getDate() - startDay)
    const lastDay = new Date(year, month + 1, 0)
    const end = new Date(lastDay)
    end.setDate(end.getDate() + (6 - ((lastDay.getDay() + 6) % 7)))
    return { start_date: formatDateParam(start), end_date: formatDateParam(end) }
  }
  if (currentView.value === 'week') {
    const monday = getMonday(currentDate.value)
    const saturday = new Date(monday)
    saturday.setDate(saturday.getDate() + 5)
    return { start_date: formatDateParam(monday), end_date: formatDateParam(saturday) }
  }
  // day
  return { start_date: formatDateParam(currentDate.value), end_date: formatDateParam(currentDate.value) }
}

async function fetchLessons() {
  loading.value = true
  try {
    const range = getDateRange()
    const params: Record<string, string | number> = { ...range }
    if (filterClassGroup.value !== 'all') params.class_group = filterClassGroup.value
    if (filterSubject.value !== 'all') params.subject = filterSubject.value
    if (filterQuarter.value !== 'all') params.quarter = filterQuarter.value

    const { data } = await getCalendarLessonsApi(params as any)
    calendarLessons.value = data
  } catch (error) {
    console.error('Failed to fetch lessons:', error)
    calendarLessons.value = []
  } finally {
    loading.value = false
  }
}

async function fetchFilterData() {
  try {
    const [classGroupsRes, subjectsRes] = await Promise.all([
      getClassGroupsApi(),
      getSubjectsApi(),
    ])
    classGroups.value = classGroupsRes.data
    subjects.value = subjectsRes.data
  } catch (error) {
    console.error('Failed to fetch filter data:', error)
  }
}

onMounted(() => {
  fetchFilterData()
  fetchLessons()
})

watch([currentDate, currentView], () => {
  fetchLessons()
})

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

const timeSlots = computed(() => {
  const slots: number[] = []
  for (let h = 8; h <= 17; h++) slots.push(h)
  return slots
})

const weekDayNames = computed(() => {
  const names: string[] = []
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  for (const d of days) {
    names.push(t('lessons.days.' + d).slice(0, 3))
  }
  return names
})

const monthDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let startDay = firstDay.getDay() - 1
  if (startDay < 0) startDay = 6

  const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = []
  const today = new Date()

  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDay)

  const totalCells = Math.ceil((startDay + lastDay.getDate()) / 7) * 7
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    days.push({
      date: d,
      isCurrentMonth: d.getMonth() === month,
      isToday: d.toDateString() === today.toDateString(),
    })
  }
  return days
})

const weekDays = computed(() => {
  const monday = getMonday(currentDate.value)
  const days: { date: Date }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    days.push({ date: d })
  }
  return days
})

function getEventsForDate(date: Date): CalendarEvent[] {
  return allEvents.value.filter(
    (e) => e.date.toDateString() === date.toDateString()
  )
}

function getEventsForHour(date: Date, hour: number): CalendarEvent[] {
  return allEvents.value.filter(
    (e) => e.date.toDateString() === date.toDateString() && e.startTime === hour
  )
}

function isToday(date: Date): boolean {
  return date.toDateString() === new Date().toDateString()
}

function shortDayName(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return t('lessons.days.' + days[date.getDay()]).slice(0, 3)
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatTime(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

function formatHour(hour: number): string {
  return `${hour}:00`
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString(locale.value === 'kz' ? 'kk-KZ' : locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const currentTitle = computed(() => {
  const loc = locale.value === 'kz' ? 'kk-KZ' : locale.value === 'ru' ? 'ru-RU' : 'en-US'
  if (currentView.value === 'month') {
    return currentDate.value.toLocaleDateString(loc, { month: 'long', year: 'numeric' })
  }
  if (currentView.value === 'day') {
    return currentDate.value.toLocaleDateString(loc, { weekday: 'long', month: 'long', day: 'numeric' })
  }
  const monday = getMonday(currentDate.value)
  const saturday = new Date(monday)
  saturday.setDate(saturday.getDate() + 5)
  const m1 = monday.toLocaleDateString(loc, { month: 'short', day: 'numeric' })
  const m2 = saturday.toLocaleDateString(loc, { month: 'short', day: 'numeric', year: 'numeric' })
  return `${m1} – ${m2}`
})

const formattedDateRange = computed(() => {
  const loc = locale.value === 'kz' ? 'kk-KZ' : locale.value === 'ru' ? 'ru-RU' : 'en-US'
  if (currentView.value === 'month') {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    return `${first.toLocaleDateString(loc, { month: 'long', day: 'numeric' })} – ${last.toLocaleDateString(loc, { month: 'long', day: 'numeric', year: 'numeric' })}`
  }
  if (currentView.value === 'day') {
    return formatFullDate(currentDate.value)
  }
  const monday = getMonday(currentDate.value)
  const saturday = new Date(monday)
  saturday.setDate(saturday.getDate() + 5)
  return `${monday.toLocaleDateString(loc, { month: 'long', day: 'numeric' })} – ${saturday.toLocaleDateString(loc, { month: 'long', day: 'numeric', year: 'numeric' })}`
})

function navigatePrev() {
  const d = new Date(currentDate.value)
  if (currentView.value === 'month') d.setMonth(d.getMonth() - 1)
  else if (currentView.value === 'week') d.setDate(d.getDate() - 7)
  else d.setDate(d.getDate() - 1)
  currentDate.value = d
}

function navigateNext() {
  const d = new Date(currentDate.value)
  if (currentView.value === 'month') d.setMonth(d.getMonth() + 1)
  else if (currentView.value === 'week') d.setDate(d.getDate() + 7)
  else d.setDate(d.getDate() + 1)
  currentDate.value = d
}

function goToToday() {
  currentDate.value = new Date()
}

function eventPositionStyle(event: CalendarEvent, hour: number) {
  const top = (event.startTime - hour) * 64
  const height = (event.endTime - event.startTime) * 64 - 2
  return { top: `${top}px`, height: `${height}px` }
}

function eventPositionStyleDay(event: CalendarEvent, hour: number) {
  if (event.startTime !== hour) return { display: 'none' }
  return {}
}

function subjectColorClasses(color: string): string {
  const map: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
    teal: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300',
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
    cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300',
  }
  return map[color] || map.blue
}
</script>
