<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
    >
      <GlobeIcon class="h-4 w-4" />
      <span>{{ currentLabel }}</span>
      <ChevronDownIcon
        class="h-4 w-4 transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>
    <div
      v-show="isOpen"
      class="absolute right-0 mt-2 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900"
    >
      <button
        v-for="loc in SUPPORTED_LOCALES"
        :key="loc.code"
        @click="switchLocale(loc.code)"
        class="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
        :class="{ 'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400': locale === loc.code }"
      >
        {{ loc.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Globe as GlobeIcon, ChevronDown as ChevronDownIcon } from 'lucide-vue-next'
import { SUPPORTED_LOCALES, setLocale, type Locale } from '@/i18n'

const { locale } = useI18n()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement>()

const currentLabel = computed(() => {
  return SUPPORTED_LOCALES.find((l) => l.code === locale.value)?.label ?? locale.value
})

function switchLocale(code: Locale) {
  setLocale(code)
  isOpen.value = false
}

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>
