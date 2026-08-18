<template>
  <div class="space-y-3">
    <div
      class="rounded-lg border border-dashed p-4 text-center transition"
      :class="[
        dragging ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-500/5' : 'border-gray-300 dark:border-gray-700',
        error ? 'border-error-500' : '',
        disabled ? 'opacity-60' : '',
      ]"
      @dragover.prevent="dragging = !disabled"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <Paperclip class="mx-auto h-5 w-5 text-gray-400" />
      <button
        type="button"
        :disabled="disabled || !remainingSlots"
        class="mt-2 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:border-brand-300 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        @click="fileInput?.click()"
      >
        <Plus class="h-4 w-4" />
        {{ t('homeworkAttachments.addFiles') }}
      </button>
      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {{ t('homeworkAttachments.hint', { formats: ALLOWED_ATTACHMENT_EXTENSIONS.join(', '), size: maxSizeLabel }) }}
      </p>
      <p class="mt-1 text-xs" :class="remainingSlots ? 'text-gray-400' : 'text-warning-600 dark:text-warning-400'">
        {{ remainingSlots
          ? t('homeworkAttachments.slotsLeft', { count: remainingSlots, max: MAX_HOMEWORK_ATTACHMENTS })
          : t('homeworkAttachments.limitReached', { max: MAX_HOMEWORK_ATTACHMENTS }) }}
      </p>
      <input
        ref="fileInput"
        type="file"
        multiple
        class="hidden"
        :accept="ATTACHMENT_ACCEPT"
        @change="onInputChange"
      />
    </div>

    <!-- Queued files — removable until the form is submitted. -->
    <ul v-if="modelValue.length" class="space-y-2">
      <li
        v-for="(file, index) in modelValue"
        :key="`${file.name}-${file.lastModified}-${index}`"
        class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
      >
        <component :is="isImageFile(file) ? FileImage : FileText" class="h-4 w-4 shrink-0 text-gray-400" />
        <span class="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">{{ file.name }}</span>
        <span class="shrink-0 text-xs text-gray-400">{{ formatFileSize(file.size) }}</span>
        <button
          type="button"
          :disabled="disabled"
          class="shrink-0 rounded-md p-1 text-gray-400 transition hover:bg-error-50 hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-error-500/10"
          :aria-label="t('homeworkAttachments.removeQueued', { name: file.name })"
          @click="removeAt(index)"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </li>
    </ul>

    <!-- Upload progress for the multipart request. -->
    <div v-if="uploading" class="space-y-1.5">
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          class="h-full rounded-full bg-brand-500 transition-all"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400">
        {{ t('homeworkAttachments.uploading', { percent: progress }) }}
      </p>
    </div>

    <!-- Client-side rejections, then whatever the API said about `attachments`. -->
    <p v-for="(message, index) in localErrors" :key="index" class="text-xs text-error-500">{{ message }}</p>
    <p v-if="error" class="text-xs text-error-500">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { FileImage, FileText, Paperclip, Plus, X } from 'lucide-vue-next'
import {
  ALLOWED_ATTACHMENT_EXTENSIONS,
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENT_BYTES,
  MAX_HOMEWORK_ATTACHMENTS,
  formatFileSize,
  pickAttachments,
} from '@/utils/homeworkAttachments'

const props = withDefaults(
  defineProps<{
    /** Files queued for this submit — not uploaded yet. */
    modelValue: File[]
    /** Attachments the homework already keeps, so the cap counts the total. */
    usedSlots?: number
    disabled?: boolean
    uploading?: boolean
    progress?: number
    /** Message the API returned for `attachments` / `remove_attachments`. */
    error?: string
  }>(),
  { usedSlots: 0, disabled: false, uploading: false, progress: 0, error: '' },
)

const emit = defineEmits<{ (e: 'update:modelValue', files: File[]): void }>()

const { t } = useI18n()

const fileInput = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const localErrors = ref<string[]>([])

const maxSizeLabel = computed(() => formatFileSize(MAX_ATTACHMENT_BYTES))
const remainingSlots = computed(() =>
  Math.max(0, MAX_HOMEWORK_ATTACHMENTS - props.usedSlots - props.modelValue.length),
)

// A fresh server-side error replaces stale client-side ones.
watch(() => props.error, value => {
  if (value) localErrors.value = []
})

function addFiles(files: File[]) {
  if (props.disabled || !files.length) return
  const { accepted, rejected } = pickAttachments(files, props.usedSlots + props.modelValue.length)
  localErrors.value = rejected.map(rejection => t(rejection.key, rejection.params ?? {}))
  if (accepted.length) emit('update:modelValue', [...props.modelValue, ...accepted])
}

function onInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  addFiles([...(input.files ?? [])])
  // Reset so picking the same file twice in a row still fires `change`.
  input.value = ''
}

function onDrop(event: DragEvent) {
  dragging.value = false
  addFiles([...(event.dataTransfer?.files ?? [])])
}

function removeAt(index: number) {
  emit('update:modelValue', props.modelValue.filter((_, position) => position !== index))
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}
</script>
