<template>
  <!-- Teleported so no page ancestor can trap it under the sticky header. -->
  <Teleport to="body">
    <div class="fixed inset-0 flex items-start justify-center overflow-y-auto overscroll-contain py-4 sm:items-center z-[100000]">
      <div
        v-if="fullScreenBackdrop"
        class="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]"
        aria-hidden="true"
        @click="$emit('close')"
      ></div>
      <slot name="body"></slot>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface ModalProps {
  fullScreenBackdrop?: boolean
}

defineProps<ModalProps>()
defineEmits(['close'])
</script>
