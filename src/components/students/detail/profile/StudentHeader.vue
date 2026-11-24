<template>
  <div
    v-if="loading || !student"
    class="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
    role="status"
    :aria-label="t('common.loading')"
  >
    <div class="h-14 w-14 shrink-0 animate-pulse rounded-full bg-gray-100 dark:bg-white/5"></div>
    <div class="flex-1 space-y-2">
      <div class="h-5 w-48 animate-pulse rounded bg-gray-100 dark:bg-white/5"></div>
      <div class="h-3.5 w-64 max-w-full animate-pulse rounded bg-gray-100 dark:bg-white/5"></div>
    </div>
  </div>

  <div
    v-else
    class="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
  >
    <img
      v-if="student.user.avatar"
      :src="student.user.avatar"
      :alt="fullName"
      class="h-14 w-14 shrink-0 rounded-full object-cover"
    />
    <div
      v-else
      class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-50 text-theme-xl font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
      aria-hidden="true"
    >
      {{ initials }}
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 class="truncate text-theme-xl font-semibold text-gray-800 dark:text-white/90">{{ fullName }}</h1>
        <span
          v-if="student.current_class_group"
          class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-theme-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300"
        >
          <GraduationCap class="h-3 w-3" aria-hidden="true" />
          {{ student.current_class_group.display_name }}
        </span>
        <span v-if="schoolGroup" class="inline-flex items-center gap-1.5 text-theme-xs font-medium text-gray-600 dark:text-gray-400">
          <img
            v-if="schoolGroup.avatar"
            :src="schoolGroup.avatar"
            :alt="schoolGroup.name"
            class="h-6 w-6 rounded-md object-cover"
          />
          {{ schoolGroup.name }}
        </span>
      </div>
      <p class="mt-0.5 truncate text-theme-sm text-gray-500 dark:text-gray-400">{{ student.user.email }}</p>
    </div>

    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { GraduationCap } from 'lucide-vue-next'
import { getSchoolGroupApi, type SchoolGroup } from '@/api/auth'
import type { StudentDetail } from '@/types/student'

/**
 * One identity row: who this is, which class and house, and the page's actions
 * (the parent fills the `actions` slot). The school-house logo is decorative,
 * so a failed fetch just hides it.
 */
const props = defineProps<{
  student: Pick<StudentDetail, 'user' | 'current_class_group' | 'school_group'> | null
  loading?: boolean
}>()

const { t } = useI18n()

const fullName = computed(() =>
  props.student ? `${props.student.user.last_name} ${props.student.user.first_name}`.trim() : '',
)
const initials = computed(() => {
  const u = props.student?.user
  return ((u?.last_name?.[0] || '') + (u?.first_name?.[0] || '')).toUpperCase()
})

const schoolGroup = ref<SchoolGroup | null>(null)

watch(
  () => props.student?.school_group,
  async (id, _old, onCleanup) => {
    schoolGroup.value = null
    if (id == null) return
    let stale = false
    onCleanup(() => { stale = true })
    try {
      const { data } = await getSchoolGroupApi(id)
      if (!stale) schoolGroup.value = data
    } catch (err) {
      console.warn('School group failed to load', err)
    }
  },
  { immediate: true },
)
</script>
