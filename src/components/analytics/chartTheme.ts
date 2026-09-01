import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * The palette the analytics charts are drawn with, and the chrome around them.
 *
 * Every value is one of the app's own theme tokens (`src/assets/main.css`) —
 * nothing here invents a colour. The two series hues were checked against the
 * light card (`#ffffff`) and the dark card (`gray-900`, `#101828`) and clear the
 * lightness band, chroma floor, colour-blind separation (worst pair ΔE 18.7
 * deutan / 19.9 normal) and 3:1 contrast in **both** modes, so one pair serves
 * both rather than needing a separate dark set.
 *
 * The older charts in the app hardcode TailAdmin's stock blue `#465FFF`, which
 * is not a token here and is not the brand colour. Do not copy them.
 */

/** Categorical slot 1: the person the chart is about. `success-600`. */
export const SERIES_STUDENT = '#039855'
/** Categorical slot 2: what they are compared against. `blue-light-600`. */
export const SERIES_CLASS = '#0086c9'

/**
 * Diverging ramp for the heatmap — five bands running red → neutral → green,
 * because a mark is not a bare magnitude: it has a *side*. A low score is bad
 * and a high one is good, so the scale says which side of the middle a cell
 * falls on rather than only how much of something it holds.
 *
 * Two hues and a grey midpoint, per the diverging rule: `error-600…error-200`
 * on the bad arm, `success-200…success-700` on the good arm, and a grey step at
 * the centre so the middle of the class recedes instead of reading as a third
 * colour. Both extremes are the loud ones — the cells worth looking at are the
 * failing and the excelling, not the ordinary.
 *
 * Red↔green is the hardest pair for a colour-blind reader, so colour is never
 * the only channel here: every cell carries its own number, the legend is
 * stepped swatches with both ends labelled, and lightness runs dark→pale→dark
 * so the two arms stay apart in greyscale as well.
 *
 * The dark ramp is **selected, not flipped**. The midpoint has to recede toward
 * whichever surface it sits on, so on a light card the centre is near-white and
 * on a dark card it is `gray-700`; reusing the light ramp on a dark card would
 * put the palest cell — the loudest thing on screen — on the most ordinary mark
 * in the grid, which is exactly backwards.
 *
 * `inks` is per step rather than computed: the two saturated ends need the
 * opposite ink from the pale middle, and which ink that is differs by mode.
 * `hatch` is the same ink at low alpha, so the partial-coverage texture stays
 * visible on both a pale and a deep cell.
 */
export interface MagnitudeScale {
  /** Low → high, worst → best. Red arm, grey centre, green arm. */
  colors: readonly string[]
  inks: readonly string[]
  hatch: readonly string[]
}

const LIGHT_MAGNITUDE: MagnitudeScale = {
  // error-600, error-200, gray-100, success-200, success-700 — every ink clears
  // 4.5:1 on its own fill, so the number in the cell stays readable.
  colors: ['#d92d20', '#fecdca', '#f2f4f7', '#a6f4c5', '#027a48'],
  inks: ['#ffffff', '#912018', '#475467', '#05603a', '#ffffff'],
  hatch: [
    'rgba(255,255,255,0.34)',
    'rgba(145,32,24,0.28)',
    'rgba(71,84,103,0.28)',
    'rgba(5,96,58,0.28)',
    'rgba(255,255,255,0.34)',
  ],
}

const DARK_MAGNITUDE: MagnitudeScale = {
  // error-600, error-900, gray-700, success-900, success-500 — the arms deepen
  // toward the centre here, since the card they sit on is the dark one.
  colors: ['#d92d20', '#7a271a', '#344054', '#054f31', '#12b76a'],
  inks: ['#ffffff', '#fda29b', '#d0d5dd', '#6ce9a6', '#053321'],
  hatch: [
    'rgba(255,255,255,0.30)',
    'rgba(253,162,155,0.26)',
    'rgba(208,213,221,0.26)',
    'rgba(108,233,166,0.26)',
    'rgba(5,51,33,0.32)',
  ],
}

/** Which band a value falls in, given the scale's own ends. */
export function magnitudeStep(
  value: number,
  min: number,
  max: number,
  bands = LIGHT_MAGNITUDE.colors.length,
): number {
  const span = max - min
  if (span <= 0) return 0
  const ratio = (value - min) / span
  const index = Math.floor(ratio * bands)
  return Math.min(Math.max(index, 0), bands - 1)
}

/**
 * The register's three states as fills.
 *
 * Attendance is categorical, not a magnitude, so it gets its own palette rather
 * than a slice of the ramp above: present and absent are opposite outcomes, and
 * a sequential scale would imply one is "more" of the other.
 *
 * `unrecorded` is deliberately the surface colour rather than a third hue — a
 * slot nobody took the register for is *nothing*, and the grid draws it as bare
 * texture. Painting it would make the commonest cell the loudest one.
 */
export interface AttendanceScale {
  present: string
  presentInk: string
  absent: string
  absentInk: string
  unrecorded: string
}

const LIGHT_ATTENDANCE: AttendanceScale = {
  // success-50 / success-700, error-50 / error-700 — a wash with legible ink,
  // so a full grid of them stays readable rather than shouting in two colours.
  present: '#d1fadf',
  presentInk: '#027a48',
  absent: '#fee4e2',
  absentInk: '#b42318',
  unrecorded: '#ffffff',
}

const DARK_ATTENDANCE: AttendanceScale = {
  present: 'rgba(18,183,106,0.20)',
  presentInk: '#32d583',
  absent: 'rgba(240,68,56,0.20)',
  absentInk: '#f97066',
  unrecorded: '#101828',
}

export interface ChartChrome {
  /** Axis ticks and legends. `gray-500` / `gray-400`. */
  label: string
  /** Hairline grid. `gray-200` / `gray-800`. */
  grid: string
  /** The class band's fill, and the radar web. `gray-300` / `gray-700`. */
  neutral: string
  /** The card the chart sits on — what a marker's ring has to match. */
  surface: string
  tooltip: 'light' | 'dark'
  /** The heatmap's sequential ramp, stepped for this mode's surface. */
  magnitude: MagnitudeScale
  /** The register's categorical fills. */
  attendance: AttendanceScale
}

const LIGHT: ChartChrome = {
  label: '#667085',
  grid: '#e4e7ec',
  neutral: '#d0d5dd',
  surface: '#ffffff',
  tooltip: 'light',
  magnitude: LIGHT_MAGNITUDE,
  attendance: LIGHT_ATTENDANCE,
}

const DARK: ChartChrome = {
  label: '#98a2b3',
  grid: '#1d2939',
  neutral: '#344054',
  surface: '#101828',
  tooltip: 'dark',
  magnitude: DARK_MAGNITUDE,
  attendance: DARK_ATTENDANCE,
}

/**
 * Whether the app is in dark mode, kept live.
 *
 * `ThemeProvider` toggles a `dark` class on `<html>` and offers a `useTheme()`
 * inject, but that inject is untyped and unavailable to a chart teleported out
 * of the provider's tree. Watching the class directly works from anywhere and
 * needs no ancestor.
 */
export function useChartTheme() {
  const isDark = ref(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  )

  let observer: MutationObserver | null = null

  onMounted(() => {
    observer = new MutationObserver(() => {
      isDark.value = document.documentElement.classList.contains('dark')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  const chrome = computed<ChartChrome>(() => (isDark.value ? DARK : LIGHT))

  return { isDark, chrome }
}

/** Chart defaults every analytics chart shares, so they read as one family. */
export function baseChartOptions() {
  return {
    fontFamily: 'Outfit, sans-serif',
    toolbar: { show: false },
    zoom: { enabled: false },
    background: 'transparent',
    animations: { enabled: true, easing: 'easeinout' as const, speed: 500 },
  }
}
