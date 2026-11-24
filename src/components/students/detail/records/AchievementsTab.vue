<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">{{ t('students.achievements') }}</h2>
      <div class="flex flex-wrap items-center gap-2">
        <div class="w-44">
          <SelectMenu v-model="yearFilter" :options="yearOptions" :placeholder="t('studentDetail.achievements.allYears')" :aria-label="t('academicYears.title')" clearable :clear-label="t('studentDetail.achievements.allYears')" />
        </div>
        <div class="w-52">
          <SelectMenu v-model="categoryFilter" :options="categoryOptions" :placeholder="t('studentDetail.achievements.allCategories')" :aria-label="t('students.category')" clearable :clear-label="t('studentDetail.achievements.allCategories')" />
        </div>
        <button
          v-if="canEdit"
          type="button"
          class="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-theme-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          @click="openAdd"
        >
          <Plus class="h-4 w-4" aria-hidden="true" />
          {{ t('students.addAchievement') }}
        </button>
      </div>
    </div>

    <StatePanel v-if="error" :loading="false" :error="error" @retry="fetchPage" />

    <div v-else class="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="w-full min-w-[820px] text-left">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th v-for="col in columns" :key="col" scope="col" class="px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400" :class="col === 'common.actions' ? 'text-right' : ''">{{ t(col) }}</th>
            </tr>
          </thead>
          <tbody v-if="loading" aria-busy="true">
            <tr v-for="n in 5" :key="n" class="border-b border-gray-100 last:border-0 dark:border-gray-800">
              <td v-for="c in columns.length" :key="c" class="px-4 py-3"><div class="h-4 animate-pulse rounded bg-gray-100 dark:bg-white/5"></div></td>
            </tr>
          </tbody>
          <tbody v-else-if="rows.length > 0">
            <tr v-for="ach in rows" :key="ach.id" class="border-b border-gray-100 align-top last:border-0 dark:border-gray-800">
              <td class="px-4 py-3">
                <span class="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-theme-xs font-medium text-gray-700 dark:bg-white/5 dark:text-gray-300">{{ t(categoryLabels[ach.category]) }}</span>
              </td>
              <td class="max-w-xs px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                <span class="break-words">{{ ach.description || ach.role || '—' }}</span>
                <span v-if="ach.subject_name" class="ml-1 text-theme-xs text-gray-500 dark:text-gray-400">({{ ach.subject_name }})</span>
              </td>
              <td class="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">{{ ach.award_type || '—' }}</td>
              <td class="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">{{ ach.place || '—' }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                {{ ach.academic_year }}
                <span class="block text-theme-xs text-gray-500 dark:text-gray-400">{{ formatDate(ach.created_at) }}</span>
              </td>
              <td class="px-4 py-3">
                <div v-if="ach.attachments?.length" class="flex flex-wrap items-center gap-1.5">
                  <div v-for="att in ach.attachments" :key="att.id" class="flex items-center gap-0.5 rounded border border-gray-200 bg-gray-50 pl-1 dark:border-gray-700 dark:bg-gray-800/50">
                    <button type="button" class="flex items-center gap-1 rounded px-1 py-1 text-theme-xs text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-brand-400" :title="att.original_name" @click="preview = att">
                      <img v-if="att.file_type.startsWith('image/')" :src="att.file" :alt="att.original_name" class="h-6 w-6 rounded object-cover" />
                      <FileText v-else class="h-4 w-4 text-gray-500" aria-hidden="true" />
                      <span v-if="!att.file_type.startsWith('image/')" class="max-w-[72px] truncate">{{ att.original_name }}</span>
                    </button>
                    <button v-if="canEdit" type="button" class="rounded p-1 text-gray-500 hover:bg-error-50 hover:text-error-600 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-gray-400 dark:hover:bg-error-500/10" :aria-label="t('students.deleteAttachment')" :title="t('students.deleteAttachment')" @click="removeAttachment(att.id)">
                      <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <span v-else class="text-theme-xs text-gray-500 dark:text-gray-400">—</span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button v-if="ach.certificate" type="button" class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-gray-400 dark:hover:bg-white/5" :aria-label="t('students.download')" :title="t('students.download')" @click="downloadCertificate(ach.id)">
                    <Download class="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button v-if="canEdit" type="button" class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-error-50 hover:text-error-600 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-gray-400 dark:hover:bg-error-500/10" :aria-label="t('common.delete')" :title="t('common.delete')" @click="removeAchievement(ach.id)">
                    <Trash2 class="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!loading && rows.length === 0" class="flex flex-col items-center px-4 py-10 text-center">
        <Award class="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" aria-hidden="true" />
        <p class="text-theme-sm text-gray-500 dark:text-gray-400">
          {{ hasFilter ? t('studentDetail.achievements.emptyFiltered') : canEdit ? t('studentDetail.achievements.emptyCanEdit') : t('studentDetail.achievements.empty') }}
        </p>
      </div>
      <Pagination v-if="total > 0" v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" />
    </div>

    <!-- Add modal -->
    <Modal v-if="showAdd" :full-screen-backdrop="true" @close="closeAdd">
      <template #body>
        <div class="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md dark:border-gray-800 dark:bg-gray-900">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.addAchievement') }}</h3>
            <button type="button" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" :aria-label="t('common.cancel')" @click="closeAdd"><X class="h-5 w-5" aria-hidden="true" /></button>
          </div>
          <div class="space-y-4">
            <div>
              <label for="ach-category" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.category') }} <span class="text-error-600" aria-hidden="true">*</span></label>
              <select id="ach-category" v-model="form.category" :class="fieldClass">
                <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label for="ach-year" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('academicYears.title') }} <span class="text-error-600" aria-hidden="true">*</span></label>
              <select id="ach-year" v-model="form.academic_year" :class="fieldClass">
                <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.year }}</option>
              </select>
            </div>
            <template v-if="form.category !== 'extracurricular'">
              <div>
                <label for="ach-award" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.awardType') }}</label>
                <input id="ach-award" v-model="form.award_type" type="text" :placeholder="t('students.awardTypePlaceholder')" :class="fieldClass" />
              </div>
              <div>
                <label for="ach-place" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.place') }}</label>
                <input id="ach-place" v-model="form.place" type="text" :placeholder="t('students.placePlaceholder')" :class="fieldClass" />
              </div>
            </template>
            <template v-else>
              <div>
                <label for="ach-role" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.role') }}</label>
                <input id="ach-role" v-model="form.role" type="text" :placeholder="t('students.rolePlaceholder')" :class="fieldClass" />
              </div>
              <div>
                <label for="ach-duration" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.duration') }}</label>
                <input id="ach-duration" v-model="form.duration" type="text" :placeholder="t('students.durationPlaceholder')" :class="fieldClass" />
              </div>
            </template>
            <div>
              <label for="ach-desc" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('common.description') }}</label>
              <textarea id="ach-desc" v-model="form.description" rows="3" :placeholder="t('students.achievementDescriptionPlaceholder')" class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"></textarea>
            </div>
            <div>
              <span class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.attachments') }}</span>
              <button type="button" class="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-theme-sm text-gray-600 transition-colors hover:border-brand-400 hover:bg-brand-50/50 focus-visible:outline-2 focus-visible:outline-brand-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-brand-500/50" @click="fileInput?.click()">
                <Paperclip class="h-4 w-4" aria-hidden="true" />
                <span>{{ files.length > 0 ? t('studentDetail.achievements.filesSelected', { count: files.length }) : t('students.attachFiles') }}</span>
              </button>
              <input ref="fileInput" type="file" multiple accept="image/*,.pdf,.doc,.docx" class="hidden" @change="onFiles" />
              <div v-if="files.length > 0" class="mt-2 flex flex-wrap gap-1.5">
                <span v-for="(f, idx) in files" :key="idx" class="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-theme-xs font-medium text-gray-700 dark:bg-white/5 dark:text-gray-300">{{ f.name }}</span>
              </div>
            </div>
          </div>
          <div class="mt-6 flex gap-3">
            <button type="button" class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5" @click="closeAdd">{{ t('common.cancel') }}</button>
            <button type="button" :disabled="!form.academic_year || saving" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-theme-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50" @click="submit">
              <Loader2 v-if="saving" class="h-4 w-4 animate-spin" aria-hidden="true" />
              {{ t('common.save') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <DocumentPreviewModal :attachment="preview" @close="preview = null" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Award, Download, FileText, Loader2, Paperclip, Plus, Trash2, X } from 'lucide-vue-next'
import Modal from '@/components/ui/Modal.vue'
import Pagination from '@/components/ui/Pagination.vue'
import SelectMenu from '@/components/ui/SelectMenu.vue'
import DocumentPreviewModal from '@/components/ui/DocumentPreviewModal.vue'
import StatePanel from '@/components/analytics/StatePanel.vue'
import {
  createAchievementApi,
  deleteAchievementApi,
  deleteAttachmentApi,
  downloadAchievementCertificateApi,
  getAchievementsPageApi,
  uploadAttachmentsApi,
} from '@/api/achievements'
import { getAcademicYearsApi } from '@/api/academic'
import type { AcademicYear } from '@/types/academic'
import type { Achievement, AchievementCategory, Attachment } from '@/types/achievement'
import { useToast } from '@/composables/useToast'
import { currentIntlLocale } from '@/i18n'

const props = defineProps<{ studentPk: number; canEdit: boolean }>()

const { t } = useI18n()
const toast = useToast()

const columns = [
  'students.category',
  'common.description',
  'students.awardType',
  'students.place',
  'studentDetail.achievements.colYear',
  'students.attachments',
  'common.actions',
]
const categoryLabels: Record<AchievementCategory, string> = {
  olympiad: 'students.olympiad',
  additional_education: 'students.additionalEducation',
  extracurricular: 'students.extracurricular',
  project: 'students.project',
}
const categoryOptions = computed(() =>
  (Object.keys(categoryLabels) as AchievementCategory[]).map(value => ({ value, label: t(categoryLabels[value]) })),
)
const fieldClass =
  'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30'

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat(currentIntlLocale(), { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

// ─── Academic years: one fetch per mount, feeds both the filter and the modal ──
const academicYears = ref<AcademicYear[]>([])
const yearOptions = computed(() => academicYears.value.map(y => ({ value: y.id, label: y.year })))

async function fetchYears() {
  try {
    academicYears.value = (await getAcademicYearsApi()).data
  } catch {
    toast.error(t('common.serverError'))
  }
}

// ─── List ───────────────────────────────────────────────────────────────────
const rows = ref<Achievement[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const yearFilter = ref<number | string | null>(null)
const categoryFilter = ref<number | string | null>(null)
const loading = ref(true)
const error = ref('')
const preview = ref<Attachment | null>(null)
const hasFilter = computed(() => yearFilter.value !== null || categoryFilter.value !== null)
let requestId = 0

async function fetchPage() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const res = await getAchievementsPageApi(props.studentPk, {
      page: page.value,
      page_size: pageSize.value,
      year: yearFilter.value ? Number(yearFilter.value) : undefined,
      category: categoryFilter.value ? String(categoryFilter.value) : undefined,
    })
    if (id !== requestId) return
    rows.value = res.results
    total.value = res.count
  } catch {
    if (id !== requestId) return
    error.value = t('common.serverError')
  } finally {
    if (id === requestId) loading.value = false
  }
}

watch([page, pageSize], fetchPage)
watch([yearFilter, categoryFilter], () => {
  if (page.value === 1) fetchPage()
  else page.value = 1
})
watch(() => props.studentPk, () => {
  page.value = 1
  fetchPage()
})
onMounted(() => {
  fetchPage()
  fetchYears()
})

/** Re-fetch, stepping back a page when the current one just emptied. */
async function reloadAfterRemove() {
  if (rows.value.length === 1 && page.value > 1) page.value -= 1
  else await fetchPage()
}

// ─── Add ────────────────────────────────────────────────────────────────────
const showAdd = ref(false)
const saving = ref(false)
const files = ref<File[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const form = ref({
  academic_year: null as number | null,
  category: 'olympiad' as AchievementCategory,
  award_type: '',
  place: '',
  role: '',
  duration: '',
  description: '',
})

function openAdd() {
  const active = academicYears.value.find(y => y.is_active)
  form.value = { academic_year: active?.id ?? null, category: 'olympiad', award_type: '', place: '', role: '', duration: '', description: '' }
  files.value = []
  showAdd.value = true
}

function closeAdd() {
  showAdd.value = false
  files.value = []
}

function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) files.value = Array.from(input.files)
}

async function submit() {
  if (!form.value.academic_year) return
  saving.value = true
  try {
    const res = await createAchievementApi(props.studentPk, {
      academic_year: form.value.academic_year,
      category: form.value.category,
      award_type: form.value.award_type || undefined,
      place: form.value.place || undefined,
      role: form.value.role || undefined,
      duration: form.value.duration || undefined,
      description: form.value.description || undefined,
    })
    if (files.value.length > 0) {
      try {
        await uploadAttachmentsApi('achievement', res.data.id, files.value)
      } catch {
        toast.error(t('studentDetail.achievements.uploadFailed'))
      }
    }
    closeAdd()
    if (page.value === 1) await fetchPage()
    else page.value = 1
  } catch {
    toast.error(t('common.serverError'))
  } finally {
    saving.value = false
  }
}

// ─── Delete / download ──────────────────────────────────────────────────────
async function removeAchievement(id: number) {
  if (!confirm(t('students.confirmDeleteAchievement'))) return
  try {
    await deleteAchievementApi(id)
    await reloadAfterRemove()
  } catch {
    toast.error(t('common.serverError'))
  }
}

async function removeAttachment(attachmentId: number) {
  if (!confirm(t('students.confirmDeleteAttachment'))) return
  try {
    await deleteAttachmentApi(attachmentId)
    rows.value = rows.value.map(a => ({ ...a, attachments: (a.attachments || []).filter(att => att.id !== attachmentId) }))
  } catch {
    toast.error(t('common.serverError'))
  }
}

async function downloadCertificate(id: number) {
  try {
    const { data, headers } = await downloadAchievementCertificateApi(id)
    const match = (headers['content-disposition'] || '').match(/filename="?(.+?)"?$/)
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = match?.[1] || 'certificate'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.error(t('common.serverError'))
  }
}
</script>
