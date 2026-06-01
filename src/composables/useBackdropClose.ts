import { ref } from 'vue'

/**
 * Backdrop close helper that only triggers when BOTH mousedown and mouseup
 * occurred directly on the backdrop element. Plain `@click.self` is unsafe
 * because the browser fires `click` on the closest common ancestor of the
 * mousedown and mouseup targets — if a user presses inside the modal and
 * drags the cursor out before releasing, that ancestor is the backdrop itself
 * and `.self` matches. This composable rejects that case.
 *
 * Usage:
 *   const lesson = useBackdropClose(() => { showLessonModal.value = false })
 *   <div @mousedown="lesson.onMouseDown" @mouseup="lesson.onMouseUp">
 */
export function useBackdropClose(close: () => void) {
  const downOnBackdrop = ref(false)

  function onMouseDown(e: MouseEvent) {
    downOnBackdrop.value = e.target === e.currentTarget
  }

  function onMouseUp(e: MouseEvent) {
    if (e.target === e.currentTarget && downOnBackdrop.value) {
      close()
    }
    downOnBackdrop.value = false
  }

  return { onMouseDown, onMouseUp }
}
