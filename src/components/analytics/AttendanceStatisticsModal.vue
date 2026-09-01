<template>
  <StatisticsModalShell
    :open="open"
    :title="t('statistics.attendanceClassTitle')"
    :subtitle="headerSubtitle"
    :note="t('statistics.attendanceNote')"
    size="xl"
    @close="emit('close')"
  >
    <template v-if="tabs.length > 1" #tabs>
      <StatisticsTabs v-model="tabModel" :items="tabs" />
    </template>

    <template #filters>
      <div v-if="tab === 'register'" class="w-full sm:w-64">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('statistics.offering') }}
        </label>
        <SelectMenu
          v-model="offeringId"
          :options="offeringOptions"
          :placeholder="offeringsLoading ? t('common.loading') : t('statistics.selectOffering')"
          :aria-label="t('statistics.offering')"
          :disabled="offeringsLoading || offeringOptions.length <= 1"
        />
      </div>

      <div v-else class="w-full sm:w-64">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('statistics.classGroup') }}
        </label>
        <SelectMenu
          v-model="classGroupId"
          :options="classGroupOptions"
          :placeholder="t('statistics.selectClassGroup')"
          :aria-label="t('statistics.classGroup')"
          :disabled="classGroupOptions.length <= 1"
        />
      </div>

      <div class="w-full sm:w-36">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('statistics.quarter') }}
        </label>
        <SelectMenu
          v-model="quarterModel"
          :options="quarterOptions"
          :placeholder="t('statistics.allQuarters')"
          :aria-label="t('statistics.quarter')"
          clearable
          :clear-label="t('statistics.allQuarters')"
        />
      </div>

      <div class="w-full sm:w-40">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('assignments.dateFrom') }}
        </label>
        <DatePicker
          v-model="dateFrom"
          :max-date="dateTo"
          :placeholder="t('assignments.pickDate')"
          :aria-label="t('assignments.dateFrom')"
          clearable
        />
      </div>

      <div class="w-full sm:w-40">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('assignments.dateTo') }}
        </label>
        <DatePicker
          v-model="dateTo"
          :min-date="dateFrom"
          :placeholder="t('assignments.pickDate')"
          :aria-label="t('assignments.dateTo')"
          clearable
        />
      </div>

      <!-- Only the overview has a threshold to set; the register grid shows
           every cell and lets the reader draw their own line. -->
      <div v-if="tab === 'overview'" class="w-full sm:w-36">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('statistics.atRiskBelow') }}
        </label>
        <SelectMenu
          v-model="thresholdModel"
          :options="thresholdOptions"
          :aria-label="t('statistics.atRiskBelow')"
        />
      </div>
    </template>

    <template v-if="tab === 'register'">
      <StatePanel :loading="heatmapLoading" :error="heatmapError" @retry="loadHeatmap" />
      <p
        v-if="!heatmapLoading && !heatmapError && !offeringId"
        class="py-16 text-center text-sm text-gray-500 dark:text-gray-400"
      >
        {{ t('statistics.pickOffering') }}
      </p>
      <AttendanceHeatmap v-else-if="!heatmapLoading && !heatmapError && heatmap" :data="heatmap" />
    </template>

    <template v-else>
      <StatePanel :loading="overviewLoading" :error="overviewError" @retry="loadOverview" />
      <p
        v-if="!overviewLoading && !overviewError && !classGroupId"
        class="py-16 text-center text-sm text-gray-500 dark:text-gray-400"
      >
        {{ t('statistics.pickClassGroup') }}
      </p>
      <ClassAttendanceOverview
        v-else-if="!overviewLoading && !overviewError && overview"
        :data="overview"
      />
    </template>
  </StatisticsModalShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import StatePanel from '@/components/analytics/StatePanel.vue'
import StatisticsModalShell from '@/components/analytics/StatisticsModalShell.vue'
import StatisticsTabs, { type StatisticsTabItem } from '@/components/analytics/StatisticsTabs.vue'
import AttendanceHeatmap from '@/components/analytics/AttendanceHeatmap.vue'
import ClassAttendanceOverview from '@/components/analytics/ClassAttendanceOverview.vue'
import type { StatisticsOfferingOption } from '@/components/analytics/ClassStatisticsModal.vue'
import {
  getAttendanceHeatmapApi,
  getClassAttendanceOverviewApi,
  readAnalyticsError,
  type AttendanceHeatmapResponse,
  type ClassAttendanceOverviewResponse,
} from '@/api/analytics'
import { useCurrentQuarter } from '@/composables/useCurrentQuarter'

export interface StatisticsClassGroupOption {
  classGroupId: number
  label: string
  sublabel?: string
}

/**
 * A class's attendance, from either end.
 *
 * **Register** is the raw grid — every student against every lesson, with the
 * cells nobody filled in shown as such. It answers "what actually happened in
 * my lessons", and is per offering.
 *
 * **Overview** aggregates a whole class group across all its subjects and ranks
 * the students, with those under a threshold called out. It answers "who is
 * missing school", which is a homeroom question rather than a subject one, and
 * so is scoped to the class group rather than to one offering.
 *
 * Both are staff-only: each names every student in the class.
 */
const props = defineProps<{
  open: boolean
  /** The offerings the caller may look at — anything else is a 403. */
  offerings?: StatisticsOfferingOption[]
  /** The class groups the caller may look at. Omit to hide the overview tab. */
  classGroups?: StatisticsClassGroupOption[]
  defaultOfferingId?: number | null
  defaultClassGroupId?: number | null
  offeringsLoading?: boolean
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n()
const { quarter: currentQuarter, load: loadCurrentQuarter } = useCurrentQuarter()

type Tab = 'register' | 'overview'

const tab = ref<Tab>('register')
const offeringId = ref<number | string | null>(null)
const classGroupId = ref<number | string | null>(null)
/** Nullable: the register happily spans the whole year. */
const quarter = ref<number | null>(currentQuarter.value)
const dateFrom = ref('')
const dateTo = ref('')
const threshold = ref(90)

const heatmap = ref<AttendanceHeatmapResponse | null>(null)
const heatmapLoading = ref(false)
const heatmapError = ref('')

const overview = ref<ClassAttendanceOverviewResponse | null>(null)
const overviewLoading = ref(false)
const overviewError = ref('')

const offerings = computed(() => props.offerings ?? [])
const classGroups = computed(() => props.classGroups ?? [])

/** A tab with nothing to point at is not offered rather than shown empty. */
const tabs = computed<StatisticsTabItem[]>(() => {
  const built: StatisticsTabItem[] = []
  if (offerings.value.length) built.push({ value: 'register', label: t('statistics.tabRegister') })
  if (classGroups.value.length) {
    built.push({ value: 'overview', label: t('statistics.tabClassOverview') })
  }
  return built
})

const tabModel = computed<string>({
  get: () => tab.value,
  set: value => {
    tab.value = value as Tab
  },
})

const offeringOptions = computed<SelectOption[]>(() =>
  offerings.value.map(offering => ({
    value: offering.offeringId,
    label: offering.label,
    sublabel: offering.sublabel,
  })),
)

const classGroupOptions = computed<SelectOption[]>(() =>
  classGroups.value.map(group => ({
    value: group.classGroupId,
    label: group.label,
    sublabel: group.sublabel,
  })),
)

const headerSubtitle = computed(() => {
  if (tab.value === 'register' && heatmap.value) {
    return `${heatmap.value.offering.subject} · ${heatmap.value.offering.class_group}`
  }
  if (tab.value === 'overview' && overview.value) {
    return `${overview.value.class_group.name} · ${overview.value.academic_year.year}`
  }
  return t('statistics.attendanceClassSubtitle')
})

const quarterOptions = computed<SelectOption[]>(() =>
  [1, 2, 3, 4].map(value => ({ value, label: t('gradeReport.quarterOption', { quarter: value }) })),
)

const quarterModel = computed<number | string | null>({
  get: () => quarter.value,
  set: value => {
    quarter.value = value === null ? null : Number(value)
  },
})

const thresholdOptions = computed<SelectOption[]>(() =>
  [95, 90, 85, 80, 75, 60].map(value => ({ value, label: `${value}%` })),
)

const thresholdModel = computed<number | string | null>({
  get: () => threshold.value,
  set: value => {
    const picked = Number(value)
    if (picked >= 0 && picked <= 100) threshold.value = picked
  },
})

async function loadHeatmap() {
  if (!offeringId.value) {
    heatmap.value = null
    return
  }
  heatmapLoading.value = true
  heatmapError.value = ''
  try {
    const { data } = await getAttendanceHeatmapApi(Number(offeringId.value), {
      quarter: quarter.value ?? undefined,
      date_from: dateFrom.value || undefined,
      date_to: dateTo.value || undefined,
    })
    heatmap.value = data
  } catch (error) {
    heatmap.value = null
    heatmapError.value = readAnalyticsError(error) || t('statistics.loadError')
  } finally {
    heatmapLoading.value = false
  }
}

async function loadOverview() {
  if (!classGroupId.value) {
    overview.value = null
    return
  }
  overviewLoading.value = true
  overviewError.value = ''
  try {
    const { data } = await getClassAttendanceOverviewApi(Number(classGroupId.value), {
      quarter: quarter.value ?? undefined,
      date_from: dateFrom.value || undefined,
      date_to: dateTo.value || undefined,
      at_risk_below: threshold.value,
    })
    overview.value = data
  } catch (error) {
    overview.value = null
    overviewError.value = readAnalyticsError(error) || t('statistics.loadError')
  } finally {
    overviewLoading.value = false
  }
}

watch(
  () => props.open,
  isOpen => {
    if (!isOpen) return
    dateFrom.value = ''
    dateTo.value = ''
    threshold.value = 90
    tab.value = (tabs.value[0]?.value as Tab) ?? 'register'

    const onlyOffering = offerings.value.length === 1 ? offerings.value[0].offeringId : null
    offeringId.value = props.defaultOfferingId ?? onlyOffering
    const onlyGroup = classGroups.value.length === 1 ? classGroups.value[0].classGroupId : null
    classGroupId.value = props.defaultClassGroupId ?? onlyGroup

    const seeded = currentQuarter.value
    quarter.value = seeded
    loadCurrentQuarter().then(() => {
      if (quarter.value === seeded && currentQuarter.value !== seeded) {
        quarter.value = currentQuarter.value
      }
    })
  },
)

// The host may still be loading its offerings when the modal opens.
watch(
  () => props.offerings,
  value => {
    if (!props.open || offeringId.value) return
    if (props.defaultOfferingId) offeringId.value = props.defaultOfferingId
    else if (value?.length === 1) offeringId.value = value[0].offeringId
  },
)

watch([() => props.open, tab, offeringId, quarter, dateFrom, dateTo], () => {
  if (props.open && tab.value === 'register') loadHeatmap()
})

watch([() => props.open, tab, classGroupId, quarter, dateFrom, dateTo, threshold], () => {
  if (props.open && tab.value === 'overview') loadOverview()
})
</script>
