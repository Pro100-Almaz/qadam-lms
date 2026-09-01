<template>
  <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <div class="min-w-[720px]">
        <!-- Day headers. Sticky so the columns stay named while the grid scrolls. -->
        <div
          class="sticky top-0 z-20 grid border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/60"
          :style="columnsStyle"
        >
          <div class="border-r border-gray-200 dark:border-gray-800"></div>
          <div
            v-for="weekday in weekdays"
            :key="weekday"
            class="border-r border-gray-200 px-2 py-3 text-center last:border-r-0 dark:border-gray-800"
          >
            <span class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <span class="lg:hidden">{{ t(`scheduleBuilder.weekdaysShort.${weekday}`) }}</span>
              <span class="hidden lg:inline">{{ t(`scheduleBuilder.weekdays.${weekday}`) }}</span>
            </span>
          </div>
        </div>

        <!-- Time grid. The vertical padding is what keeps the first and last
             hour labels, which are centred on their line, off the edges. -->
        <div class="grid py-3" :style="columnsStyle">
          <!-- Gutter: one label per hour, sitting on the hour line. -->
          <div class="relative border-r border-gray-200 dark:border-gray-800" :style="{ height: `${gridHeight}px` }">
            <span
              v-for="hour in hourMarks"
              :key="hour"
              class="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-gray-400 dark:text-gray-500"
              :style="{ top: `${minutesToOffset(hour * 60)}px` }"
            >
              {{ String(hour).padStart(2, '0') }}:00
            </span>
          </div>

          <div
            v-for="weekday in weekdays"
            :key="weekday"
            class="relative border-r border-gray-100 last:border-r-0 dark:border-gray-800"
            :class="readonly ? '' : 'cursor-crosshair select-none'"
            :style="{ height: `${gridHeight}px` }"
            @pointerdown="onPointerDown(weekday, $event)"
          >
            <!-- Hour lines, and a lighter one on the half hour. -->
            <div
              v-for="hour in hourMarks"
              :key="`h-${hour}`"
              class="pointer-events-none absolute inset-x-0 border-t border-gray-100 dark:border-gray-800"
              :style="{ top: `${minutesToOffset(hour * 60)}px` }"
            ></div>
            <div
              v-for="hour in hourMarks"
              :key="`hh-${hour}`"
              class="pointer-events-none absolute inset-x-0 border-t border-dashed border-gray-50 dark:border-gray-800/50"
              :style="{ top: `${minutesToOffset(hour * 60 + 30)}px` }"
            ></div>

            <!-- The range being swept out, and then held while the editor
                 above it names the entry. -->
            <div
              v-if="activeRange && activeRange.weekday === weekday"
              class="pointer-events-none absolute inset-x-1 z-20 flex items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-brand-400 bg-brand-500/10 px-1.5 text-[11px] font-medium leading-none text-brand-600 dark:text-brand-400"
              :style="blockStyle(activeRange.start, activeRange.end)"
            >
              <span class="truncate">{{ formatRange(activeRange.start, activeRange.end) }}</span>
            </div>

            <button
              v-for="block in blocksFor(weekday)"
              :key="block.event.id"
              type="button"
              class="absolute z-10 flex flex-col overflow-hidden rounded-lg border text-left transition"
              :class="[
                toneClass(block.event),
                readonly ? 'cursor-default' : 'cursor-pointer hover:brightness-95',
                textLines(block.event) === 1 ? 'justify-center px-1.5' : 'justify-start px-2 py-1',
              ]"
              :style="{ ...blockStyle(block.event.start, block.event.end), ...laneStyle(block) }"
              :title="blockTitle(block.event)"
              @pointerdown.stop
              @click="emit('select', block.event)"
            >
              <span
                class="block truncate font-semibold"
                :class="textLines(block.event) === 1 ? 'text-[10px] leading-none' : 'text-[11px] leading-tight sm:text-xs'"
              >
                {{ block.event.title }}
              </span>
              <span v-if="textLines(block.event) >= 2" class="block truncate text-[10px] leading-tight opacity-80">
                {{ formatRange(block.event.start, block.event.end) }}
              </span>
              <span
                v-if="textLines(block.event) >= 3 && block.event.subtitle"
                class="block truncate text-[10px] leading-tight opacity-70"
              >
                {{ block.event.subtitle }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { minutesToTime } from '@/api/schedule'

/** One block on the grid. Times are minutes past midnight, like the grid itself. */
export interface ScheduleEvent {
  id: string
  /** 1 = Monday … 5 = Friday, as `scheduleBuilder.weekdays` numbers them. */
  weekday: number
  start: number
  end: number
  title: string
  subtitle?: string
  /** Free entries (a break, a club) are drawn apart from taught subjects. */
  tone?: 'subject' | 'other'
  /** Colour bucket — same number, same colour, across the whole week. */
  colorKey?: string
}

export interface ScheduleRange {
  weekday: number
  start: number
  end: number
}

const props = withDefaults(
  defineProps<{
    events: ScheduleEvent[]
    /** Read-only grids drop the drag-to-create affordance entirely. */
    readonly?: boolean
    /**
     * A range to keep highlighted once the drag is over — the editor it opened
     * sits above the grid, and the selection has to survive until it closes.
     */
    pendingRange?: ScheduleRange | null
    /** Minutes past midnight the grid starts and ends at. */
    dayStart?: number
    dayEnd?: number
    /** Drags snap to this, and it is the shortest range that can be drawn. */
    slotMinutes?: number
    hourHeight?: number
  }>(),
  {
    readonly: false,
    pendingRange: null,
    dayStart: 7 * 60,
    dayEnd: 19 * 60,
    slotMinutes: 5,
    hourHeight: 60,
  },
)

const emit = defineEmits<{
  create: [range: ScheduleRange]
  select: [event: ScheduleEvent]
}>()

const { t } = useI18n()

const weekdays = [1, 2, 3, 4, 5]

const draft = ref<ScheduleRange | null>(null)
/** Where the drag started — the range grows either side of it. */
const anchor = ref<number | null>(null)

/** A live drag wins over a held selection; otherwise the held one shows. */
const activeRange = computed(() => draft.value ?? props.pendingRange ?? null)

const columnsStyle = computed(() => ({
  gridTemplateColumns: `56px repeat(${weekdays.length}, minmax(0, 1fr))`,
}))

const gridHeight = computed(() => ((props.dayEnd - props.dayStart) / 60) * props.hourHeight)

/** Whole hours inside the window — what the gutter labels and the lines follow. */
const hourMarks = computed(() => {
  const first = Math.ceil(props.dayStart / 60)
  const last = Math.floor(props.dayEnd / 60)
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index)
})

function minutesToOffset(minutes: number): number {
  return ((minutes - props.dayStart) / 60) * props.hourHeight
}

/** Drawn height in pixels, which is what decides how much text can fit. */
function blockHeight(start: number, end: number): number {
  const top = minutesToOffset(Math.max(start, props.dayStart))
  const bottom = minutesToOffset(Math.min(end, props.dayEnd))
  return Math.max(16, bottom - top)
}

function blockStyle(start: number, end: number) {
  return {
    top: `${minutesToOffset(Math.max(start, props.dayStart))}px`,
    height: `${blockHeight(start, end)}px`,
  }
}

/**
 * A short lesson has room for its name and nothing else. Rather than clip the
 * lines that do not fit, they are dropped — the tooltip still carries them.
 */
function textLines(event: ScheduleEvent): 1 | 2 | 3 {
  const height = blockHeight(event.start, event.end)
  if (height < 32) return 1
  if (height < 48) return 2
  return 3
}

function blockTitle(event: ScheduleEvent): string {
  return [event.title, formatRange(event.start, event.end), event.subtitle]
    .filter(Boolean)
    .join('\n')
}

function formatRange(start: number, end: number): string {
  return `${minutesToTime(start)} – ${minutesToTime(end)}`
}

// ─── Colours ──────────────────────────────────────────────────────────────────
//
// Written out rather than interpolated: Tailwind only ships classes it can see
// in the source, so `bg-${colour}-50` would compile to nothing.

const TONES = [
  'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-300',
  'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
  'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-300',
  'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300',
  'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-300',
  'border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-500/30 dark:bg-pink-500/15 dark:text-pink-300',
  'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
  'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300',
]
/** Breaks and clubs are not a subject, so they read as grey rather than a hue. */
const OTHER_TONE =
  'border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'

function toneClass(event: ScheduleEvent): string {
  if (event.tone === 'other') return OTHER_TONE
  const key = event.colorKey ?? event.title
  let hash = 0
  for (let index = 0; index < key.length; index += 1) {
    hash = ((hash << 5) - hash + key.charCodeAt(index)) | 0
  }
  return TONES[Math.abs(hash) % TONES.length]
}

// ─── Overlap packing ──────────────────────────────────────────────────────────

interface PositionedBlock {
  event: ScheduleEvent
  lane: number
  lanes: number
}

/**
 * Two lessons can share a slot — a split class, or a break drawn over one. They
 * are packed side by side per cluster of mutually overlapping blocks, the way a
 * calendar does it, so neither hides the other.
 */
function blocksFor(weekday: number): PositionedBlock[] {
  const day = props.events
    .filter(event => event.weekday === weekday)
    .sort((a, b) => a.start - b.start || a.end - b.end)

  const positioned: PositionedBlock[] = []
  let cluster: PositionedBlock[] = []
  let clusterEnd = -1

  const flush = () => {
    const lanes = cluster.reduce((max, block) => Math.max(max, block.lane + 1), 0)
    for (const block of cluster) block.lanes = lanes
    positioned.push(...cluster)
    cluster = []
    clusterEnd = -1
  }

  for (const event of day) {
    if (cluster.length && event.start >= clusterEnd) flush()
    // The first lane whose last block has already ended.
    const taken = new Set(
      cluster.filter(block => block.event.end > event.start).map(block => block.lane),
    )
    let lane = 0
    while (taken.has(lane)) lane += 1
    cluster.push({ event, lane, lanes: lane + 1 })
    clusterEnd = Math.max(clusterEnd, event.end)
  }
  if (cluster.length) flush()

  return positioned
}

function laneStyle(block: PositionedBlock) {
  const width = 100 / block.lanes
  return { left: `calc(${block.lane * width}% + 2px)`, width: `calc(${width}% - 4px)` }
}

// ─── Drag to create ───────────────────────────────────────────────────────────

function snap(minutes: number): number {
  const step = props.slotMinutes
  return Math.round(minutes / step) * step
}

function minutesAt(column: HTMLElement, clientY: number): number {
  const rect = column.getBoundingClientRect()
  const ratio = (clientY - rect.top) / rect.height
  const minutes = props.dayStart + ratio * (props.dayEnd - props.dayStart)
  return Math.max(props.dayStart, Math.min(props.dayEnd, snap(minutes)))
}

function onPointerDown(weekday: number, event: PointerEvent): void {
  if (props.readonly || event.button !== 0) return
  const column = event.currentTarget as HTMLElement
  event.preventDefault()
  column.setPointerCapture?.(event.pointerId)

  anchor.value = minutesAt(column, event.clientY)
  draft.value = { weekday, start: anchor.value, end: anchor.value + props.slotMinutes }

  const onMove = (move: PointerEvent) => {
    if (anchor.value === null) return
    const current = minutesAt(column, move.clientY)
    draft.value = {
      weekday,
      start: Math.min(anchor.value, current),
      end: Math.max(anchor.value, current),
    }
  }

  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onCancel)
    const range = draft.value
    draft.value = null
    anchor.value = null
    if (!range) return
    // A plain click is a 45-minute lesson starting where it landed — the common
    // case — rather than a zero-length range the API would reject.
    const end = range.end - range.start < props.slotMinutes * 2 ? range.start + 45 : range.end
    emit('create', { ...range, end: Math.min(end, props.dayEnd) })
  }

  const onCancel = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onCancel)
    draft.value = null
    anchor.value = null
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onCancel)

  cleanup = onCancel
}

/** Set while a drag is live so unmounting mid-drag does not leak the listeners. */
let cleanup: (() => void) | null = null
onBeforeUnmount(() => cleanup?.())
</script>
