<template>
  <AdminLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <router-link to="/clubs" class="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-brand-500 dark:text-gray-400">
        <ArrowLeft class="h-4 w-4" />
        {{ t('clubs.backToClubs') }}
      </router-link>

      <div v-if="loading" class="flex min-h-72 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <Loader2 class="h-7 w-7 animate-spin text-brand-500" />
      </div>

      <template v-else-if="club">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex min-w-0 items-center gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
              <Puzzle class="h-6 w-6 text-brand-500" />
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">{{ club.club_name }}</h1>
                <ClubStatusBadge :status="club.status" />
              </div>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ club.academic_year.year }} · {{ formatDateRange(club.start_date, club.end_date) }}</p>
            </div>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row">
            <button type="button" @click="confirmClubDeletion" class="inline-flex items-center justify-center gap-2 rounded-lg border border-error-300 bg-white px-4 py-2.5 text-sm font-medium text-error-600 shadow-theme-xs hover:bg-error-50 dark:border-error-500/30 dark:bg-gray-900 dark:text-error-400 dark:hover:bg-error-500/10">
              <Trash2 class="h-4 w-4" /> {{ t('clubs.deleteClub') }}
            </button>
            <router-link :to="`/clubs/${club.id}/edit`" class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5">
              <Pencil class="h-4 w-4" /> {{ t('clubs.editClub') }}
            </router-link>
            <router-link :to="`/clubs/${club.id}/attendance`" class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600">
              <ClipboardCheck class="h-4 w-4" /> {{ t('clubs.checkAttendance') }}
            </router-link>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.members') }}</p>
            <p class="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">{{ membersTotal }}</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.sessionsPerWeekLabel') }}</p>
            <p class="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">{{ club.sessions_per_week }}</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.attendanceDates') }}</p>
            <p class="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">{{ club.attendance_dates_count }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div class="space-y-6 lg:col-span-2">
            <section class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div class="mb-5 flex items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10"><CalendarClock class="h-4 w-4 text-brand-500" /></div>
                <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clubs.weeklySchedule') }}</h2>
              </div>
              <div v-if="club.schedule.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div v-for="slot in sortedSchedule" :key="slot.id" class="flex items-center gap-3 rounded-lg border border-gray-200 p-3.5 dark:border-gray-800">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-light-100 dark:bg-blue-light-500/10"><Clock3 class="h-4 w-4 text-blue-light-600 dark:text-blue-light-400" /></div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ dayName(slot.weekday) }} · {{ formatTime(slot.start_time) }}–{{ formatTime(slot.end_time) }}</p>
                    <p class="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><MapPin class="h-3 w-3" />{{ slot.location }}</p>
                  </div>
                </div>
              </div>
              <p v-else class="text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.noSchedule') }}</p>
            </section>

            <section class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div class="mb-5 flex items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-light-100 dark:bg-blue-light-500/10"><ClipboardList class="h-4 w-4 text-blue-light-600 dark:text-blue-light-400" /></div>
                <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clubs.programDetails') }}</h2>
              </div>
              <dl class="space-y-5">
                <div><dt class="text-xs font-medium uppercase tracking-wide text-gray-400">{{ t('students.plan') }}</dt><dd class="mt-1.5 whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300">{{ club.plan || '—' }}</dd></div>
                <div><dt class="text-xs font-medium uppercase tracking-wide text-gray-400">{{ t('students.criteria') }}</dt><dd class="mt-1.5 text-sm text-gray-700 dark:text-gray-300">{{ club.criteria || '—' }}</dd></div>
              </dl>
            </section>
          </div>

          <div class="space-y-6">
            <section class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clubs.members') }}</h2>
                <button type="button" class="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-2 text-xs font-medium text-brand-600 transition hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20" @click="openAvailableStudents">
                  <UserPlus class="h-3.5 w-3.5" /> {{ t('clubs.registerUsers') }}
                </button>
              </div>
              <div v-if="members.length" class="mt-4 space-y-3">
                <div v-for="member in members" :key="member.id" class="flex items-center gap-3">
                  <img v-if="member.avatar && !failedAvatarIds.has(member.id)" :src="resolveMediaUrl(member.avatar)" :alt="member.full_name" class="h-9 w-9 shrink-0 rounded-full object-cover" @error="markAvatarFailed(member.id)" />
                  <span v-else class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">{{ memberInitials(member) }}</span>
                  <div class="min-w-0 flex-1"><p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">{{ member.full_name }}</p><p class="text-xs text-gray-500 dark:text-gray-400">{{ member.class_name }}</p></div>
                  <button type="button" :aria-label="t('clubs.removeMember')" :title="t('clubs.removeMember')" @click="confirmMemberRemoval(member)" class="rounded-lg p-2 text-gray-400 transition hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10">
                    <UserMinus class="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p v-else class="mt-4 text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.noMembers') }}</p>
            </section>

            <section class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.attachments') }}</h2>
                <button type="button" :disabled="attachmentUploading" class="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-2 text-xs font-medium text-brand-600 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20" @click="attachmentInput?.click()">
                  <Loader2 v-if="attachmentUploading" class="h-3.5 w-3.5 animate-spin" /><Upload v-else class="h-3.5 w-3.5" /> {{ t('clubs.uploadAttachments') }}
                </button>
                <input ref="attachmentInput" type="file" multiple accept="image/*,.pdf,application/pdf" class="hidden" @change="uploadAttachments" />
              </div>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">{{ t('clubs.attachmentSizeHint') }}</p>
              <div v-if="club.attachments.length" class="mt-4 space-y-2">
                <div v-for="file in club.attachments" :key="file.id" class="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                  <button type="button" class="flex min-w-0 flex-1 items-center gap-2 py-0.5 text-left transition hover:text-brand-500" @click="openAttachmentPreview(file)"><Paperclip class="h-4 w-4 shrink-0 text-gray-400" /><span class="truncate">{{ file.name }}</span></button>
                  <button type="button" :disabled="actionPending" :aria-label="t('clubs.deleteAttachment')" :title="t('clubs.deleteAttachment')" class="rounded-md p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-error-500/10" @click="confirmAttachmentDeletion(file)"><Trash2 class="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <p v-else class="mt-4 text-sm text-gray-500 dark:text-gray-400">{{ t('students.noAttachments') }}</p>
            </section>
          </div>
        </div>
      </template>

      <div v-else-if="notFound" class="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
        <CircleAlert class="mx-auto h-8 w-8 text-gray-400" />
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.notFound') }}</p>
      </div>

      <div v-else class="rounded-xl border border-error-200 bg-error-50 px-6 py-12 text-center dark:border-error-500/20 dark:bg-error-500/10">
        <CircleAlert class="mx-auto h-8 w-8 text-error-500" />
        <p class="mt-3 text-sm text-error-600 dark:text-error-400">{{ t('clubs.detailLoadError') }}</p>
        <button type="button" class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600" @click="loadClub">{{ t('clubs.tryAgain') }}</button>
      </div>
    </div>

    <Modal v-if="confirmation" :full-screen-backdrop="true" @close="confirmation = null">
      <template #body>
        <div class="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          <div class="flex h-11 w-11 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/10">
            <Trash2 class="h-5 w-5 text-error-500" />
          </div>
          <h3 class="mt-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ confirmationTitle }}</h3>
          <p class="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {{ confirmationMessage }}
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" :disabled="actionPending" @click="confirmation = null" class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5">{{ t('common.cancel') }}</button>
            <button type="button" :disabled="actionPending" @click="performConfirmedAction" class="inline-flex items-center gap-2 rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-60"><Loader2 v-if="actionPending" class="h-4 w-4 animate-spin" />{{ confirmationActionLabel }}</button>
          </div>
        </div>
      </template>
    </Modal>

    <Modal v-if="availableStudentsOpen" :full-screen-backdrop="true" @close="availableStudentsOpen = false">
      <template #body>
        <div class="relative z-10 w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('clubs.availableStudents') }}</h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.availableStudentsHint') }}</p>
            </div>
            <button type="button" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" @click="availableStudentsOpen = false"><X class="h-5 w-5" /></button>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="relative">
              <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input v-model="availableSearch" type="search" :placeholder="t('clubs.searchStudents')" class="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </label>
            <ClubClassGroupSelect
              v-model="availableClassGroupId"
              :class-groups="classGroups"
              :all-label="t('clubs.allClasses')"
              :aria-label="t('students.class')"
            />
          </div>

          <div class="mt-5 max-h-96 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <div v-if="availableStudentsLoading" class="flex min-h-48 items-center justify-center"><Loader2 class="h-6 w-6 animate-spin text-brand-500" /></div>
            <div v-else-if="availableStudentsError" class="px-5 py-10 text-center">
              <CircleAlert class="mx-auto h-7 w-7 text-error-500" />
              <p class="mt-2 text-sm text-error-500">{{ t('clubs.availableStudentsLoadError') }}</p>
              <button type="button" class="mt-3 text-sm font-medium text-brand-500 hover:text-brand-600" @click="fetchAvailableStudents">{{ t('clubs.tryAgain') }}</button>
            </div>
            <div v-else-if="availableStudents.length" class="divide-y divide-gray-100 dark:divide-gray-800">
              <label v-for="student in availableStudents" :key="student.id" class="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-gray-50 dark:hover:bg-white/5">
                <input type="checkbox" :checked="selectedStudentIds.has(student.id)" class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900" @change="toggleStudentSelection(student.id)" />
                <img v-if="student.avatar && !failedAvatarIds.has(student.id)" :src="resolveMediaUrl(student.avatar)" :alt="student.full_name" class="h-10 w-10 shrink-0 rounded-full object-cover" @error="markAvatarFailed(student.id)" />
                <span v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">{{ memberInitials(student) }}</span>
                <div class="min-w-0 flex-1"><p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">{{ student.full_name }}</p><p class="text-xs text-gray-500 dark:text-gray-400">{{ student.class_name }}</p></div>
              </label>
            </div>
            <div v-else class="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.noAvailableStudents') }}</div>
          </div>

          <Pagination v-if="!availableStudentsLoading && !availableStudentsError && availableStudentsTotal > 0" class="mt-5" :total="availableStudentsTotal" v-model:current-page="availableStudentsPage" v-model:page-size="availableStudentsPageSize" :page-sizes="[20, 50, 100]" />

          <div class="mt-6 flex items-center justify-between gap-3">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('clubs.selectedCount', { count: selectedStudentIds.size }) }}</span>
            <div class="flex gap-3">
              <button type="button" :disabled="memberUpdatePending" class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5" @click="availableStudentsOpen = false">{{ t('common.cancel') }}</button>
              <button type="button" :disabled="!selectedStudentIds.size || memberUpdatePending" class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60" @click="registerSelectedStudents"><Loader2 v-if="memberUpdatePending" class="h-4 w-4 animate-spin" />{{ t('clubs.registerUsers') }}</button>
            </div>
          </div>
        </div>
      </template>
    </Modal>

    <DocumentPreviewModal :attachment="clubPreviewAttachment" @close="selectedAttachment = null" />
  </AdminLayout>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CalendarClock, CircleAlert, ClipboardCheck, ClipboardList, Clock3, Loader2, MapPin, Paperclip, Pencil, Puzzle, Search, Trash2, Upload, UserMinus, UserPlus, X } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ClubClassGroupSelect from '@/components/clubs/ClubClassGroupSelect.vue'
import ClubStatusBadge from '@/components/clubs/ClubStatusBadge.vue'
import DocumentPreviewModal from '@/components/ui/DocumentPreviewModal.vue'
import Modal from '@/components/ui/Modal.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { getClassGroupsApi } from '@/api/academic'
import { deleteClubApi, deleteClubAttachmentApi, getAvailableClubStudentsApi, getClubApi, getClubMembersApi, removeClubMemberApi, replaceClubMembersApi, uploadClubAttachmentsApi, type ClubAttachment, type ClubDetail, type ClubMember, type ClubWeekday } from '@/api/clubs'
import { useDebounce } from '@/composables/useDebounce'
import { useToast } from '@/composables/useToast'
import type { ClassGroup } from '@/types/academic'
import type { Attachment } from '@/types/achievement'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { success, error: showError } = useToast()
const club = ref<ClubDetail | null>(null)
const loading = ref(true)
const notFound = ref(false)
const actionPending = ref(false)
const confirmation = ref<{ type: 'club' | 'member' | 'attachment'; member?: ClubMember; attachment?: ClubAttachment } | null>(null)
const attachmentInput = ref<HTMLInputElement | null>(null)
const attachmentUploading = ref(false)
const selectedAttachment = ref<ClubAttachment | null>(null)
const members = ref<ClubMember[]>([])
const membersTotal = ref(0)
const availableStudentsOpen = ref(false)
const availableStudents = ref<ClubMember[]>([])
const availableStudentsTotal = ref(0)
const availableStudentsLoading = ref(false)
const availableStudentsError = ref(false)
const availableSearch = ref('')
const debouncedAvailableSearch = useDebounce(availableSearch, 600)
const availableClassGroupId = ref<number | ''>('')
const availableStudentsPage = ref(1)
const availableStudentsPageSize = ref(50)
const classGroups = ref<ClassGroup[]>([])
const selectedStudentIds = ref<Set<number>>(new Set())
const memberUpdatePending = ref(false)
const failedAvatarIds = ref<Set<number>>(new Set())
const dayOrder: ClubWeekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const sortedSchedule = computed(() => club.value ? [...club.value.schedule].sort((a, b) => dayOrder.indexOf(a.weekday) - dayOrder.indexOf(b.weekday) || a.start_time.localeCompare(b.start_time)) : [])
const confirmationTitle = computed(() => {
  if (confirmation.value?.type === 'club') return t('clubs.deleteClub')
  if (confirmation.value?.type === 'attachment') return t('clubs.deleteAttachment')
  return t('clubs.removeMember')
})
const confirmationMessage = computed(() => {
  if (confirmation.value?.type === 'club') return t('clubs.confirmDeleteClub', { name: club.value?.club_name })
  if (confirmation.value?.type === 'attachment') return t('clubs.confirmDeleteAttachment', { name: confirmation.value.attachment?.name })
  return t('clubs.confirmRemoveMember', { name: confirmation.value?.member?.full_name })
})
const confirmationActionLabel = computed(() => confirmation.value?.type === 'member' ? t('clubs.remove') : t('common.delete'))
const clubPreviewAttachment = computed<Attachment | null>(() => {
  if (!selectedAttachment.value) return null
  return {
    id: selectedAttachment.value.id,
    file: resolveAttachmentUrl(selectedAttachment.value.url),
    file_type: attachmentMimeType(selectedAttachment.value.name),
    original_name: selectedAttachment.value.name,
    created_at: '',
  }
})

onMounted(loadClub)

watch([debouncedAvailableSearch, availableClassGroupId, availableStudentsPageSize], () => {
  if (!availableStudentsOpen.value) return
  if (availableStudentsPage.value === 1) fetchAvailableStudents()
  else availableStudentsPage.value = 1
})

watch(availableStudentsPage, () => {
  if (availableStudentsOpen.value) fetchAvailableStudents()
})

async function loadClub() {
  loading.value = true
  notFound.value = false
  try {
    const [clubResponse, membersResponse] = await Promise.all([
      getClubApi(String(route.params.id)),
      getClubMembersApi(String(route.params.id)),
    ])
    club.value = clubResponse.data
    members.value = membersResponse.data.results
    membersTotal.value = membersResponse.data.count
  } catch (error) {
    club.value = null
    members.value = []
    membersTotal.value = 0
    notFound.value = axios.isAxiosError(error) && error.response?.status === 404
  } finally {
    loading.value = false
  }
}

async function openAvailableStudents() {
  availableStudentsOpen.value = true
  selectedStudentIds.value = new Set()
  if (!classGroups.value.length) {
    getClassGroupsApi().then(({ data }) => {
      classGroups.value = data
    }).catch(() => {
      classGroups.value = []
    })
  }
  await fetchAvailableStudents()
}

function toggleStudentSelection(studentId: number) {
  const next = new Set(selectedStudentIds.value)
  if (next.has(studentId)) next.delete(studentId)
  else next.add(studentId)
  selectedStudentIds.value = next
}

async function registerSelectedStudents() {
  if (!club.value || !selectedStudentIds.value.size) return
  memberUpdatePending.value = true
  try {
    const studentIds = [...new Set([
      ...members.value.map(member => member.id),
      ...selectedStudentIds.value,
    ])]
    const { data } = await replaceClubMembersApi(club.value.id, { student_ids: studentIds })
    members.value = data.members
    membersTotal.value = data.member_count
    club.value = {
      ...club.value,
      member_count: data.member_count,
      members: data.members,
    }
    availableStudentsOpen.value = false
    selectedStudentIds.value = new Set()
    success(t('clubs.membersUpdated'))
  } catch (error) {
    const detail = axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string'
      ? error.response.data.detail
      : undefined
    showError(t('clubs.membersUpdateFailed'), detail)
  } finally {
    memberUpdatePending.value = false
  }
}

async function fetchAvailableStudents() {
  if (!club.value) return
  availableStudentsLoading.value = true
  availableStudentsError.value = false
  try {
    const { data } = await getAvailableClubStudentsApi({
      club_id: club.value.id,
      search: debouncedAvailableSearch.value.trim() || undefined,
      class_group: availableClassGroupId.value || undefined,
      page: availableStudentsPage.value,
      page_size: availableStudentsPageSize.value,
    })
    availableStudents.value = data.results
    availableStudentsTotal.value = data.count
  } catch {
    availableStudents.value = []
    availableStudentsTotal.value = 0
    availableStudentsError.value = true
  } finally {
    availableStudentsLoading.value = false
  }
}

function confirmClubDeletion() {
  confirmation.value = { type: 'club' }
}

function confirmMemberRemoval(member: ClubMember) {
  confirmation.value = { type: 'member', member }
}

function confirmAttachmentDeletion(attachment: ClubAttachment) {
  confirmation.value = { type: 'attachment', attachment }
}

function openAttachmentPreview(attachment: ClubAttachment) {
  selectedAttachment.value = attachment
}

function resolveAttachmentUrl(url: string): string {
  return resolveMediaUrl(url)
}

function attachmentMimeType(name: string): string {
  const extension = name.split('.').pop()?.toLowerCase()
  if (extension === 'pdf') return 'application/pdf'
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  if (extension === 'svg') return 'image/svg+xml'
  if (extension && ['png', 'gif', 'webp', 'avif', 'bmp'].includes(extension)) return `image/${extension}`
  return 'application/octet-stream'
}

async function uploadAttachments(event: Event) {
  if (!club.value) return
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return

  const unsupportedFile = files.find(file => !isAllowedAttachment(file))
  if (unsupportedFile) {
    showError(t('clubs.attachmentUnsupportedType', { name: unsupportedFile.name }))
    return
  }

  const oversizedFile = files.find(file => file.size > 10 * 1024 * 1024)
  if (oversizedFile) {
    showError(t('clubs.attachmentTooLarge', { name: oversizedFile.name }))
    return
  }

  attachmentUploading.value = true
  try {
    const { data } = await uploadClubAttachmentsApi(club.value.id, files)
    const attachments = new Map(club.value.attachments.map(file => [file.id, file]))
    data.attachments.forEach(file => attachments.set(file.id, file))
    club.value = { ...club.value, attachments: [...attachments.values()] }
    success(t('clubs.attachmentsUploaded', { count: data.attachments.length }))
  } catch (error) {
    showError(t('clubs.attachmentUploadFailed'), apiErrorDetail(error))
  } finally {
    attachmentUploading.value = false
  }
}

function isAllowedAttachment(file: File): boolean {
  const name = file.name.toLowerCase()
  return file.type.startsWith('image/')
    || file.type === 'application/pdf'
    || name.endsWith('.pdf')
}

async function performConfirmedAction() {
  if (!club.value || !confirmation.value) return
  if (confirmation.value.type === 'club') {
    const clubName = club.value.club_name
    actionPending.value = true
    try {
      await deleteClubApi(club.value.id)
      confirmation.value = null
      success(t('clubs.clubDeleted'), clubName)
      await router.push('/clubs')
    } catch {
      showError(t('clubs.deleteFailed'))
    } finally {
      actionPending.value = false
    }
    return
  }

  if (confirmation.value.type === 'attachment') {
    const attachment = confirmation.value.attachment
    if (!attachment) return
    actionPending.value = true
    try {
      await deleteClubAttachmentApi(club.value.id, attachment.id)
      club.value = {
        ...club.value,
        attachments: club.value.attachments.filter(file => file.id !== attachment.id),
      }
      confirmation.value = null
      success(t('clubs.attachmentDeleted'), attachment.name)
    } catch (error) {
      showError(t('clubs.attachmentDeleteFailed'), apiErrorDetail(error))
    } finally {
      actionPending.value = false
    }
    return
  }

  const member = confirmation.value.member
  if (!member) return
  actionPending.value = true
  try {
    const { data } = await removeClubMemberApi(club.value.id, member.id)
    members.value = members.value.filter(item => item.id !== data.student_id)
    membersTotal.value = data.member_count
    club.value = {
      ...club.value,
      member_count: data.member_count,
      members: club.value.members.filter(item => item.id !== data.student_id),
    }
    confirmation.value = null
    success(t('clubs.memberRemoved'), member.full_name)
  } catch (error) {
    const detail = axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string'
      ? error.response.data.detail
      : undefined
    showError(t('clubs.memberRemoveFailed'), detail)
  } finally {
    actionPending.value = false
  }
}

function formatDateRange(startDate: string, endDate: string): string {
  const locale = document.documentElement.lang || 'ru'
  const format = (value: string) => new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
  return `${format(startDate)} – ${format(endDate)}`
}

function dayName(day: ClubWeekday): string {
  return t(`lessons.days.${day}`)
}

function formatTime(value: string): string {
  return value.slice(0, 5)
}

function memberInitials(member: ClubMember): string {
  return `${member.first_name.charAt(0)}${member.last_name.charAt(0)}`.toUpperCase()
}

function resolveMediaUrl(url: string): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined
  const baseOrigin = apiBase ? new URL(apiBase, window.location.origin).origin : window.location.origin
  return new URL(url, baseOrigin).href
}

function markAvatarFailed(studentId: number) {
  failedAvatarIds.value = new Set([...failedAvatarIds.value, studentId])
}

function apiErrorDetail(error: unknown): string | undefined {
  return axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string'
    ? error.response.data.detail
    : undefined
}
</script>
