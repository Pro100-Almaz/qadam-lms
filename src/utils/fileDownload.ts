import type { AxiosResponse } from 'axios'
import axios from 'axios'

/**
 * Saving a file the API handed back as a Blob, and reading the error out of one
 * when the same request failed instead.
 */

/**
 * The name the server picked, out of `Content-Disposition`.
 *
 * `filename*` wins over `filename`: it is the RFC 5987 form and the only one
 * that survives non-ASCII names — a Cyrillic student name comes back
 * percent-encoded there and mangled or dropped in the plain parameter.
 *
 * The header is only readable when it is exposed to the browser
 * (`Access-Control-Expose-Headers` on a cross-origin API), so `fallback` is a
 * normal outcome, not an error.
 */
export function filenameFromDisposition(disposition: string | undefined, fallback: string): string {
  if (!disposition) return fallback

  const extended = disposition.match(/filename\*\s*=\s*([^']*)'[^']*'([^;]+)/i)
  if (extended?.[2]) {
    try {
      return decodeURIComponent(extended[2].trim())
    } catch {
      // A malformed escape sequence — fall through to the plain parameter.
    }
  }

  const plain = disposition.match(/filename\s*=\s*"([^"]+)"/i) ?? disposition.match(/filename\s*=\s*([^;]+)/i)
  return plain?.[1]?.trim() || fallback
}

/** Hands the blob to the browser's downloader under `filename`. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  // Firefox only follows a link that is actually in the document, and revoking
  // the URL in the same tick can cancel the download it just started.
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Saves a blob response under the server's own filename. */
export function saveBlobResponse(response: AxiosResponse<Blob>, fallbackName: string): string {
  const disposition = (response.headers as Record<string, string | undefined>)['content-disposition']
  const filename = filenameFromDisposition(disposition, fallbackName)
  saveBlob(response.data, filename)
  return filename
}

/**
 * The JSON body of a failed `responseType: 'blob'` request.
 *
 * axios honours the requested response type on errors too, so a 400 that would
 * normally arrive as `{"quarter": "…"}` arrives as a Blob wrapping that JSON
 * and has to be read back asynchronously. Returns `null` when the body is not
 * JSON — a proxy's HTML error page, say.
 */
export async function readBlobErrorData(error: unknown): Promise<Record<string, unknown> | null> {
  if (!axios.isAxiosError(error)) return null

  const data = error.response?.data
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text())
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
    } catch {
      return null
    }
  }
  // A retried request can resolve before the response type is applied.
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : null
}

/**
 * Flattens a DRF error body into one sentence. Values arrive as a bare string
 * on these endpoints (`{"quarter": "Must be between 1 and 4."}`) but as a list
 * elsewhere, so both are handled.
 */
export function flattenErrorMessage(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(flattenErrorMessage).filter(Boolean).join(' ')
  if (value && typeof value === 'object') {
    return Object.values(value).map(flattenErrorMessage).filter(Boolean).join(' ')
  }
  return ''
}
