<template>
  <Transition name="slide-down">
    <div
      v-if="!isOnline"
      class="fixed inset-x-0 top-0 z-[100] bg-warning-500 px-4 py-2 text-center text-sm font-medium text-white"
    >
      {{ $t('common.offlineMessage') }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useOnlineStatus } from '@/composables/useOnlineStatus'

const { isOnline } = useOnlineStatus()
</script>

<style scoped>
.slide-down-enter-active {
  transition: all 0.3s ease-out;
}
.slide-down-leave-active {
  transition: all 0.2s ease-in;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
