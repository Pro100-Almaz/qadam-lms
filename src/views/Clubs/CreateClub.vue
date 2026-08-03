<template>
  <AdminLayout>
    <div class="mx-auto min-w-0 max-w-6xl space-y-6">
      <button type="button" @click="router.push(backTarget)" class="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-brand-500 dark:text-gray-400">
        <ArrowLeft class="h-4 w-4" />
        {{ t('clubs.backToClubs') }}
      </button>

      <div>
        <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">{{ isEditing ? t('clubs.editTitle') : t('clubs.createTitle') }}</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ isEditing ? t('clubs.editSubtitle') : t('clubs.createSubtitle') }}</p>
      </div>

      <div v-if="submitError" class="flex items-start gap-2 rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
        <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
        <span>{{ submitError }}</span>
      </div>

      <form class="min-w-0 space-y-6" novalidate @submit.prevent="submitForm">
        <section class="min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10"><Puzzle class="h-4 w-4 text-brand-500" /></div>
              <div>
                <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clubs.basicInformation') }}</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ t('clubs.requiredHint') }}</p>
              </div>
            </div>
            <div v-if="isEditing" class="w-full sm:w-56">
              <ClubStatusSelect
                v-model="form.status"
                :aria-label="t('common.status')"
                :error="Boolean(fieldErrors.status)"
              />
              <p v-if="fieldErrors.status" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.status }}</p>
            </div>
          </div>

          <div class="space-y-5">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('students.clubName') }} <span class="text-error-500">*</span></label>
              <input v-model="form.clubName" type="text" :placeholder="t('clubs.namePlaceholder')" :class="fieldErrors.clubName ? 'border-error-500' : 'border-gray-300 dark:border-gray-700'" class="h-11 w-full rounded-lg border bg-white px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
              <p v-if="fieldErrors.clubName" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.clubName }}</p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('academicYears.title') }} <span class="text-error-500">*</span></label>
              <ClubAcademicYearSelect
                :model-value="form.academicYearId === null ? '' : String(form.academicYearId)"
                :years="academicYears"
                :all-label="t('common.selectOption')"
                :aria-label="t('academicYears.title')"
                :allow-empty="false"
                :disabled="loadingAcademicYears"
                @update:model-value="selectAcademicYear"
              />
              <p v-if="fieldErrors.academicYearId" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.academicYearId }}</p>
            </div>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('clubs.startDate') }} <span class="text-error-500">*</span></label>
                <div class="relative">
                  <flat-pickr v-model="form.startDate" :config="startDatePickerConfig" :placeholder="t('clubs.selectStartDate')" :class="fieldErrors.startDate ? 'border-error-500' : 'border-gray-300 dark:border-gray-700'" class="h-11 w-full rounded-lg border bg-white px-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
                  <CalendarDays class="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
                <p v-if="fieldErrors.startDate" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.startDate }}</p>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('clubs.endDate') }} <span class="text-error-500">*</span></label>
                <div class="relative">
                  <flat-pickr v-model="form.endDate" :config="endDatePickerConfig" :placeholder="t('clubs.selectEndDate')" :class="fieldErrors.endDate ? 'border-error-500' : 'border-gray-300 dark:border-gray-700'" class="h-11 w-full rounded-lg border bg-white px-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
                  <CalendarDays class="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
                <p v-if="fieldErrors.endDate" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.endDate }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div class="flex flex-col gap-3 border-b border-gray-200 px-4 py-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-light-100 dark:bg-blue-light-500/10"><CalendarDays class="h-4 w-4 text-blue-light-600 dark:text-blue-light-400" /></div>
              <div>
                <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clubs.weeklySchedule') }}</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ t('clubs.calendarScheduleHint') }}</p>
              </div>
            </div>
            <span class="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <Clock3 class="h-3.5 w-3.5" />
              {{ t('clubs.sessionsPerWeek', { count: scheduleSlots.length }) }}
            </span>
          </div>

          <div class="w-full max-w-full overflow-x-auto overscroll-x-contain p-4 sm:p-6">
            <div class="grid min-w-[1050px] grid-cols-7 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <button
                v-for="(day, index) in weekDays"
                :key="day.key"
                type="button"
                class="group min-h-64 border-gray-200 bg-white text-left transition hover:bg-blue-light-50/60 focus:z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-light-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-blue-light-500/5"
                :class="index < weekDays.length - 1 ? 'border-r' : ''"
                @click="openAlternativeScheduleModal(day.key)"
              >
                <span class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-700 dark:bg-gray-800/60">
                  <span class="text-sm font-semibold text-gray-700 group-hover:text-blue-light-700 dark:text-gray-300 dark:group-hover:text-blue-light-400">{{ day.label }}</span>
                  <span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-semibold text-gray-500 shadow-theme-xs dark:bg-gray-900 dark:text-gray-400">{{ slotsFor(day.key).length }}</span>
                </span>
                <span class="flex min-h-52 flex-col gap-2 p-2.5">
                  <span
                    v-for="slot in slotsFor(day.key)"
                    :key="slot.id"
                    class="block rounded-lg border-l-3 border-blue-light-500 bg-blue-light-50 px-2.5 py-2 dark:bg-blue-light-500/10"
                  >
                    <span class="block text-xs font-semibold text-blue-light-700 dark:text-blue-light-400">{{ slot.startTime }}–{{ slot.endTime }}</span>
                    <span v-if="slot.location" class="mt-1 flex items-center gap-1 truncate text-[11px] text-gray-500 dark:text-gray-400"><MapPin class="h-3 w-3 shrink-0" />{{ slot.location }}</span>
                  </span>
                  <span v-if="slotsFor(day.key).length === 0" class="flex flex-1 flex-col items-center justify-center gap-2 text-center text-xs text-gray-400">
                    <span class="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-gray-300 group-hover:border-blue-light-400 group-hover:text-blue-light-500 dark:border-gray-700"><Plus class="h-4 w-4" /></span>
                    {{ t('clubs.clickToAdd') }}
                  </span>
                  <span v-else class="mt-auto flex items-center justify-center gap-1 pt-2 text-[11px] font-medium text-gray-400 group-hover:text-blue-light-600 dark:group-hover:text-blue-light-400"><Plus class="h-3 w-3" />{{ t('clubs.addSession') }}</span>
                </span>
              </button>
            </div>
            <p v-if="scheduleError" class="mt-3 flex items-start gap-2 text-sm text-error-500">
              <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
              <span>{{ scheduleError }}</span>
            </p>
          </div>
        </section>

        <section class="min-w-0 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-light-100 dark:bg-blue-light-500/10"><ClipboardList class="h-4 w-4 text-blue-light-600 dark:text-blue-light-400" /></div>
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clubs.programDetails') }}</h2>
          </div>
          <div class="space-y-5">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('students.plan') }}</label>
              <textarea v-model="form.plan" rows="4" :placeholder="t('clubs.planPlaceholder')" :class="fieldErrors.plan ? 'border-error-500' : 'border-gray-300 dark:border-gray-700'" class="w-full resize-none rounded-lg border bg-white px-4 py-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"></textarea>
              <p v-if="fieldErrors.plan" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.plan }}</p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('students.criteria') }}</label>
              <input v-model="form.criteria" type="text" :placeholder="t('clubs.criteriaPlaceholder')" :class="fieldErrors.criteria ? 'border-error-500' : 'border-gray-300 dark:border-gray-700'" class="h-11 w-full rounded-lg border bg-white px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
              <p v-if="fieldErrors.criteria" class="mt-1.5 text-xs text-error-500">{{ fieldErrors.criteria }}</p>
            </div>
          </div>
        </section>

        <div class="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 dark:border-gray-800 sm:flex-row sm:justify-end">
          <button type="button" @click="router.push(backTarget)" class="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="saving || loadingAcademicYears" class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60">
            <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
            <Save v-else-if="isEditing" class="h-4 w-4" />
            <Plus v-else class="h-4 w-4" />
            {{ isEditing ? t('clubs.saveChanges') : t('clubs.create') }}
          </button>
        </div>
      </form>
    </div>

    <Modal v-if="selectedScheduleDay" :full-screen-backdrop="true" @close="closeAlternativeScheduleModal">
      <template #body>
        <div class="relative z-10 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('clubs.addSessionTo', { day: selectedDayLabel }) }}</h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.sessionModalHint') }}</p>
            </div>
            <button type="button" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" @click="closeAlternativeScheduleModal"><X class="h-5 w-5" /></button>
          </div>

          <div v-if="selectedDaySlots.length" class="mt-5 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
            <p class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('clubs.existingSessions') }}</p>
            <div class="space-y-2">
              <div v-for="slot in selectedDaySlots" :key="slot.id" class="flex min-w-0 items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                <span class="min-w-0 break-words">{{ slot.startTime }}–{{ slot.endTime }}<span v-if="slot.location" class="font-normal text-gray-400"> · {{ slot.location }}</span></span>
                <span class="flex gap-1">
                  <button type="button" :aria-label="t('common.edit')" class="rounded p-1 text-gray-400 hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10" @click="editScheduleSlot(slot)"><Pencil class="h-3.5 w-3.5" /></button>
                  <button type="button" :aria-label="t('common.delete')" class="rounded p-1 text-gray-400 hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10" @click="deleteScheduleSlot(slot.id)"><Trash2 class="h-3.5 w-3.5" /></button>
                </span>
              </div>
            </div>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="min-w-0">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('clubs.startTime') }} <span class="text-error-500">*</span></label>
              <input v-model="alternativeSlot.startTime" type="time" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-blue-light-400 focus:outline-hidden focus:ring-3 focus:ring-blue-light-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
            <div class="min-w-0">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('clubs.endTime') }} <span class="text-error-500">*</span></label>
              <input v-model="alternativeSlot.endTime" type="time" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-blue-light-400 focus:outline-hidden focus:ring-3 focus:ring-blue-light-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
          </div>
          <div class="mt-4">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('clubs.location') }} <span class="text-error-500">*</span></label>
            <div class="relative">
              <MapPin class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input v-model="alternativeSlot.location" type="text" :placeholder="t('clubs.locationPlaceholder')" class="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-blue-light-400 focus:outline-hidden focus:ring-3 focus:ring-blue-light-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
          </div>

          <div v-if="alternativeScheduleError" class="mt-4 flex items-start gap-2 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
            <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
            <span>{{ alternativeScheduleError }}</span>
          </div>

          <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5" @click="closeAlternativeScheduleModal">{{ t('common.cancel') }}</button>
            <button type="button" class="rounded-lg bg-blue-light-600 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-blue-light-700" @click="saveAlternativeScheduleSlot">{{ editingScheduleSlotId ? t('clubs.updateSession') : t('common.save') }}</button>
          </div>
        </div>
      </template>
    </Modal>
  </AdminLayout>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import flatPickr from 'vue-flatpickr-component'
import { Kazakh } from 'flatpickr/dist/l10n/kz'
import { Russian } from 'flatpickr/dist/l10n/ru'
import { ArrowLeft, CalendarDays, CircleAlert, ClipboardList, Clock3, Loader2, MapPin, Pencil, Plus, Puzzle, Save, Trash2, X } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ClubAcademicYearSelect from '@/components/clubs/ClubAcademicYearSelect.vue'
import ClubStatusSelect from '@/components/clubs/ClubStatusSelect.vue'
import Modal from '@/components/ui/Modal.vue'
import { getAcademicYearsApi } from '@/api/academic'
import { createClubApi, getClubApi, replaceClubApi, type ClubStatus, type ClubWeekday, type CreateClubRequest, type ReplaceClubRequest } from '@/api/clubs'
import { useToast } from '@/composables/useToast'
import type { AcademicYear } from '@/types/academic'

interface ClubScheduleSlot {
  id: number | string
  day: ClubWeekday
  startTime: string
  endTime: string
  location: string
}

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const { success } = useToast()
const editingClubId = typeof route.params.id === 'string' ? route.params.id : ''
const isEditing = Boolean(editingClubId)
const backTarget = isEditing ? `/clubs/${editingClubId}` : '/clubs'
const fieldErrors = ref<Record<string, string>>({})
const submitError = ref('')
const scheduleError = ref('')
const saving = ref(false)
const loadingAcademicYears = ref(false)
const alternativeScheduleError = ref('')
const selectedScheduleDay = ref<ClubWeekday | null>(null)
const editingScheduleSlotId = ref<number | string | null>(null)
const alternativeSlot = ref({ startTime: '15:00', endTime: '16:00', location: '' })

const academicYears = ref<AcademicYear[]>([])
const weekDayKeys: ClubWeekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const weekDays = computed(() => weekDayKeys.map(key => ({ key, label: t(`lessons.days.${key}`) })))
const scheduleSlots = ref<ClubScheduleSlot[]>([])
const selectedDayLabel = computed(() => selectedScheduleDay.value ? t(`lessons.days.${selectedScheduleDay.value}`) : '')
const selectedDaySlots = computed(() => selectedScheduleDay.value ? slotsFor(selectedScheduleDay.value) : [])
const currentDate = formatLocalDate(new Date())

const form = ref({
  clubName: '',
  academicYearId: null as number | null,
  startDate: currentDate,
  endDate: currentDate,
  status: 'pending' as ClubStatus,
  plan: '',
  criteria: '',
})
const pickerLocale = computed(() => locale.value === 'kz' ? Kazakh : locale.value === 'ru' ? Russian : undefined)
const datePickerConfig = {
  dateFormat: 'Y-m-d',
  altInput: true,
  altFormat: 'd.m.Y',
  allowInput: false,
  disableMobile: true,
}
const startDatePickerConfig = computed(() => ({
  ...datePickerConfig,
  locale: pickerLocale.value,
  maxDate: form.value.endDate || undefined,
}))
const endDatePickerConfig = computed(() => ({
  ...datePickerConfig,
  locale: pickerLocale.value,
  minDate: form.value.startDate || undefined,
}))

function selectAcademicYear(yearId: string) {
  form.value.academicYearId = yearId ? Number(yearId) : null
  fieldErrors.value.academicYearId = ''
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

onMounted(loadInitialData)

async function loadInitialData() {
  loadingAcademicYears.value = true
  try {
    const [yearsResponse, clubResponse] = await Promise.all([
      getAcademicYearsApi(),
      isEditing ? getClubApi(editingClubId) : Promise.resolve(null),
    ])
    academicYears.value = yearsResponse.data.filter(year => !year.archived)

    if (clubResponse) {
      const club = clubResponse.data
      form.value.clubName = club.club_name
      form.value.academicYearId = club.academic_year.id
      form.value.startDate = club.start_date
      form.value.endDate = club.end_date
      form.value.status = club.status
      form.value.plan = club.plan
      form.value.criteria = club.criteria
      scheduleSlots.value = club.schedule.map(slot => ({
        id: slot.id,
        day: slot.weekday,
        startTime: slot.start_time.slice(0, 5),
        endTime: slot.end_time.slice(0, 5),
        location: slot.location,
      }))
    } else {
      const defaultYear = academicYears.value.find(year => year.is_active) ?? academicYears.value[0]
      form.value.academicYearId = defaultYear?.id ?? null
    }
  } catch {
    submitError.value = isEditing ? t('clubs.detailLoadError') : t('clubs.academicYearsLoadError')
  } finally {
    loadingAcademicYears.value = false
  }
}

function slotsFor(day: ClubWeekday): ClubScheduleSlot[] {
  return scheduleSlots.value.filter(slot => slot.day === day)
}

function addOneHour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = Math.min(hours * 60 + minutes + 60, 23 * 60 + 59)
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`
}

function openAlternativeScheduleModal(day: ClubWeekday) {
  const daySlots = slotsFor(day).slice().sort((a, b) => a.startTime.localeCompare(b.startTime))
  const lastEnd = daySlots.length ? daySlots[daySlots.length - 1].endTime : '15:00'
  selectedScheduleDay.value = day
  editingScheduleSlotId.value = null
  alternativeSlot.value = { startTime: lastEnd, endTime: addOneHour(lastEnd), location: '' }
  alternativeScheduleError.value = ''
  scheduleError.value = ''
}

function closeAlternativeScheduleModal() {
  selectedScheduleDay.value = null
  editingScheduleSlotId.value = null
  alternativeScheduleError.value = ''
}

function editScheduleSlot(slot: ClubScheduleSlot) {
  editingScheduleSlotId.value = slot.id
  alternativeSlot.value = { startTime: slot.startTime, endTime: slot.endTime, location: slot.location }
  alternativeScheduleError.value = ''
}

function deleteScheduleSlot(id: number | string) {
  scheduleSlots.value = scheduleSlots.value.filter(slot => slot.id !== id)
  if (editingScheduleSlotId.value === id) {
    editingScheduleSlotId.value = null
    alternativeSlot.value = { startTime: '15:00', endTime: '16:00', location: '' }
  }
  alternativeScheduleError.value = ''
  scheduleError.value = ''
}

function saveAlternativeScheduleSlot() {
  if (!selectedScheduleDay.value) return
  const candidate = alternativeSlot.value
  if (!candidate.startTime || !candidate.endTime || candidate.endTime <= candidate.startTime) {
    alternativeScheduleError.value = t('clubs.invalidSchedule')
    return
  }
  if (!candidate.location.trim()) {
    alternativeScheduleError.value = t('clubs.locationRequired')
    return
  }
  const hasConflict = slotsFor(selectedScheduleDay.value).some(slot =>
    slot.id !== editingScheduleSlotId.value &&
    candidate.startTime < slot.endTime && candidate.endTime > slot.startTime,
  )
  if (hasConflict) {
    alternativeScheduleError.value = t('clubs.overlappingSchedule')
    return
  }

  if (editingScheduleSlotId.value) {
    const slot = scheduleSlots.value.find(item => item.id === editingScheduleSlotId.value)
    if (slot) Object.assign(slot, { startTime: candidate.startTime, endTime: candidate.endTime, location: candidate.location.trim() })
  } else {
    scheduleSlots.value.push({
      id: `schedule-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      day: selectedScheduleDay.value,
      startTime: candidate.startTime,
      endTime: candidate.endTime,
      location: candidate.location.trim(),
    })
  }
  closeAlternativeScheduleModal()
}

function firstErrorMessage(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(firstErrorMessage).filter(Boolean).join(' ')
  if (value && typeof value === 'object') {
    return Object.values(value).map(firstErrorMessage).filter(Boolean).join(' ')
  }
  return ''
}

function applyBackendErrors(data: unknown) {
  if (!data || typeof data !== 'object') {
    submitError.value = t(isEditing ? 'clubs.updateFailed' : 'clubs.createFailed')
    return
  }

  const errors = data as Record<string, unknown>
  const fieldMap: Record<string, string> = {
    club_name: 'clubName',
    academic_year_id: 'academicYearId',
    start_date: 'startDate',
    end_date: 'endDate',
    status: 'status',
    plan: 'plan',
    criteria: 'criteria',
  }

  Object.entries(errors).forEach(([key, value]) => {
    const message = firstErrorMessage(value)
    if (!message) return
    if (key === 'schedule') scheduleError.value = message
    else if (fieldMap[key]) fieldErrors.value[fieldMap[key]] = message
    else submitError.value = [submitError.value, message].filter(Boolean).join(' ')
  })

  if (!submitError.value && !scheduleError.value && !Object.keys(fieldErrors.value).length) {
    submitError.value = t(isEditing ? 'clubs.updateFailed' : 'clubs.createFailed')
  }
}

async function submitForm() {
  fieldErrors.value = {}
  submitError.value = ''
  scheduleError.value = ''
  if (!form.value.clubName.trim()) fieldErrors.value.clubName = t('validation.required')
  if (!form.value.academicYearId) fieldErrors.value.academicYearId = t('validation.required')
  if (!form.value.startDate) fieldErrors.value.startDate = t('validation.required')
  if (!form.value.endDate) fieldErrors.value.endDate = t('validation.required')
  else if (form.value.startDate && form.value.endDate < form.value.startDate) fieldErrors.value.endDate = t('clubs.invalidDateRange')
  if (Object.keys(fieldErrors.value).length) return

  const commonPayload = {
    club_name: form.value.clubName.trim(),
    academic_year_id: form.value.academicYearId as number,
    start_date: form.value.startDate,
    end_date: form.value.endDate,
    plan: form.value.plan.trim(),
    criteria: form.value.criteria.trim(),
  }

  saving.value = true
  try {
    if (isEditing) {
      const payload: ReplaceClubRequest = {
        ...commonPayload,
        status: form.value.status,
        schedule: scheduleSlots.value.map(slot => ({
          ...(typeof slot.id === 'number' ? { id: slot.id } : {}),
          weekday: slot.day,
          start_time: slot.startTime,
          end_time: slot.endTime,
          location: slot.location.trim(),
        })),
      }
      const { data } = await replaceClubApi(editingClubId, payload)
      success(t('clubs.updatedSuccess', { name: data.club_name }))
      await router.push({ path: `/clubs/${data.id}`, query: { updated: 'true' } })
    } else {
      const payload: CreateClubRequest = {
        ...commonPayload,
        schedule: scheduleSlots.value.map(slot => ({
          weekday: slot.day,
          start_time: slot.startTime,
          end_time: slot.endTime,
          location: slot.location.trim(),
        })),
      }
      const { data } = await createClubApi(payload)
      success(t('clubs.createdSuccess', { name: data.club_name }))
      await router.push({ path: '/clubs', query: { created: 'true' } })
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) applyBackendErrors(error.response.data)
    else submitError.value = t(isEditing ? 'clubs.updateFailed' : 'clubs.createFailed')
  } finally {
    saving.value = false
  }
}
</script>
