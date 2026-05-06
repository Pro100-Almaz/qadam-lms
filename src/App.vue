<template>
  <ThemeProvider>
    <SidebarProvider>
      <RouterView v-if="!isSessionLoading" />
    </SidebarProvider>
    <ToastContainer />
    <OfflineBanner />
  </ThemeProvider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import ThemeProvider from './components/layout/ThemeProvider.vue'
import SidebarProvider from './components/layout/SidebarProvider.vue'
import ToastContainer from './components/ui/ToastContainer.vue'
import OfflineBanner from './components/ui/OfflineBanner.vue'
import { useAuth } from './composables/useAuth'

const { isSessionLoading, initSession } = useAuth()

onMounted(() => {
  initSession()
})
</script>
