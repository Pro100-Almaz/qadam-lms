<template>
  <StatisticsModalShell
    :open="open"
    :title="t('statistics.classTitle')"
    :subtitle="headerSubtitle"
    :note="t('statistics.zeroFillNote')"
    size="xl"
    @close="emit('close')"
  >
    <template #filters>
      <div class="w-full sm:w-64">
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

      <div class="w-full sm:w-48">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('statistics.groupBy') }}
        </label>
        <SelectMenu v-model="groupByModel" :options="groupByOptions" :aria-label="t('statistics.groupBy')" />
      </div>

      <label class="flex cursor-pointer items-center gap-2 py-2.5 text-sm text-gray-600 dark:text-gray-400">
        <input
          v-model="includeSubtopics"
          type="checkbox"
          class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
        />
        {{ t('statistics.includeSubtopics') }}
      </label>
    </template>

    <StatePanel :loading="loading" :error="loadError" @retry="loadHeatmap" />
    <p
      v-if="!loading && !loadError && !offeringId"
      class="py-16 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      {{ t('statistics.pickOffering') }}
    </p>
    <TopicHeatmap v-else-if="!loading && !loadError && heatmap" :data="heatmap" />
  </StatisticsModalShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import StatePanel from '@/components/analytics/StatePanel.vue'
import StatisticsModalShell from '@/components/analytics/StatisticsModalShell.vue'
import TopicHeatmap from '@/components/analytics/TopicHeatmap.vue'
import {
  getTopicHeatmapApi,
  readAnalyticsError,
  type HeatmapGroupBy,
  type TopicHeatmapResponse,
} from '@/api/analytics'
import { useCurrentQuarter } from '@/composables/useCurrentQuarter'

export interface StatisticsOfferingOption {
  /** Subject offering id — one subject taught to one class group. */
  offeringId: number
  label: string
  /** The class group, usually — shown under the label in the picker. */
  sublabel?: string
}

/**
 * A class against the **lesson topics** they were marked on — the gradebook a
 * subject's own page keeps, not the assignments on the grading page. The two are
 * separate records; `AssignmentStatisticsModal` is the other one.
 *
 * Restricted to staff and the teachers of the offering: the grid names every
 * student in it, so a student or parent asking gets a 403 rather than a redacted
 * view. Hosts must gate the button accordingly.
 */
const props = defineProps<{
  open: boolean
  /** The offerings the caller may look at — anything else is a 403. */
  offerings: StatisticsOfferingOption[]
  defaultOfferingId?: number | null
  offeringsLoading?: boolean
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n()
const { quarter: currentQuarter, load: loadCurrentQuarter } = useCurrentQuarter()

const offeringId = ref<number | string | null>(null)
/** Nullable, unlike the report's: the heatmap happily spans the whole year. */
const quarter = ref<number | null>(currentQuarter.value)
const groupBy = ref<HeatmapGroupBy>('topic_title')
const includeSubtopics = ref(false)

const heatmap = ref<TopicHeatmapResponse | null>(null)
const loading = ref(false)
const loadError = ref('')

const offeringOptions = computed<SelectOption[]>(() =>
  props.offerings.map(offering => ({
    value: offering.offeringId,
    label: offering.label,
    sublabel: offering.sublabel,
  })),
)

const headerSubtitle = computed(() => {
  if (heatmap.value) {
    return `${heatmap.value.offering.subject} · ${heatmap.value.offering.class_group}`
  }
  return t('statistics.classSubtitle')
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

const groupByOptions = computed<SelectOption[]>(() => [
  {
    value: 'topic_title',
    label: t('statistics.groupTitle'),
    sublabel: t('statistics.groupTitleHint'),
  },
  { value: 'topic', label: t('statistics.groupTopic'), sublabel: t('statistics.groupTopicHint') },
])

const groupByModel = computed<number | string | null>({
  get: () => groupBy.value,
  set: value => {
    groupBy.value = (value as HeatmapGroupBy) ?? 'topic_title'
  },
})

async function loadHeatmap() {
  if (!offeringId.value) {
    heatmap.value = null
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await getTopicHeatmapApi(Number(offeringId.value), {
      quarter: quarter.value ?? undefined,
      group_by: groupBy.value,
      include_subtopics: includeSubtopics.value,
    })
    heatmap.value = data
  } catch (error) {
    heatmap.value = null
    loadError.value = readAnalyticsError(error) || t('statistics.loadError')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  isOpen => {
    if (!isOpen) return
    groupBy.value = 'topic_title'
    includeSubtopics.value = false
    // A single offering needs no choosing; otherwise honour the host's pick.
    const only = props.offerings.length === 1 ? props.offerings[0].offeringId : null
    offeringId.value = props.defaultOfferingId ?? only

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
  offerings => {
    if (!props.open || offeringId.value) return
    if (props.defaultOfferingId) offeringId.value = props.defaultOfferingId
    else if (offerings.length === 1) offeringId.value = offerings[0].offeringId
  },
)

// `open` is a dependency so reopening refetches even when nothing else moved —
// otherwise a modal closed on a failed load reopens still showing the failure.
watch([() => props.open, offeringId, quarter, groupBy, includeSubtopics], () => {
  if (props.open) loadHeatmap()
})
</script>
