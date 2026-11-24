<template>
  <div class="space-y-6">
    <!-- Loading: mirrors the layout so nothing jumps when data lands -->
    <div v-if="loading" class="space-y-6" role="status" :aria-label="t('common.loading')">
      <div class="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5"></div>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div class="h-[360px] animate-pulse rounded-xl bg-gray-100 dark:bg-white/5"></div>
        <div class="h-[360px] animate-pulse rounded-xl bg-gray-100 dark:bg-white/5"></div>
      </div>
      <div class="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5"></div>
    </div>

    <template v-else>
      <StatePanel v-if="error" :loading="false" :error="error" @retry="load" />

      <!-- Summary unavailable (not deployed or not allowed for this role): say so quietly, show what the payload already has -->
      <p
        v-else-if="missing"
        class="rounded-lg bg-gray-50 px-4 py-3 text-theme-sm text-gray-600 dark:bg-white/5 dark:text-gray-400"
      >
        {{ t('studentDetail.overview.unavailable') }}
      </p>

      <!-- 1. Signal strip -->
      <section
        v-if="overview"
        :aria-label="t('studentDetail.overview.signals')"
        class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      >
        <ul class="flex flex-col divide-y divide-gray-200 dark:divide-gray-800 sm:flex-row sm:flex-wrap sm:divide-x sm:divide-y-0">
          <li v-for="fact in facts" :key="fact.tab" class="min-w-0 flex-1 sm:basis-1/4">
            <component
              :is="canGo(fact.tab) ? 'button' : 'div'"
              v-bind="canGo(fact.tab) ? { type: 'button', onClick: () => emit('navigate', fact.tab) } : {}"
              class="block h-full w-full rounded-xl px-5 py-4 text-left"
              :class="canGo(fact.tab) ? 'transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500 dark:hover:bg-white/5' : ''"
            >
              <span class="block text-theme-xs text-gray-500 dark:text-gray-400">{{ fact.label }}</span>
              <span class="mt-0.5 flex items-center gap-2 text-theme-xl font-semibold text-gray-800 dark:text-white/90" :class="fact.valueClass">
                {{ fact.value }}
                <span v-if="fact.dots !== null" class="flex gap-0.5" aria-hidden="true">
                  <span
                    v-for="n in 5"
                    :key="n"
                    class="h-1.5 w-1.5 rounded-full"
                    :class="n <= fact.dots ? 'bg-gray-600 dark:bg-gray-300' : 'bg-gray-200 dark:bg-gray-700'"
                  ></span>
                </span>
              </span>
              <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                <template v-for="(part, i) in fact.details" :key="i">
                  <span v-if="i" aria-hidden="true"> · </span>
                  <span>
                    <span v-if="part.dir" aria-hidden="true">{{ part.dir === 'up' ? '▲' : part.dir === 'down' ? '▼' : '' }}</span>
                    <span v-if="part.dir" class="sr-only">{{ t(`studentDetail.overview.dir.${part.dir}`) }}</span>
                    {{ part.text }}
                  </span>
                </template>
              </span>
            </component>
          </li>
        </ul>
      </section>

      <!-- 2. Charts -->
      <div v-if="hasGrades || overview" class="grid grid-cols-1 gap-6" :class="overview && hasGrades ? 'md:grid-cols-2' : ''">
        <section
          v-if="overview"
          class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        >
          <header class="mb-3 flex items-center justify-between gap-3">
            <h2 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">{{ t('studentDetail.overview.trajectory') }}</h2>
            <button type="button" :class="toggleClass" :aria-pressed="trajectoryTable" @click="trajectoryTable = !trajectoryTable">
              {{ trajectoryTable ? t('studentDetail.overview.showChart') : t('studentDetail.overview.showTable') }}
            </button>
          </header>
          <div v-if="!hasTrajectory" class="flex h-[320px] items-center justify-center text-theme-sm text-gray-500 dark:text-gray-400">
            {{ t('studentDetail.overview.noQuarterData') }}
          </div>
          <VueApexCharts v-else-if="!trajectoryTable" type="line" height="320" :options="lineOptions" :series="lineSeries" />
          <table v-else class="w-full text-theme-sm">
            <thead>
              <tr class="border-b border-gray-200 text-left text-theme-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th scope="col" class="py-2 font-medium">{{ t('studentDetail.overview.quarter') }}</th>
                <th scope="col" class="py-2 text-right font-medium">{{ t('studentDetail.overview.student') }}</th>
                <th scope="col" class="py-2 text-right font-medium">{{ t('studentDetail.overview.classMean') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="q in quarterRows" :key="q.quarter" class="border-b border-gray-100 last:border-0 dark:border-gray-800">
                <th scope="row" class="py-2 text-left font-medium text-gray-800 dark:text-white/90">{{ t('studentDetail.common.quarterShort', { n: q.quarter }) }}</th>
                <td class="py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">{{ fmt(q.average) }}</td>
                <td class="py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">{{ fmt(q.class_average) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section
          v-if="hasGrades"
          class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        >
          <header class="mb-3 flex items-center justify-between gap-3">
            <h2 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">
              {{ t('studentDetail.overview.radar', { quarter }) }}
            </h2>
            <button type="button" :class="toggleClass" :aria-pressed="radarTable" @click="radarTable = !radarTable">
              {{ radarTable ? t('studentDetail.overview.showChart') : t('studentDetail.overview.showTable') }}
            </button>
          </header>
          <div v-if="!radarSubjects.length" class="flex h-[320px] items-center justify-center text-theme-sm text-gray-500 dark:text-gray-400">
            {{ t('studentDetail.overview.noQuarterData') }}
          </div>
          <VueApexCharts v-else-if="!radarTable" type="radar" height="320" :options="radarOptions" :series="radarSeries" />
          <table v-else class="w-full text-theme-sm">
            <thead>
              <tr class="border-b border-gray-200 text-left text-theme-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th scope="col" class="py-2 font-medium">{{ t('studentDetail.overview.subject') }}</th>
                <th scope="col" class="py-2 text-right font-medium">{{ t('studentDetail.overview.student') }}</th>
                <th scope="col" class="py-2 text-right font-medium">{{ t('studentDetail.overview.classMean') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in radarSubjects" :key="s.name" class="border-b border-gray-100 last:border-0 dark:border-gray-800">
                <th scope="row" class="py-2 text-left font-medium text-gray-800 dark:text-white/90">{{ s.name }}</th>
                <td class="py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">{{ fmt(s.grade) }}</td>
                <td class="py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">{{ fmt(s.classMean) }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <!-- 3. Report card -->
      <section class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <h2 class="px-5 pb-2 pt-5 text-theme-xl font-semibold text-gray-800 dark:text-white/90">
          {{ t('studentDetail.overview.reportCard') }}
        </h2>
        <p v-if="!hasGrades" class="px-5 pb-8 pt-2 text-theme-sm text-gray-500 dark:text-gray-400">
          {{ t('studentDetail.overview.empty') }}
        </p>
        <div v-else class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="w-full min-w-[620px] text-theme-sm">
            <thead>
              <tr class="border-b border-gray-200 text-left text-theme-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th scope="col" class="px-5 py-3 font-medium">{{ t('studentDetail.overview.subject') }}</th>
                <th
                  v-for="q in 4"
                  :key="q"
                  scope="col"
                  class="px-3 py-3 text-center font-medium"
                  :class="q === quarter ? 'bg-gray-50 font-semibold text-gray-800 dark:bg-white/5 dark:text-white/90' : ''"
                  :aria-current="q === quarter ? 'true' : undefined"
                >
                  {{ t('studentDetail.common.quarterShort', { n: q }) }}
                </th>
                <th scope="col" class="px-3 py-3 text-center font-medium">{{ t('studentDetail.overview.final') }}</th>
                <th scope="col" class="px-5 py-3 text-center font-medium">{{ t('studentDetail.overview.trend') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="row.name"
                class="border-b border-gray-100 last:border-0 dark:border-gray-800"
                :class="row.id !== null ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5' : ''"
                @click="openRow(row)"
              >
                <th scope="row" class="px-5 py-3 text-left font-medium text-gray-800 dark:text-white/90">
                  <button
                    v-if="row.id !== null"
                    type="button"
                    class="rounded text-left font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                    @click.stop="openRow(row)"
                  >{{ row.name }}</button>
                  <template v-else>{{ row.name }}</template>
                </th>
                <td
                  v-for="q in 4"
                  :key="q"
                  class="px-3 py-2 text-center"
                  :class="q === quarter ? 'bg-gray-50 dark:bg-white/5' : ''"
                >
                  <GradeChip :value="row.quarters[q - 1]" size="sm" />
                </td>
                <td class="px-3 py-2 text-center">
                  <span class="inline-flex items-center gap-1.5">
                    <GradeChip :value="row.final" size="sm" />
                    <span v-if="row.final" class="text-theme-xs tabular-nums text-gray-500 dark:text-gray-400">{{ fmt(row.final) }}</span>
                  </span>
                </td>
                <td class="px-5 py-2 text-center text-theme-sm text-gray-700 dark:text-gray-300">
                  <template v-if="row.trend">
                    <span aria-hidden="true">{{ row.trend === 'up' ? '▲' : row.trend === 'down' ? '▼' : '=' }}</span>
                    <span class="sr-only">{{ t(`studentDetail.overview.dir.${row.trend}`) }}</span>
                  </template>
                  <span v-else aria-hidden="true">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 4. Needs attention -->
      <section v-if="overview && attention.length" class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 class="mb-3 text-theme-xl font-semibold text-gray-800 dark:text-white/90">{{ t('studentDetail.overview.attentionTitle') }}</h2>
        <ul class="space-y-2">
          <li v-for="(item, i) in attention" :key="i">
            <component
              :is="canGo(attentionTab[item.code]) ? 'button' : 'div'"
              v-bind="canGo(attentionTab[item.code]) ? { type: 'button', onClick: () => emit('navigate', attentionTab[item.code]) } : {}"
              class="flex w-full items-start gap-3 rounded-lg px-4 py-3 text-left text-theme-sm transition-colors focus-visible:outline-2 focus-visible:outline-brand-500"
              :class="[
                item.severity === 'critical'
                  ? 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400'
                  : 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400',
                canGo(attentionTab[item.code])
                  ? (item.severity === 'critical' ? 'hover:bg-error-100' : 'hover:bg-warning-100')
                  : '',
              ]"
            >
              <component :is="item.severity === 'critical' ? CircleAlert : TriangleAlert" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span class="min-w-0">
                <span class="font-semibold">{{ t(`studentDetail.overview.severity.${item.severity}`) }}.</span>
                {{ attentionText(item) }}
                <span v-if="item.subject_name" class="block text-theme-xs opacity-80">{{ item.subject_name }}</span>
              </span>
            </component>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { isAxiosError } from 'axios'
import VueApexCharts from 'vue3-apexcharts'
import { CircleAlert, TriangleAlert } from 'lucide-vue-next'
import StatePanel from '@/components/analytics/StatePanel.vue'
import {
  SERIES_CLASS,
  SERIES_STUDENT,
  baseChartOptions,
  padRadar,
  radarPaddingMarkers,
  useChartTheme,
} from '@/components/analytics/chartTheme'
import { getStudentOverviewApi } from '@/api/students'
import { currentIntlLocale } from '@/i18n'
import type { SubjectQuarterGrade } from '@/types/student'
import type { AttentionCode, AttentionItem, StudentOverview } from '@/types/studentOverview'
import GradeChip from './GradeChip.vue'

type Tab = 'grades' | 'attendance' | 'homeworks' | 'wellbeing'
type Dir = 'up' | 'down' | 'same'

const props = defineProps<{
  studentId: number
  quarter: number
  /** Quarter ("1"–"4") → subject name → grade and class mean, from the StudentDetail payload. */
  subjectQuarterGrades: Record<string, Record<string, SubjectQuarterGrade>>
  /** Subject name → average mark (2–5); 0 = not graded. Gives the final column and the subject list. */
  cumulativeSubjectGrades?: Record<string, number>
  /** Subject name → subject id, so a row can open its subject. Rows without an id are not clickable. */
  subjectIds?: Record<string, number>
  /** Tabs the viewer may open; facts and attention items pointing elsewhere are plain text. */
  allowedTabs: readonly string[]
}>()

const emit = defineEmits<{
  (e: 'open-subject', subjectId: number): void
  (e: 'navigate', tab: Tab): void
}>()

const { t } = useI18n()
const canGo = (tab: Tab) => props.allowedTabs.includes(tab)
const { chrome } = useChartTheme()

const overview = ref<StudentOverview | null>(null)
const loading = ref(true)
const error = ref('')
const missing = ref(false)
const trajectoryTable = ref(false)
const radarTable = ref(false)

const toggleClass =
  'shrink-0 rounded-lg px-2.5 py-1 text-theme-xs font-medium text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-500 aria-pressed:bg-gray-100 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/5 dark:aria-pressed:bg-white/10'

// ─── Fetch (stale responses are dropped) ──────────────────────────────────────
let requestId = 0
async function load() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  missing.value = false
  try {
    const data = await getStudentOverviewApi(props.studentId, props.quarter)
    if (id !== requestId) return
    overview.value = data
  } catch (e) {
    if (id !== requestId) return
    overview.value = null
    // 404: endpoint not deployed; 403: role can't see the summary (only homeroom teachers among teachers)
    if (isAxiosError(e) && (e.response?.status === 404 || e.response?.status === 403)) missing.value = true
    else error.value = t('studentDetail.overview.loadFailed')
  } finally {
    if (id === requestId) loading.value = false
  }
}
onMounted(load)
watch(() => [props.studentId, props.quarter], load)

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number | null | undefined) => (v === null || v === undefined || v === 0 ? '—' : v.toFixed(1))
const round1 = (v: number) => Math.round(v * 10) / 10

function dirOf(delta: number): Dir {
  const d = round1(delta)
  return d > 0 ? 'up' : d < 0 ? 'down' : 'same'
}

// ─── Report card (from props only) ────────────────────────────────────────────
interface Row {
  name: string
  id: number | null
  quarters: (number | null)[]
  final: number | null
  trend: Dir | null
}

const rows = computed<Row[]>(() => {
  const names = new Set(Object.keys(props.cumulativeSubjectGrades ?? {}))
  for (const q of [1, 2, 3, 4]) Object.keys(props.subjectQuarterGrades[String(q)] ?? {}).forEach((n) => names.add(n))
  return [...names].map((name) => {
    const quarters = [1, 2, 3, 4].map((q) => props.subjectQuarterGrades[String(q)]?.[name]?.grade || null)
    const cur = quarters[props.quarter - 1]
    const prev = props.quarter > 1 ? quarters[props.quarter - 2] : null
    return {
      name,
      id: props.subjectIds?.[name] ?? null,
      quarters,
      final: props.cumulativeSubjectGrades?.[name] || null,
      trend: cur && prev ? dirOf(cur - prev) : null,
    }
  })
})

const hasGrades = computed(() => rows.value.some((r) => r.final || r.quarters.some(Boolean)))

function openRow(row: Row) {
  if (row.id !== null) emit('open-subject', row.id)
}

// ─── Signal strip ─────────────────────────────────────────────────────────────
interface Fact {
  tab: Tab
  label: string
  value: string
  valueClass?: string
  dots: number | null
  details: { text: string; dir?: Dir }[]
}

const facts = computed<Fact[]>(() => {
  const o = overview.value
  if (!o) return []
  const g = o.grades
  const prevQ = props.quarter - 1

  const gradeDetails: Fact['details'] = []
  if (g.class_average !== null) gradeDetails.push({ text: t('studentDetail.overview.classValue', { value: g.class_average.toFixed(1) }) })
  if (g.average !== null && g.previous_quarter_average !== null && prevQ >= 1) {
    const delta = g.average - g.previous_quarter_average
    gradeDetails.push({
      dir: dirOf(delta),
      text: t('studentDetail.overview.vsQuarter', { delta: Math.abs(round1(delta)).toFixed(1), quarter: prevQ }),
    })
  }

  const a = o.attendance
  const attDetails: Fact['details'] = []
  if (a.class_rate !== null) attDetails.push({ text: t('studentDetail.overview.classValue', { value: `${Math.round(a.class_rate)}%` }) })
  if (a.rate !== null && a.class_rate !== null) {
    const delta = a.rate - a.class_rate
    attDetails.push({
      dir: dirOf(delta),
      text: t('studentDetail.overview.vsClassPp', { delta: Math.abs(Math.round(delta)) }),
    })
  }

  const h = o.homework
  const w = o.wellbeing.latest

  return [
    {
      tab: 'grades',
      label: t('studentDetail.overview.average'),
      value: fmt(g.average),
      dots: null,
      details: gradeDetails,
    },
    {
      tab: 'attendance',
      label: t('studentDetail.overview.attendance'),
      value: a.rate === null ? '—' : `${Math.round(a.rate)}%`,
      dots: null,
      details: attDetails.length ? attDetails : [{ text: t('studentDetail.overview.absentCount', { count: a.absent }) }],
    },
    {
      tab: 'homeworks',
      label: t('studentDetail.overview.homework'),
      value: t('studentDetail.overview.overdueCount', { count: h.overdue }),
      valueClass: h.overdue > 0 ? '!text-error-600 dark:!text-error-400' : '',
      dots: null,
      details: [
        { text: t('studentDetail.overview.pendingCount', { count: h.pending }) },
        { text: t('studentDetail.overview.submittedOf', { submitted: h.submitted, total: h.total }) },
      ],
    },
    {
      tab: 'wellbeing',
      label: t('studentDetail.overview.wellbeing'),
      value: w ? `${w.score}/5` : '—',
      dots: w ? Math.round(w.score) : null,
      details: w
        ? [{ text: w.name }, { text: new Intl.DateTimeFormat(currentIntlLocale()).format(new Date(w.time_added)) }]
        : [{ text: t('studentDetail.overview.noWellbeing') }],
    },
  ]
})

// ─── Charts ───────────────────────────────────────────────────────────────────
const quarterRows = computed(() => overview.value?.grades.by_quarter ?? [])
const hasTrajectory = computed(() => quarterRows.value.some((q) => q.average !== null || q.class_average !== null))

const lineSeries = computed(() => [
  { name: t('studentDetail.overview.student'), data: quarterRows.value.map((q) => q.average) },
  { name: t('studentDetail.overview.classMean'), data: quarterRows.value.map((q) => q.class_average) },
])

const lineOptions = computed(() => ({
  chart: baseChartOptions(),
  colors: [SERIES_STUDENT, SERIES_CLASS],
  stroke: { width: [3, 2], dashArray: [0, 4], curve: 'straight' as const },
  markers: { size: 4, strokeWidth: 2, strokeColors: chrome.value.surface },
  legend: { position: 'top' as const, horizontalAlign: 'left' as const, labels: { colors: chrome.value.label } },
  grid: { borderColor: chrome.value.grid, strokeDashArray: 4, xaxis: { lines: { show: false } } },
  xaxis: {
    categories: quarterRows.value.map((q) => t('studentDetail.common.quarterShort', { n: q.quarter })),
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: chrome.value.label, fontSize: '12px' } },
  },
  yaxis: {
    min: 2,
    max: 5,
    tickAmount: 3,
    labels: { style: { colors: chrome.value.label, fontSize: '12px' }, formatter: (v: number) => v.toFixed(0) },
  },
  tooltip: { theme: chrome.value.tooltip, y: { formatter: (v: number | null) => (v === null ? '' : v.toFixed(1)) } },
}))

const radarSubjects = computed(() =>
  rows.value
    .map((r) => ({
      name: r.name,
      grade: r.quarters[props.quarter - 1],
      classMean: props.subjectQuarterGrades[String(props.quarter)]?.[r.name]?.class_mean ?? null,
    }))
    .filter((s) => s.grade),
)
const radarHasClass = computed(() => radarSubjects.value.some((s) => s.classMean))

const radarSeries = computed(() => {
  const series = [
    { name: t('studentDetail.overview.student'), data: padRadar<number | null>(radarSubjects.value.map((s) => s.grade), null) },
  ]
  if (radarHasClass.value) {
    series.push({
      name: t('studentDetail.overview.classMean'),
      data: padRadar<number | null>(radarSubjects.value.map((s) => (s.classMean ? round1(s.classMean) : null)), null),
    })
  }
  return series
})

const radarOptions = computed(() => {
  const withClass = radarHasClass.value
  const labels = padRadar(radarSubjects.value.map((s) => s.name), '')
  return {
    chart: { ...baseChartOptions(), type: 'radar', dropShadow: { enabled: false } },
    colors: withClass ? [SERIES_STUDENT, SERIES_CLASS] : [SERIES_STUDENT],
    fill: { opacity: withClass ? [0.2, 0.1] : [0.2] },
    stroke: { width: withClass ? [2.5, 2] : [2.5], dashArray: withClass ? [0, 4] : [0] },
    legend: { show: withClass, position: 'top' as const, horizontalAlign: 'left' as const, labels: { colors: chrome.value.label } },
    markers: {
      size: 4,
      strokeWidth: 2,
      strokeColors: chrome.value.surface,
      discrete: radarPaddingMarkers(radarSubjects.value.length, radarSeries.value.length),
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: labels,
      labels: {
        style: { fontSize: '11px', fontWeight: 500, colors: labels.map(() => chrome.value.label) },
        formatter: (name: string) => (name.length > 16 ? `${name.slice(0, 15)}…` : name),
      },
    },
    yaxis: { min: 0, max: 5, tickAmount: 5, labels: { style: { fontSize: '10px', colors: [chrome.value.label] } } },
    tooltip: { theme: chrome.value.tooltip, y: { formatter: (v: number | null) => (v ? `${v} / 5` : '') } },
    plotOptions: { radar: { size: 105, polygons: { strokeColors: chrome.value.grid, connectorColors: chrome.value.grid } } },
  }
})

// ─── Needs attention ──────────────────────────────────────────────────────────
const attentionTab: Record<AttentionCode, Tab> = {
  low_grade: 'grades',
  falling_grade: 'grades',
  absence_streak: 'attendance',
  low_attendance: 'attendance',
  overdue_homework: 'homeworks',
  wellbeing_drop: 'wellbeing',
}

const attention = computed(() =>
  [...(overview.value?.attention ?? [])].sort(
    (a, b) => Number(b.severity === 'critical') - Number(a.severity === 'critical'),
  ),
)

const attentionText = (item: AttentionItem) =>
  t(`studentDetail.overview.attention.${item.code}`, { ...item.params, subject: item.subject_name ?? '' })
</script>
