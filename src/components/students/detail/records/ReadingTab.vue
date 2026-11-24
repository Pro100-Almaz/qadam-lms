<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">{{ t('students.readingList') }}</h2>
      <button
        v-if="canEdit"
        type="button"
        class="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-theme-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        @click="openAdd"
      >
        <Plus class="h-4 w-4" aria-hidden="true" />
        {{ t('students.addReadingEntry') }}
      </button>
    </div>

    <StatePanel v-if="error" :loading="false" :error="error" @retry="fetchPage" />

    <div v-else class="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="w-full min-w-[640px] text-left">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th scope="col" class="w-16 px-4 py-3"><span class="sr-only">{{ t('students.cover') }}</span></th>
              <th scope="col" class="px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('students.bookTitle') }}</th>
              <th scope="col" class="px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('studentDetail.reading.colPeriod') }}</th>
              <th scope="col" class="px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('students.pagesRead') }}</th>
              <th scope="col" class="px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('students.testScore') }}</th>
              <th v-if="canEdit" scope="col" class="px-4 py-3 text-right text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody v-if="loading" aria-busy="true">
            <tr v-for="n in 5" :key="n" class="border-b border-gray-100 last:border-0 dark:border-gray-800">
              <td v-for="c in canEdit ? 6 : 5" :key="c" class="px-4 py-3"><div class="h-4 animate-pulse rounded bg-gray-100 dark:bg-white/5"></div></td>
            </tr>
          </tbody>
          <tbody v-else-if="rows.length > 0">
            <tr v-for="entry in rows" :key="entry.id" class="border-b border-gray-100 last:border-0 dark:border-gray-800">
              <td class="px-4 py-2">
                <img v-if="entry.cover" :src="entry.cover" :alt="entry.title" class="h-[40px] w-[30px] rounded object-cover" />
                <span v-else class="flex h-[40px] w-[30px] items-center justify-center rounded bg-gray-100 dark:bg-white/5">
                  <BookText class="h-4 w-4 text-gray-400" aria-hidden="true" />
                </span>
              </td>
              <td class="max-w-xs px-4 py-2 text-theme-sm font-medium text-gray-800 dark:text-white/90"><span class="line-clamp-2 break-words">{{ entry.title }}</span></td>
              <td class="whitespace-nowrap px-4 py-2 text-theme-sm text-gray-700 dark:text-gray-300">{{ monthName(entry.month) }} · {{ entry.academic_year }}</td>
              <td class="px-4 py-2 text-theme-sm tabular-nums text-gray-700 dark:text-gray-300">{{ entry.pages_read }}</td>
              <td class="px-4 py-2 text-theme-sm tabular-nums text-gray-700 dark:text-gray-300">{{ entry.test_score !== null ? `${entry.test_score}%` : '—' }}</td>
              <td v-if="canEdit" class="px-4 py-2 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button type="button" class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-gray-400 dark:hover:bg-white/5" :aria-label="t('common.edit')" :title="t('common.edit')" @click="openEdit(entry)">
                    <Pencil class="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-error-50 hover:text-error-600 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-gray-400 dark:hover:bg-error-500/10" :aria-label="t('common.delete')" :title="t('common.delete')" @click="remove(entry.id)">
                    <Trash2 class="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!loading && rows.length === 0" class="flex flex-col items-center px-4 py-10 text-center">
        <BookText class="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" aria-hidden="true" />
        <p class="text-theme-sm text-gray-500 dark:text-gray-400">{{ canEdit ? t('studentDetail.reading.emptyCanEdit') : t('studentDetail.reading.empty') }}</p>
      </div>
      <Pagination v-if="total > 0" v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" />
    </div>

    <Modal v-if="showModal" :full-screen-backdrop="true" @close="closeModal">
      <template #body>
        <div class="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md dark:border-gray-800 dark:bg-gray-900">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ editingId ? t('students.editReadingEntry') : t('students.addReadingEntry') }}</h3>
            <button type="button" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" :aria-label="t('common.cancel')" @click="closeModal"><X class="h-5 w-5" aria-hidden="true" /></button>
          </div>
          <div class="space-y-4">
            <div>
              <label for="rd-title" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.bookTitle') }} <span class="text-error-600" aria-hidden="true">*</span></label>
              <input id="rd-title" v-model="form.title" type="text" :class="fieldClass" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="rd-year" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('academicYears.title') }} <span class="text-error-600" aria-hidden="true">*</span></label>
                <select id="rd-year" v-model="form.academic_year" :class="fieldClass">
                  <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.year }}</option>
                </select>
              </div>
              <div>
                <label for="rd-month" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.month') }} <span class="text-error-600" aria-hidden="true">*</span></label>
                <select id="rd-month" v-model="form.month" :class="fieldClass">
                  <option v-for="m in 12" :key="m" :value="m">{{ monthName(m) }}</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="rd-pages" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.pagesRead') }}</label>
                <input id="rd-pages" v-model.number="form.pages_read" type="number" min="0" :class="fieldClass" />
              </div>
              <div>
                <label for="rd-score" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.testScore') }}</label>
                <input id="rd-score" v-model.number="form.test_score" type="number" min="0" max="100" placeholder="0-100" :class="fieldClass" />
              </div>
            </div>
            <div>
              <span class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.cover') }}</span>
              <div v-if="coverPreview" class="relative inline-block">
                <img :src="coverPreview" :alt="t('students.cover')" class="h-28 w-20 rounded-lg border border-gray-200 object-cover dark:border-gray-700" />
                <button type="button" class="absolute -right-2 -top-2 rounded-full bg-gray-800 p-1 text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-brand-600" :aria-label="t('common.delete')" @click="removeCover"><X class="h-3 w-3" aria-hidden="true" /></button>
              </div>
              <button v-else type="button" class="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-3 text-theme-sm text-gray-600 hover:border-brand-300 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400" @click="coverInput?.click()">
                <ImagePlus class="h-4 w-4" aria-hidden="true" />
                <span>{{ t('students.attachCover') }}</span>
              </button>
              <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="onCover" />
            </div>
          </div>
          <div class="mt-6 flex gap-3">
            <button type="button" class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5" @click="closeModal">{{ t('common.cancel') }}</button>
            <button type="button" :disabled="!form.title || !form.academic_year || saving" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-theme-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50" @click="submit">
              <Loader2 v-if="saving" class="h-4 w-4 animate-spin" aria-hidden="true" />
              {{ t('common.save') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BookText, ImagePlus, Loader2, Pencil, Plus, Trash2, X } from 'lucide-vue-next'
import Modal from '@/components/ui/Modal.vue'
import Pagination from '@/components/ui/Pagination.vue'
import StatePanel from '@/components/analytics/StatePanel.vue'
import {
  createReadingEntryApi,
  deleteReadingEntryApi,
  getReadingEntriesPageApi,
  updateReadingEntryApi,
} from '@/api/achievements'
import { getAcademicYearsApi } from '@/api/academic'
import type { AcademicYear } from '@/types/academic'
import type { CreateReadingEntryRequest, ReadingEntry } from '@/types/achievement'
import { useToast } from '@/composables/useToast'
import { currentIntlLocale } from '@/i18n'

const props = defineProps<{ studentPk: number; canEdit: boolean }>()

const { t } = useI18n()
const toast = useToast()

const fieldClass =
  'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30'

function monthName(month: number): string {
  return new Intl.DateTimeFormat(currentIntlLocale(), { month: 'long' }).format(new Date(2000, month - 1, 1))
}

// ─── Academic years: one fetch per mount, only needed by the modal ──────────
const academicYears = ref<AcademicYear[]>([])
async function fetchYears() {
  try {
    academicYears.value = (await getAcademicYearsApi()).data
  } catch {
    toast.error(t('common.serverError'))
  }
}

// ─── List ───────────────────────────────────────────────────────────────────
const rows = ref<ReadingEntry[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(true)
const error = ref('')
let requestId = 0

async function fetchPage() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const res = await getReadingEntriesPageApi(props.studentPk, { page: page.value, page_size: pageSize.value })
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
watch(() => props.studentPk, () => {
  page.value = 1
  fetchPage()
})
onMounted(() => {
  fetchPage()
  if (props.canEdit) fetchYears()
})

// ─── Add / edit ─────────────────────────────────────────────────────────────
const showModal = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ academic_year: null as number | null, title: '', month: 1, pages_read: 0, test_score: null as number | null })
const cover = ref<File | null>(null)
const coverPreview = ref<string | null>(null)
const coverCleared = ref(false)
const coverInput = ref<HTMLInputElement | null>(null)

function clearCover() {
  // Only blob: URLs are ours to revoke; a stored cover is a server URL.
  if (coverPreview.value?.startsWith('blob:')) URL.revokeObjectURL(coverPreview.value)
  cover.value = null
  coverPreview.value = null
  coverCleared.value = false
  if (coverInput.value) coverInput.value.value = ''
}

function onCover(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  clearCover()
  cover.value = file
  coverPreview.value = file ? URL.createObjectURL(file) : null
}

// Dropping a cover already stored on the entry must be sent as an empty `cover`;
// dropping a file the user just picked only resets the input.
function removeCover() {
  const wasStored = !cover.value && !!coverPreview.value
  clearCover()
  coverCleared.value = wasStored
}

function openAdd() {
  const active = academicYears.value.find(y => y.is_active)
  editingId.value = null
  form.value = { academic_year: active?.id ?? null, title: '', month: new Date().getMonth() + 1, pages_read: 0, test_score: null }
  clearCover()
  showModal.value = true
}

function openEdit(entry: ReadingEntry) {
  // The entry serializes its year as a label ("2020/2021"); the select needs the pk.
  const year = academicYears.value.find(y => y.year === entry.academic_year)
  editingId.value = entry.id
  form.value = { academic_year: year?.id ?? null, title: entry.title, month: entry.month, pages_read: entry.pages_read, test_score: entry.test_score }
  clearCover()
  coverPreview.value = entry.cover
  showModal.value = true
}

function closeModal() {
  clearCover()
  editingId.value = null
  showModal.value = false
}

async function submit() {
  if (!form.value.academic_year || !form.value.title) return
  saving.value = true
  try {
    let payload: CreateReadingEntryRequest | FormData = {
      academic_year: form.value.academic_year,
      title: form.value.title,
      month: form.value.month,
      pages_read: form.value.pages_read,
      test_score: form.value.test_score,
    }
    if (cover.value || coverCleared.value) {
      const fd = new FormData()
      fd.append('academic_year', String(form.value.academic_year))
      fd.append('title', form.value.title)
      fd.append('month', String(form.value.month))
      fd.append('pages_read', String(form.value.pages_read ?? 0))
      if (form.value.test_score != null) fd.append('test_score', String(form.value.test_score))
      // An empty string is how a multipart request nulls out a FileField.
      fd.append('cover', cover.value ?? '')
      payload = fd
    }
    if (editingId.value) await updateReadingEntryApi(editingId.value, payload)
    else await createReadingEntryApi(props.studentPk, payload)
    const wasEdit = !!editingId.value
    closeModal()
    if (wasEdit || page.value === 1) await fetchPage()
    else page.value = 1
  } catch {
    toast.error(t('common.serverError'))
  } finally {
    saving.value = false
  }
}

async function remove(id: number) {
  if (!confirm(t('students.confirmDeleteReadingEntry'))) return
  try {
    await deleteReadingEntryApi(id)
    if (rows.value.length === 1 && page.value > 1) page.value -= 1
    else await fetchPage()
  } catch {
    toast.error(t('common.serverError'))
  }
}

onBeforeUnmount(clearCover)
</script>
