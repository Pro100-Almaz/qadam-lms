<template>
  <div v-if="attachments.length" class="flex flex-wrap items-start" :class="size === 'sm' ? 'gap-1.5' : 'gap-2'">
    <div
      v-for="attachment in attachments"
      :key="attachment.id"
      class="group/att relative"
      :class="{ 'opacity-50': isPendingRemoval(attachment) }"
    >
      <!-- Images preview inline; the URL is absolute, so no auth round-trip. -->
      <a
        v-if="showAsImage(attachment)"
        :href="attachment.url"
        target="_blank"
        rel="noopener"
        :title="attachment.name"
        class="block overflow-hidden rounded-lg border border-gray-200 transition hover:opacity-80 dark:border-gray-700"
        :class="size === 'sm' ? 'h-10 w-10' : 'h-16 w-16'"
      >
        <img
          :src="attachment.url"
          :alt="attachment.name"
          class="h-full w-full object-cover"
          loading="lazy"
          @error="markBroken(attachment.id)"
        />
      </a>

      <!-- Everything else — a chip that downloads on click. -->
      <a
        v-else
        :href="attachment.url"
        target="_blank"
        rel="noopener"
        :download="attachment.name"
        :title="attachment.name"
        class="inline-flex max-w-[220px] items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 transition hover:border-brand-300 hover:text-brand-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300"
        :class="size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'"
      >
        <component :is="iconFor(attachment)" class="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <span class="truncate" :class="{ 'line-through': isPendingRemoval(attachment) }">{{ attachment.name }}</span>
        <Download class="h-3 w-3 shrink-0 opacity-0 transition group-hover/att:opacity-100" />
      </a>

      <!-- Author-only control; hidden for everyone else. -->
      <button
        v-if="removable"
        type="button"
        :disabled="busyIds.includes(attachment.id)"
        class="absolute -right-1.5 -top-1.5 rounded-full border border-gray-200 bg-white p-0.5 shadow-theme-xs transition hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-error-500/10"
        :aria-label="isPendingRemoval(attachment)
          ? t('homeworkAttachments.undoRemove', { name: attachment.name })
          : t('homeworkAttachments.remove', { name: attachment.name })"
        @click="emit(isPendingRemoval(attachment) ? 'restore' : 'remove', attachment)"
      >
        <Loader2 v-if="busyIds.includes(attachment.id)" class="h-3 w-3 animate-spin text-gray-400" />
        <Undo2 v-else-if="isPendingRemoval(attachment)" class="h-3 w-3 text-gray-500 dark:text-gray-400" />
        <X v-else class="h-3 w-3 text-error-500" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, File, FileText, Loader2, Undo2, X } from 'lucide-vue-next'
import type { HomeworkAttachment } from '@/api/homeworks'
import { isImageAttachment } from '@/utils/homeworkAttachments'

const props = withDefaults(
  defineProps<{
    attachments: HomeworkAttachment[]
    /** `sm` is for table cells, `md` for the form and the student cards. */
    size?: 'sm' | 'md'
    /** Only the homework's author may delete — the caller decides. */
    removable?: boolean
    /** Marked for deletion but not saved yet: struck through with an undo. */
    pendingRemovalIds?: number[]
    busyIds?: number[]
  }>(),
  {
    size: 'md',
    removable: false,
    pendingRemovalIds: () => [],
    busyIds: () => [],
  },
)

const emit = defineEmits<{
  (e: 'remove' | 'restore', attachment: HomeworkAttachment): void
}>()

const { t } = useI18n()

/** A dead media URL would otherwise leave a blank square with no file name. */
const brokenIds = ref<number[]>([])

function markBroken(id: number) {
  if (!brokenIds.value.includes(id)) brokenIds.value.push(id)
}

function showAsImage(attachment: HomeworkAttachment): boolean {
  return isImageAttachment(attachment) && !brokenIds.value.includes(attachment.id)
}

function isPendingRemoval(attachment: HomeworkAttachment): boolean {
  return props.pendingRemovalIds.includes(attachment.id)
}

function iconFor(attachment: HomeworkAttachment) {
  // "other" is the only bucket without a document icon; MIME types all get one.
  return attachment.file_type === 'other' ? File : FileText
}
</script>
