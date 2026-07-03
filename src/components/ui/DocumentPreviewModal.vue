<template>
  <Modal v-if="attachment" :fullScreenBackdrop="true" @close="emit('close')">
    <template #body>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dpm-filename"
        class="w-full max-w-5xl mx-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-theme-md overflow-hidden flex flex-col"
        @keydown.esc.stop="emit('close')"
      >
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <component :is="kindIcon" class="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span id="dpm-filename" class="flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-200">
            {{ attachment.original_name }}
          </span>
          <span
            v-if="fileExt"
            class="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex-shrink-0"
          >
            {{ fileExt }}
          </span>
          <div class="flex items-center gap-1 ml-2">
            <button
              class="hidden sm:inline-flex rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              :aria-label="t('documentPreview.openInNewTab')"
              @click="openInNewTab"
            >
              <ExternalLink class="h-4 w-4" />
            </button>
            <button
              class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              :aria-label="t('documentPreview.download')"
              @click="downloadAttachment"
            >
              <Download class="h-4 w-4" />
            </button>
            <button
              ref="closeBtnRef"
              class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              :aria-label="t('documentPreview.close')"
              @click="emit('close')"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="flex-1 min-h-[60vh] max-h-[80vh] overflow-hidden relative flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <!-- Error state -->
          <div v-if="error" role="status" aria-live="polite" class="flex flex-col items-center justify-center gap-3 px-6 py-10">
            <AlertCircle class="h-10 w-10 text-error-500" />
            <p class="text-sm text-gray-600 dark:text-gray-300">{{ t('documentPreview.errorTitle') }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ t('documentPreview.errorBody') }}</p>
            <button
              @click="downloadAttachment"
              class="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition"
            >
              <Download class="h-4 w-4" />
              {{ t('documentPreview.download') }}
            </button>
          </div>

          <!-- Unsupported state -->
          <div v-else-if="previewKind === 'unsupported'" class="flex flex-col items-center justify-center gap-3 px-6 py-10">
            <File class="h-12 w-12 text-gray-300 dark:text-gray-700" />
            <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('documentPreview.unsupportedTitle') }}</p>
            <div class="mt-2 flex items-center gap-3">
              <button
                @click="downloadAttachment"
                class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 shadow-theme-xs transition"
              >
                <Download class="h-4 w-4" />
                {{ t('documentPreview.download') }}
              </button>
              <button
                @click="openInNewTab"
                class="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                <ExternalLink class="h-4 w-4" />
                {{ t('documentPreview.openInNewTab') }}
              </button>
            </div>
          </div>

          <!-- Image -->
          <img
            v-else-if="previewKind === 'image' && srcUrl"
            :src="srcUrl"
            :alt="attachment.original_name"
            class="max-h-[80vh] max-w-full object-contain rounded"
            @load="loading = false"
            @error="onError"
          />

          <!-- PDF -->
          <iframe
            v-else-if="previewKind === 'pdf' && srcUrl"
            ref="iframeRef"
            :src="`${srcUrl}#toolbar=0&navpanes=0`"
            class="block w-full h-full border-0 min-h-[60vh]"
            tabindex="0"
            @load="onIframeLoad"
          />

          <!-- Video -->
          <video
            v-else-if="previewKind === 'video' && srcUrl"
            :src="srcUrl"
            controls
            class="max-h-[70vh] w-full rounded"
            @loadeddata="loading = false"
            @error="onError"
          />

          <!-- Audio -->
          <div v-else-if="previewKind === 'audio' && srcUrl" class="w-full px-8 py-12 flex flex-col items-center gap-4">
            <FileAudio class="h-16 w-16 text-gray-300 dark:text-gray-700" />
            <audio
              :src="srcUrl"
              controls
              class="w-full"
              @loadeddata="loading = false"
              @error="onError"
            />
          </div>

          <!-- Text -->
          <template v-else-if="previewKind === 'text'">
            <pre
              class="w-full h-full overflow-auto p-4 text-xs font-mono text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre"
              tabindex="0"
            >{{ textContent }}</pre>
            <p v-if="textTruncated" class="px-4 pb-2 text-[11px] italic text-gray-400">…truncated to first 500 lines</p>
          </template>

          <!-- Loading overlay -->
          <div
            v-if="loading && previewKind !== 'unsupported' && !error"
            role="status"
            aria-live="polite"
            class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-950"
          >
            <Loader2 class="h-8 w-8 animate-spin text-brand-500" />
            <p class="text-sm text-gray-400 dark:text-gray-500">{{ t('documentPreview.loading') }}</p>
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api/client'
import {
  File,
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
  Download,
  ExternalLink,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-vue-next'
import Modal from '@/components/ui/Modal.vue'
import type { Attachment } from '@/types/achievement'

type PreviewKind = 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'unsupported'

const props = defineProps<{
  attachment: Attachment | null
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n()

const loading = ref(false)
const error = ref(false)
const textContent = ref('')
const blobUrl = ref('')
const textTruncated = ref(false)
const iframeRef = ref<HTMLIFrameElement | null>(null)
const closeBtnRef = ref<HTMLButtonElement | null>(null)

let pdfTimeout: ReturnType<typeof setTimeout> | null = null

const EXT_MAP: Record<string, PreviewKind> = {
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image',
  webp: 'image', avif: 'image', svg: 'image',
  pdf: 'pdf',
  mp4: 'video', webm: 'video', ogv: 'video',
  mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio',
  txt: 'text', md: 'text', csv: 'text',
}

const previewKind = computed<PreviewKind>(() => {
  const mime = props.attachment?.file_type ?? ''
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('text/')) return 'text'
  const ext = props.attachment?.original_name.split('.').slice(-1)[0]?.toLowerCase() ?? ''
  return EXT_MAP[ext] ?? 'unsupported'
})

const srcUrl = computed(() => blobUrl.value)

const fileExt = computed(() => {
  const ext = props.attachment?.original_name.split('.').slice(-1)[0]?.toUpperCase() ?? ''
  return ext || ''
})

const kindIcon = computed(() => {
  switch (previewKind.value) {
    case 'image': return FileImage
    case 'pdf':
    case 'text': return FileText
    case 'video': return FileVideo
    case 'audio': return FileAudio
    default: return File
  }
})

function onIframeLoad() {
  loading.value = false
  if (pdfTimeout) { clearTimeout(pdfTimeout); pdfTimeout = null }
}

function startPdfTimeout() {
  pdfTimeout = setTimeout(() => {
    if (loading.value) {
      loading.value = false
      error.value = true
    }
  }, 5000)
}

function onError() {
  loading.value = false
  error.value = true
}

function revokeBlobUrl() {
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value)
    blobUrl.value = ''
  }
}

async function ensureBlobUrl(): Promise<string | null> {
  if (blobUrl.value) return blobUrl.value
  if (!props.attachment) return null
  try {
    const { data } = await api.get<Blob>(props.attachment.file, { responseType: 'blob' })
    blobUrl.value = URL.createObjectURL(data)
    return blobUrl.value
  } catch {
    return null
  }
}

async function fetchText(url: string) {
  try {
    const { data } = await api.get(url, { responseType: 'text', transformResponse: [(d) => d] })
    const raw = String(data)
    const lines = raw.split('\n')
    if (lines.length > 500) {
      textContent.value = lines.slice(0, 500).join('\n')
      textTruncated.value = true
    } else {
      textContent.value = raw
      textTruncated.value = false
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

async function downloadAttachment() {
  if (!props.attachment) return
  const href = await ensureBlobUrl()
  if (!href) { error.value = true; return }
  const a = document.createElement('a')
  a.href = href
  a.download = props.attachment.original_name
  a.click()
}

async function openInNewTab() {
  const href = await ensureBlobUrl()
  if (!href) { error.value = true; return }
  window.open(href, '_blank', 'noopener')
}

watch(
  () => props.attachment,
  async (att) => {
    if (pdfTimeout) { clearTimeout(pdfTimeout); pdfTimeout = null }
    revokeBlobUrl()

    if (!att) return

    const kind = previewKind.value
    error.value = false
    textContent.value = ''
    textTruncated.value = false
    loading.value = kind !== 'unsupported'

    nextTick(() => closeBtnRef.value?.focus())

    if (kind === 'unsupported') return

    if (kind === 'text') {
      fetchText(att.file)
      return
    }

    const url = await ensureBlobUrl()
    if (props.attachment !== att) return
    if (!url) {
      error.value = true
      loading.value = false
      return
    }

    if (kind === 'image') {
      loading.value = true
    } else if (kind === 'pdf') {
      startPdfTimeout()
    }
  },
)

onBeforeUnmount(() => {
  if (pdfTimeout) { clearTimeout(pdfTimeout); pdfTimeout = null }
  revokeBlobUrl()
})
</script>
