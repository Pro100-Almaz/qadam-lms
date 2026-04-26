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
          @click="showAddModal = true"
          class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition"
        >
          <Plus class="h-4 w-4" />
          {{ $t('lessons.addNew') }}
        </button>
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

      <!-- Month View -->
      <div v-if="currentView === 'month'" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
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
      <div v-if="currentView === 'week'" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
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
                    <div class="text-[9px] leading-tight opacity-80 sm:text-[10px]">{{ event.room }} · {{ event.teacherName }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Day View -->
      <div v-if="currentView === 'day'" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
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
                  <div>{{ event.room }} · {{ event.teacherName }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                {{ selectedEvent.subjectName }}
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
            <div class="flex items-center gap-3 text-sm">
              <User class="h-4 w-4 text-gray-400" />
              <span class="text-gray-700 dark:text-gray-300">{{ selectedEvent.teacherName }}</span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <MapPin class="h-4 w-4 text-gray-400" />
              <span class="text-gray-700 dark:text-gray-300">{{ selectedEvent.room }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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
  MapPin,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const { t, locale } = useI18n()

type ViewType = 'month' | 'week' | 'day'
const views: ViewType[] = ['month', 'week', 'day']
const currentView = ref<ViewType>('week')
const currentDate = ref(new Date())
const showAddModal = ref(false)

interface CalendarEvent {
  id: string
  subjectName: string
  subjectColor: string
  className: string
  teacherName: string
  room: string
  date: Date
  startTime: number
  endTime: number
  dayOfWeek: number
}

const selectedEvent = ref<CalendarEvent | null>(null)

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function generateWeekEvents(weekStart: Date): CalendarEvent[] {
  const templates = [
    { subjectName: 'Математика', subjectColor: 'blue', className: '5А', teacherName: 'Назарова А.К.', room: 'Каб. 201' },
    { subjectName: 'Қазақ тілі', subjectColor: 'green', className: '5А', teacherName: 'Сейтова Б.М.', room: 'Каб. 105' },
    { subjectName: 'Русский язык', subjectColor: 'purple', className: '5Б', teacherName: 'Иванова Н.П.', room: 'Каб. 302' },
    { subjectName: 'English', subjectColor: 'orange', className: '6А', teacherName: 'Smith J.', room: 'Каб. 410' },
    { subjectName: 'Физика', subjectColor: 'red', className: '7А', teacherName: 'Ахметов Д.С.', room: 'Каб. 215' },
    { subjectName: 'Химия', subjectColor: 'teal', className: '8А', teacherName: 'Жанбырова К.Е.', room: 'Каб. 310' },
    { subjectName: 'Биология', subjectColor: 'emerald', className: '6Б', teacherName: 'Тұрсынова Г.А.', room: 'Каб. 208' },
    { subjectName: 'История Казахстана', subjectColor: 'amber', className: '7Б', teacherName: 'Қасымов М.Т.', room: 'Каб. 112' },
    { subjectName: 'География', subjectColor: 'cyan', className: '6А', teacherName: 'Бекенова С.Ж.', room: 'Каб. 304' },
    { subjectName: 'Информатика', subjectColor: 'indigo', className: '8Б', teacherName: 'Ли В.С.', room: 'Каб. 401' },
  ]

  const schedule: { day: number; startTime: number; endTime: number; templateIdx: number }[] = [
    { day: 0, startTime: 8, endTime: 9, templateIdx: 0 },
    { day: 0, startTime: 9, endTime: 10, templateIdx: 1 },
    { day: 0, startTime: 10, endTime: 11, templateIdx: 3 },
    { day: 0, startTime: 13, endTime: 14, templateIdx: 6 },
    { day: 1, startTime: 8, endTime: 9, templateIdx: 2 },
    { day: 1, startTime: 9, endTime: 10, templateIdx: 4 },
    { day: 1, startTime: 11, endTime: 12, templateIdx: 7 },
    { day: 1, startTime: 14, endTime: 15, templateIdx: 9 },
    { day: 2, startTime: 8, endTime: 9, templateIdx: 0 },
    { day: 2, startTime: 9, endTime: 10, templateIdx: 5 },
    { day: 2, startTime: 10, endTime: 11, templateIdx: 8 },
    { day: 2, startTime: 13, endTime: 14, templateIdx: 1 },
    { day: 3, startTime: 8, endTime: 9, templateIdx: 3 },
    { day: 3, startTime: 9, endTime: 10, templateIdx: 2 },
    { day: 3, startTime: 11, endTime: 12, templateIdx: 4 },
    { day: 3, startTime: 14, endTime: 15, templateIdx: 6 },
    { day: 4, startTime: 8, endTime: 9, templateIdx: 7 },
    { day: 4, startTime: 9, endTime: 10, templateIdx: 0 },
    { day: 4, startTime: 10, endTime: 11, templateIdx: 5 },
    { day: 4, startTime: 13, endTime: 14, templateIdx: 9 },
    { day: 5, startTime: 9, endTime: 10, templateIdx: 8 },
    { day: 5, startTime: 10, endTime: 11, templateIdx: 1 },
  ]

  const events: CalendarEvent[] = []
  schedule.forEach((s, i) => {
    const tmpl = templates[s.templateIdx]
    const date = new Date(weekStart)
    date.setDate(date.getDate() + s.day)
    events.push({
      id: `${weekStart.getTime()}-${i}`,
      ...tmpl,
      date: new Date(date),
      startTime: s.startTime,
      endTime: s.endTime,
      dayOfWeek: s.day,
    })
  })
  return events
}

const allEvents = computed(() => {
  const events: CalendarEvent[] = []
  const monday = getMonday(currentDate.value)
  for (let w = -5; w <= 5; w++) {
    const weekStart = new Date(monday)
    weekStart.setDate(weekStart.getDate() + w * 7)
    events.push(...generateWeekEvents(weekStart))
  }
  return events
})

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
