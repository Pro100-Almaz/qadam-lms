import type { HomeworkAttachment } from '@/api/homeworks'

/**
 * Mirrors the server-side limits — the API answers a violation with a 400 on
 * `attachments`, so checking here only buys a faster, clearer message.
 */
export const MAX_HOMEWORK_ATTACHMENTS = 10
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
] as const

/** `accept` for the file input — a hint only, the checks below are the real gate. */
export const ATTACHMENT_ACCEPT = ALLOWED_ATTACHMENT_EXTENSIONS.join(',')

/** A message to translate: `t(key, params)`. */
export interface AttachmentRejection {
  key: string
  params?: Record<string, unknown>
}

export interface AttachmentPickResult {
  accepted: File[]
  rejected: AttachmentRejection[]
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot).toLowerCase()
}

/**
 * Splits a fresh pick into what may be sent and why the rest may not.
 * `usedSlots` must count both already-saved attachments and files still queued,
 * because the cap applies to the homework, not to one upload.
 */
export function pickAttachments(files: File[], usedSlots: number): AttachmentPickResult {
  const accepted: File[] = []
  const rejected: AttachmentRejection[] = []
  let remaining = Math.max(0, MAX_HOMEWORK_ATTACHMENTS - usedSlots)

  files.forEach(file => {
    const extension = extensionOf(file.name)
    if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension as typeof ALLOWED_ATTACHMENT_EXTENSIONS[number])) {
      rejected.push({
        key: 'homeworkAttachments.errors.unsupported',
        params: { name: file.name, formats: ALLOWED_ATTACHMENT_EXTENSIONS.join(', ') },
      })
      return
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      rejected.push({
        key: 'homeworkAttachments.errors.tooLarge',
        params: { name: file.name, max: formatFileSize(MAX_ATTACHMENT_BYTES) },
      })
      return
    }
    if (remaining === 0) {
      rejected.push({
        key: 'homeworkAttachments.errors.tooMany',
        params: { name: file.name, max: MAX_HOMEWORK_ATTACHMENTS },
      })
      return
    }
    accepted.push(file)
    remaining -= 1
  })

  return { accepted, rejected }
}

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/bmp': '.bmp',
  'application/pdf': '.pdf',
}

/**
 * Browsers name every clipboard image `image.png` (or nothing at all), so a
 * few pastes would be indistinguishable in the list — give each one a
 * timestamped name with an extension that matches its MIME type.
 */
export function nameClipboardFile(file: File, index: number): File {
  const extension = EXTENSION_BY_MIME[file.type] ?? extensionOf(file.name)
  const stamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')
  const suffix = index ? `-${index + 1}` : ''
  return new File([file], `pasted-${stamp}${suffix}${extension}`, {
    type: file.type,
    lastModified: Date.now(),
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** `file_type` is either the bucket (`image`) or a MIME type (`image/png`). */
export function isImageAttachment(attachment: HomeworkAttachment): boolean {
  return attachment.file_type === 'image' || attachment.file_type.startsWith('image/')
}
