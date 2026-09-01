<template>
  <StatisticsModalShell
    :open="open"
    :title="t('statistics.assignmentClassTitle')"
    :subtitle="headerSubtitle"
    :note="missing === 'zero' ? t('statistics.assignmentZeroNote') : t('statistics.assignmentExcludeNote')"
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

      <div class="w-full sm:w-40">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('assignments.category') }}
        </label>
        <SelectMenu
          v-model="categoryModel"
          :options="categoryOptions"
          :placeholder="t('statistics.allCategories')"
          :aria-label="t('assignments.category')"
          clearable
          :clear-label="t('statistics.allCategories')"
        />
      </div>

      <!-- The heatmap has no quarter parameter; it is bounded by dates. -->
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

      <div class="w-full sm:w-48">
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('statistics.missing') }}
        </label>
        <SelectMenu v-model="missingModel" :options="missingOptions" :aria-label="t('statistics.missing')" />
      </div>
    </template>

    <StatePanel :loading="loading" :error="loadError" @retry="loadHeatmap" />
    <p
      v-if="!loading && !loadError && !offeringId"
      class="py-16 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      {{ t('statistics.pickOffering') }}
    </p>
    <AssignmentHeatmap v-else-if="!loading && !loadError && heatmap" :data="heatmap" />
  </StatisticsModalShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import StatePanel from '@/components/analytics/StatePanel.vue'
import StatisticsModalShell from '@/components/analytics/StatisticsModalShell.vue'
import AssignmentHeatmap from '@/components/analytics/AssignmentHeatmap.vue'
import type { StatisticsOfferingOption } from '@/components/analytics/ClassStatisticsModal.vue'
import {
  ASSIGNMENT_CATEGORIES,
  getAssignmentHeatmapApi,
  readAnalyticsError,
  type AssignmentCategory,
  type AssignmentHeatmapResponse,
  type MissingMode,
} from '@/api/analytics'

/**
 * A class against the **assignments** they were set — the record the grading
 * page keeps, not the lesson-topic gradebook on a subject's page.
 *
 * Bounded by dates rather than by a quarter, because that is what the endpoint
 * takes: an assignment belongs to an offering and a date, and the server has no
 * quarter of its own to filter on here.
 *
 * Restricted to the offering's teachers, its homeroom teacher, psychologists and
 * admin — the grid names every student in the class, so a student or parent
 * asking gets a 403. Hosts must gate the button accordingly.
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

const offeringId = ref<number | string | null>(null)
const category = ref<AssignmentCategory | null>(null)
const dateFrom = ref('')
const dateTo = ref('')
const missing = ref<MissingMode>('exclude')

const heatmap = ref<AssignmentHeatmapResponse | null>(null)
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
  return t('statistics.assignmentClassSubtitle')
})

const categoryOptions = computed<SelectOption[]>(() =>
  ASSIGNMENT_CATEGORIES.map(value => ({ value, label: t(`assignments.categories.${value}`) })),
)

const categoryModel = computed<number | string | null>({
  get: () => category.value,
  set: value => {
    category.value = (value as AssignmentCategory | null) ?? null
  },
})

const missingOptions = computed<SelectOption[]>(() => [
  {
    value: 'exclude',
    label: t('statistics.missing_exclude'),
    sublabel: t('statistics.missing_excludeHint'),
  },
  { value: 'zero', label: t('statistics.missing_zero'), sublabel: t('statistics.missing_zeroHint') },
])

const missingModel = computed<number | string | null>({
  get: () => missing.value,
  set: value => {
    missing.value = (value as MissingMode) ?? 'exclude'
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
    const { data } = await getAssignmentHeatmapApi(Number(offeringId.value), {
      category: category.value ?? undefined,
      date_from: dateFrom.value || undefined,
      date_to: dateTo.value || undefined,
      missing: missing.value,
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
    category.value = null
    dateFrom.value = ''
    dateTo.value = ''
    missing.value = 'exclude'
    // A single offering needs no choosing; otherwise honour the host's pick.
    const only = props.offerings.length === 1 ? props.offerings[0].offeringId : null
    offeringId.value = props.defaultOfferingId ?? only
    // The fetch is left to the watcher below, which sees `open` flip in the
    // same tick as these resets — fetching here as well would double it.
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

watch([() => props.open, offeringId, category, dateFrom, dateTo, missing], () => {
  if (props.open) loadHeatmap()
})
</script>
