<template>
  <ThemeProvider>
    <SidebarProvider>
      <RouterView v-if="!isSessionLoading" />
    </SidebarProvider>
  </ThemeProvider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import ThemeProvider from './components/layout/ThemeProvider.vue'
import SidebarProvider from './components/layout/SidebarProvider.vue'
import { useAuth } from './composables/useAuth'

const { isSessionLoading, initSession } = useAuth()

onMounted(() => {
  initSession()
})
</script>
