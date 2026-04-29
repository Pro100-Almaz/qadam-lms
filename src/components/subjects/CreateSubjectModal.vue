<template>
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
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @mousedown.self="handleBackdropClick"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            class="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-gray-900"
            role="dialog"
            aria-modal="true"
            :aria-label="$t('subjects.createTitle')"
          >
            <!-- Modal header -->
            <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">
                {{ $t('subjects.createTitle') }}
              </h2>
              <button
                type="button"
                @click="closeModal"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white/80 transition"
                :aria-label="$t('common.cancel')"
              >
                <X class="h-4 w-4" />
              </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" novalidate>
              <div class="space-y-5 px-6 py-5">

                <!-- Global error -->
                <div
                  v-if="submitError"
                  class="flex items-start gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400"
                >
                  <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{{ submitError }}</span>
                </div>

                <!-- Name -->
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ $t('subjects.name') }}
                    <span class="text-error-500 ml-0.5">*</span>
                  </label>
                  <input
                    v-model="form.name"
                    type="text"
                    :placeholder="$t('subjects.name') + '...'"
                    :class="[
                      'h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-gray-800 placeholder:text-gray-400 transition focus:outline-hidden focus:ring-3 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30',
                      errors.name
                        ? 'border-error-400 focus:border-error-400 focus:ring-error-500/10 dark:border-error-500'
                        : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700',
                    ]"
                    @blur="validateName"
                  />
                  <p v-if="errors.name" class="mt-1 text-xs text-error-600 dark:text-error-400">
                    {{ errors.name }}
                  </p>
                </div>

                <!-- Language Group -->
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ $t('subjects.language') }}
                    <span class="text-error-500 ml-0.5">*</span>
                  </label>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      v-for="lang in languageOptions"
                      :key="lang.value"
                      type="button"
                      @click="form.language_group = lang.value"
                      :class="[
                        'flex h-10 items-center justify-center rounded-lg border text-sm font-medium transition',
                        form.language_group === lang.value
                          ? 'border-brand-500 bg-brand-50 text-brand-600 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-400'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5',
                      ]"
                    >
                      {{ lang.label }}
                    </button>
                  </div>
                </div>

                <!-- Status -->
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ $t('common.status') }}
                    <span class="text-error-500 ml-0.5">*</span>
                  </label>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="s in statusOptions"
                      :key="s.value"
                      type="button"
                      @click="form.status = s.value"
                      :class="[
                        'flex h-10 items-center justify-center rounded-lg border text-sm font-medium transition',
                        form.status === s.value
                          ? 'border-brand-500 bg-brand-50 text-brand-600 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-400'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5',
                      ]"
                    >
                      {{ s.label }}
                    </button>
                  </div>
                </div>

                <!-- Academic Year -->
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ $t('classes.academicYear') }}
                    <span class="text-error-500 ml-0.5">*</span>
                  </label>
                  <div class="relative">
                    <select
                      v-model="form.academic_year"
                      :disabled="loadingYears"
                      :class="[
                        'h-10 w-full appearance-none rounded-lg border bg-white pl-3.5 pr-9 text-sm text-gray-800 transition focus:outline-hidden focus:ring-3 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800 dark:text-white/90',
                        errors.academic_year
                          ? 'border-error-400 focus:border-error-400 focus:ring-error-500/10 dark:border-error-500'
                          : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700',
                      ]"
                      @change="onYearChange"
                    >
                      <option value="" disabled>
                        {{ loadingYears ? $t('common.loading') : $t('classes.academicYear') + '...' }}
                      </option>
                      <option v-for="year in academicYears" :key="year.id" :value="year.id">
                        {{ year.year }}
                        <template v-if="year.is_active"> ({{ $t('common.current') }})</template>
                      </option>
                    </select>
                    <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                  <p v-if="errors.academic_year" class="mt-1 text-xs text-error-600 dark:text-error-400">
                    {{ errors.academic_year }}
                  </p>
                </div>

                <!-- Class Groups -->
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ $t('subjects.classes') }}
                    <span class="text-error-500 ml-0.5">*</span>
                  </label>

                  <!-- Loading -->
                  <div v-if="loadingGroups" class="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                    <Loader2 class="h-4 w-4 animate-spin" />
                    {{ $t('common.loading') }}
                  </div>

                  <!-- No year selected -->
                  <p v-else-if="!form.academic_year" class="text-sm text-gray-400 dark:text-gray-500">
                    {{ $t('classes.academicYear') }}...
                  </p>

                  <!-- No groups found -->
                  <p v-else-if="classGroups.length === 0" class="text-sm text-gray-400 dark:text-gray-500">
                    {{ $t('common.noData') }}
                  </p>

                  <!-- Checkbox grid -->
                  <div
                    v-else
                    :class="[
                      'max-h-48 overflow-y-auto rounded-lg border p-3',
                      errors.class_groups
                        ? 'border-error-400 dark:border-error-500'
                        : 'border-gray-300 dark:border-gray-700',
                    ]"
                  >
                    <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      <label
                        v-for="group in classGroups"
                        :key="group.id"
                        :class="[
                          'flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition select-none',
                          form.class_groups.includes(group.id)
                            ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-500/10 dark:text-brand-300'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5',
                        ]"
                      >
                        <input
                          type="checkbox"
                          class="sr-only"
                          :value="group.id"
                          v-model="form.class_groups"
                          @change="errors.class_groups = ''"
                        />
                        <span
                          :class="[
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition',
                            form.class_groups.includes(group.id)
                              ? 'border-brand-500 bg-brand-500 dark:border-brand-400 dark:bg-brand-500'
                              : 'border-gray-300 dark:border-gray-600',
                          ]"
                        >
                          <Check v-if="form.class_groups.includes(group.id)" class="h-2.5 w-2.5 text-white" />
                        </span>
                        {{ group.display_name }}
                      </label>
                    </div>
                  </div>

                  <!-- Select all / clear -->
                  <div v-if="classGroups.length > 1" class="mt-1.5 flex gap-3 text-xs">
                    <button
                      type="button"
                      @click="selectAllGroups"
                      class="text-brand-500 hover:text-brand-600 dark:text-brand-400 transition"
                    >
                      {{ $t('common.active') }}... ({{ $t('common.total') }}: {{ classGroups.length }})
                    </button>
                    <button
                      type="button"
                      @click="form.class_groups = []"
                      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                    >
                      {{ $t('common.cancel') }}
                    </button>
                  </div>

                  <p v-if="errors.class_groups" class="mt-1 text-xs text-error-600 dark:text-error-400">
                    {{ errors.class_groups }}
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div class="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                <button
                  type="button"
                  @click="closeModal"
                  class="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5 transition"
                >
                  {{ $t('common.cancel') }}
                </button>
                <button
                  type="submit"
                  :disabled="submitting"
                  class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 transition"
                >
                  <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
                  <Plus v-else class="h-4 w-4" />
                  {{ submitting ? $t('common.loading') : $t('common.add') }}
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, ChevronDown, Check, Plus, Loader2, AlertCircle } from 'lucide-vue-next'
import { getAcademicYearsApi, getClassGroupsApi } from '@/api/academic'
import { createSubjectApi } from '@/api/subjects'
import type { AcademicYear, ClassGroup } from '@/types/academic'
import type { LanguageGroup, SubjectStatus } from '@/types/subject'

// ── Props / emits ──────────────────────────────────────────────────────────────

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created'): void
}>()

const { t } = useI18n()

// ── Static options ─────────────────────────────────────────────────────────────

const languageOptions: { value: LanguageGroup; label: string }[] = [
  { value: 'kaz', label: t('subjects.languages.kaz') },
  { value: 'rus', label: t('subjects.languages.rus') },
  { value: 'eng', label: t('subjects.languages.eng') },
]

const statusOptions: { value: SubjectStatus; label: string }[] = [
  { value: 'active', label: t('subjects.statusActive') },
  { value: 'planned', label: t('subjects.statusPlanned') },
]

// ── Remote data ────────────────────────────────────────────────────────────────

const academicYears = ref<AcademicYear[]>([])
const classGroups = ref<ClassGroup[]>([])
const loadingYears = ref(false)
const loadingGroups = ref(false)

async function fetchAcademicYears() {
  loadingYears.value = true
  try {
    const { data } = await getAcademicYearsApi()
    academicYears.value = data
    // Auto-select the active year
    const active = data.find((y) => y.is_active)
    if (active) {
      form.academic_year = active.id
      await fetchClassGroups(active.id)
    }
  } catch {
    academicYears.value = []
  } finally {
    loadingYears.value = false
  }
}

async function fetchClassGroups(yearId: number) {
  loadingGroups.value = true
  classGroups.value = []
  form.class_groups = []
  try {
    const { data } = await getClassGroupsApi({ year: yearId })
    classGroups.value = data
  } catch {
    classGroups.value = []
  } finally {
    loadingGroups.value = false
  }
}

async function onYearChange() {
  errors.academic_year = ''
  errors.class_groups = ''
  if (form.academic_year) {
    await fetchClassGroups(form.academic_year)
  } else {
    classGroups.value = []
    form.class_groups = []
  }
}

function selectAllGroups() {
  form.class_groups = classGroups.value.map((g) => g.id)
  errors.class_groups = ''
}

// ── Form state ─────────────────────────────────────────────────────────────────

interface FormState {
  name: string
  language_group: LanguageGroup
  status: SubjectStatus
  academic_year: number | ''
  class_groups: number[]
}

const form = reactive<FormState>({
  name: '',
  language_group: 'kaz',
  status: 'active',
  academic_year: '',
  class_groups: [],
})

const errors = reactive({
  name: '',
  academic_year: '',
  class_groups: '',
})

const submitting = ref(false)
const submitError = ref<string | null>(null)

// ── Validation ─────────────────────────────────────────────────────────────────

function validateName() {
  errors.name = form.name.trim() ? '' : t('subjects.name') + ' ' + t('common.noData').toLowerCase()
}

function validateForm(): boolean {
  let valid = true
  validateName()
  if (errors.name) valid = false

  if (!form.academic_year) {
    errors.academic_year = t('classes.academicYear') + ' ' + t('common.noData').toLowerCase()
    valid = false
  } else {
    errors.academic_year = ''
  }

  if (form.class_groups.length === 0) {
    errors.class_groups = t('subjects.classes') + ': ' + t('common.noData').toLowerCase()
    valid = false
  } else {
    errors.class_groups = ''
  }

  return valid
}

// ── Submit ─────────────────────────────────────────────────────────────────────

async function handleSubmit() {
  submitError.value = null
  if (!validateForm()) return

  submitting.value = true
  try {
    await createSubjectApi({
      name: form.name.trim(),
      language_group: form.language_group,
      status: form.status,
      academic_year: form.academic_year as number,
      class_groups: form.class_groups,
    })
    emit('created')
    closeModal()
  } catch (err: any) {
    const detail = err?.response?.data?.detail ?? err?.response?.data?.name?.[0]
    submitError.value = detail ?? t('common.noData')
  } finally {
    submitting.value = false
  }
}

// ── Modal lifecycle ────────────────────────────────────────────────────────────

function resetForm() {
  form.name = ''
  form.language_group = 'kaz'
  form.status = 'active'
  form.academic_year = ''
  form.class_groups = []
  errors.name = ''
  errors.academic_year = ''
  errors.class_groups = ''
  submitError.value = null
  classGroups.value = []
}

function closeModal() {
  emit('update:modelValue', false)
}

function handleBackdropClick() {
  if (!submitting.value) closeModal()
}

// Fetch years when modal opens; reset when it closes
watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      resetForm()
      await fetchAcademicYears()
    }
  },
)
</script>
