<template>
  <div class="space-y-6">
    <!-- Current states -->
    <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">{{ t('studentDetail.wellbeing.current') }}</h2>
        <button
          v-if="canEdit"
          type="button"
          class="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-theme-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          @click="openAdd"
        >
          <Plus class="h-4 w-4" aria-hidden="true" />
          {{ t('students.addState') }}
        </button>
      </div>

      <ul v-if="currentStates.length > 0" class="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="state in currentStates" :key="state.id" class="min-w-0">
          <div class="flex items-center justify-between gap-3">
            <span class="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{{ state.name }}</span>
            <span class="flex shrink-0 items-center gap-2">
              <span class="text-theme-xs text-gray-600 dark:text-gray-400">{{ scoreLabel(state.score) }}</span>
              <ScoreMeter :score="state.score" />
            </span>
          </div>
          <p class="mt-1 truncate text-theme-xs text-gray-500 dark:text-gray-400">
            {{ formatDate(state.time_added) }} · {{ state.added_by }}
          </p>
        </li>
      </ul>
      <p v-else class="text-theme-sm text-gray-500 dark:text-gray-400">
        {{ canEdit ? t('studentDetail.wellbeing.emptyCanEdit') : t('studentDetail.wellbeing.empty') }}
      </p>
    </section>

    <!-- History -->
    <section class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">{{ t('studentDetail.wellbeing.history') }}</h2>
        <div class="w-56 max-w-full">
          <SelectMenu
            v-model="nameFilter"
            :options="nameOptions"
            :placeholder="t('studentDetail.wellbeing.allStates')"
            :aria-label="t('studentDetail.wellbeing.filterByState')"
            clearable
            :clear-label="t('studentDetail.wellbeing.allStates')"
          />
        </div>
      </div>

      <StatePanel v-if="error" :loading="false" :error="error" @retry="fetchHistory" />

      <div v-else class="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="w-full min-w-[720px] text-left">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th scope="col" class="px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('studentDetail.wellbeing.colDate') }}</th>
                <th scope="col" class="px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('studentDetail.wellbeing.colState') }}</th>
                <th scope="col" class="px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('studentDetail.wellbeing.colScore') }}</th>
                <th scope="col" class="px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('studentDetail.wellbeing.colComment') }}</th>
                <th scope="col" class="px-4 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('studentDetail.wellbeing.colAuthor') }}</th>
                <th v-if="canEdit" scope="col" class="px-4 py-3 text-right text-theme-xs font-medium text-gray-500 dark:text-gray-400">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody v-if="loading" aria-busy="true">
              <tr v-for="n in 5" :key="n" class="border-b border-gray-100 last:border-0 dark:border-gray-800">
                <td v-for="c in canEdit ? 6 : 5" :key="c" class="px-4 py-3">
                  <div class="h-4 animate-pulse rounded bg-gray-100 dark:bg-white/5"></div>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="rows.length > 0">
              <tr v-for="row in rows" :key="row.id" class="border-b border-gray-100 align-top last:border-0 dark:border-gray-800">
                <td class="whitespace-nowrap px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">{{ formatDate(row.time_added) }}</td>
                <td class="px-4 py-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">{{ row.name }}</td>
                <td class="px-4 py-3">
                  <span class="flex items-center gap-2">
                    <ScoreMeter :score="row.score" />
                    <span class="text-theme-xs text-gray-600 dark:text-gray-400">{{ scoreLabel(row.score) }}</span>
                  </span>
                </td>
                <td class="max-w-sm px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                  <template v-if="row.comment">
                    <p :class="expanded.has(row.id) ? 'whitespace-pre-wrap break-words' : 'line-clamp-1'">{{ row.comment }}</p>
                    <button
                      v-if="row.comment.length > 70 || row.comment.includes('\n')"
                      type="button"
                      class="mt-0.5 text-theme-xs font-medium text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-brand-400"
                      :aria-expanded="expanded.has(row.id)"
                      @click="toggle(row.id)"
                    >
                      {{ expanded.has(row.id) ? t('studentDetail.wellbeing.showLess') : t('studentDetail.wellbeing.showMore') }}
                    </button>
                  </template>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">{{ row.added_by }}</td>
                <td v-if="canEdit" class="px-4 py-3 text-right">
                  <button
                    type="button"
                    class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-error-50 hover:text-error-600 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-gray-400 dark:hover:bg-error-500/10"
                    :aria-label="t('common.delete')"
                    :title="t('common.delete')"
                    :disabled="deletingId === row.id"
                    @click="remove(row.id)"
                  >
                    <Loader2 v-if="deletingId === row.id" class="h-4 w-4 animate-spin" aria-hidden="true" />
                    <Trash2 v-else class="h-4 w-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!loading && rows.length === 0" class="px-4 py-10 text-center text-theme-sm text-gray-500 dark:text-gray-400">
          {{ nameFilter ? t('studentDetail.wellbeing.emptyFiltered') : t('studentDetail.wellbeing.emptyHistory') }}
        </p>
        <Pagination
          v-if="total > 0"
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
        />
      </div>
    </section>

    <!-- Add modal -->
    <Modal v-if="showAdd" :full-screen-backdrop="true" @close="showAdd = false">
      <template #body>
        <div class="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md dark:border-gray-800 dark:bg-gray-900">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('students.addState') }}</h3>
            <button type="button" class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" :aria-label="t('common.cancel')" @click="showAdd = false">
              <X class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div class="space-y-4">
            <div v-if="templates.length > 0">
              <label for="wb-template" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.useTemplate') }}</label>
              <select id="wb-template" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-theme-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" @change="applyTemplate">
                <option value="">{{ t('students.selectTemplate') }}</option>
                <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
              </select>
            </div>
            <div>
              <label for="wb-name" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.stateName') }} <span class="text-error-600" aria-hidden="true">*</span></label>
              <input id="wb-name" v-model="form.name" type="text" required :placeholder="t('students.stateNamePlaceholder')" class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
            </div>
            <fieldset>
              <legend class="mb-1.5 text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.scoreRange') }}</legend>
              <div class="flex items-center gap-2">
                <button
                  v-for="i in 5"
                  :key="i"
                  type="button"
                  :aria-pressed="form.score === i"
                  class="h-9 w-9 rounded-lg border text-theme-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  :class="form.score === i ? 'border-gray-800 bg-gray-800 text-white dark:border-gray-200 dark:bg-gray-200 dark:text-gray-900' : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5'"
                  @click="form.score = i"
                >{{ i }}</button>
                <span class="ml-1 text-theme-sm text-gray-600 dark:text-gray-400">{{ scoreLabel(form.score) }}</span>
              </div>
            </fieldset>
            <div>
              <label for="wb-comment" class="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-400">{{ t('students.comment') }}</label>
              <textarea id="wb-comment" v-model="form.comment" rows="3" :placeholder="t('students.stateCommentPlaceholder')" class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"></textarea>
            </div>
          </div>
          <div class="mt-6 flex gap-3">
            <button type="button" class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5" @click="showAdd = false">{{ t('common.cancel') }}</button>
            <button type="button" :disabled="!form.name.trim() || saving" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-theme-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50" @click="submit">
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
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader2, Plus, Trash2, X } from 'lucide-vue-next'
import Modal from '@/components/ui/Modal.vue'
import Pagination from '@/components/ui/Pagination.vue'
import SelectMenu from '@/components/ui/SelectMenu.vue'
import StatePanel from '@/components/analytics/StatePanel.vue'
import {
  createPsychologicalStateApi,
  deletePsychologicalStateApi,
  getPsychologicalStateHistoryApi,
  getPsychologicalStateTemplatesApi,
} from '@/api/students'
import type { PsychologicalState, PsychologicalStateTemplate } from '@/types/student'
import { useToast } from '@/composables/useToast'
import { currentIntlLocale } from '@/i18n'

const props = defineProps<{
  studentPk: number
  canEdit: boolean
  currentStates: PsychologicalState[]
}>()
const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()
const toast = useToast()

/** Neutral 1-5 dot meter: never grade colours, the number is always readable too. */
const ScoreMeter = defineComponent({
  props: { score: { type: Number, required: true } },
  setup(p) {
    return () =>
      h(
        'span',
        { class: 'inline-flex items-center gap-1', role: 'img', 'aria-label': t('studentDetail.wellbeing.scoreOf', { score: p.score }) },
        [
          ...Array.from({ length: 5 }, (_, i) =>
            h('span', {
              class: ['h-2 w-2 rounded-full', i < p.score ? 'bg-gray-700 dark:bg-gray-300' : 'bg-gray-200 dark:bg-gray-700'],
            }),
          ),
        ],
      )
  },
})

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

function formatDate(value: string): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat(currentIntlLocale(), { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

// ─── History ────────────────────────────────────────────────────────────────
const rows = ref<PsychologicalState[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const nameFilter = ref<number | string | null>(null)
const loading = ref(true)
const error = ref('')
const expanded = ref(new Set<number>())
let requestId = 0

const nameOptions = computed(() =>
  [...new Set(props.currentStates.map(s => s.name))].map(name => ({ value: name, label: name })),
)

function toggle(id: number) {
  const next = new Set(expanded.value)
  if (!next.delete(id)) next.add(id)
  expanded.value = next
}

async function fetchHistory() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const res = await getPsychologicalStateHistoryApi(props.studentPk, {
      page: page.value,
      page_size: pageSize.value,
      name: nameFilter.value ? String(nameFilter.value) : undefined,
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

watch([page, pageSize], fetchHistory)
watch(nameFilter, () => {
  if (page.value === 1) fetchHistory()
  else page.value = 1
})
watch(() => props.studentPk, () => {
  page.value = 1
  fetchHistory()
})
onMounted(fetchHistory)

// ─── Add / delete ───────────────────────────────────────────────────────────
const showAdd = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const form = ref({ name: '', score: 3, comment: '' })
const templates = ref<PsychologicalStateTemplate[]>([])
let templatesLoaded = false

async function openAdd() {
  form.value = { name: '', score: 3, comment: '' }
  showAdd.value = true
  if (templatesLoaded) return
  try {
    templates.value = (await getPsychologicalStateTemplatesApi()).data
    templatesLoaded = true
  } catch {
    toast.error(t('common.serverError'))
  }
}

function applyTemplate(e: Event) {
  const tpl = templates.value.find(x => x.id === Number((e.target as HTMLSelectElement).value))
  if (!tpl) return
  form.value.name = tpl.name
  form.value.comment = tpl.comment
}

async function afterWrite() {
  if (page.value === 1) await fetchHistory()
  else page.value = 1
  emit('changed')
}

async function submit() {
  if (!form.value.name.trim()) return
  saving.value = true
  try {
    await createPsychologicalStateApi(props.studentPk, {
      state_name: form.value.name.trim(),
      score: form.value.score,
      comment: form.value.comment,
    })
    showAdd.value = false
    await afterWrite()
  } catch {
    toast.error(t('common.serverError'))
  } finally {
    saving.value = false
  }
}

async function remove(id: number) {
  if (!confirm(t('studentDetail.wellbeing.confirmDelete'))) return
  deletingId.value = id
  try {
    await deletePsychologicalStateApi(id)
    // Last row of a later page: step back so the page is not empty.
    if (rows.value.length === 1 && page.value > 1) page.value -= 1
    else await fetchHistory()
    emit('changed')
  } catch {
    toast.error(t('common.serverError'))
  } finally {
    deletingId.value = null
  }
}
</script>
