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
import ThemeProvider from './components/layout/ThemeProvider.vue'
import SidebarProvider from './components/layout/SidebarProvider.vue'
import ToastContainer from './components/ui/ToastContainer.vue'
import OfflineBanner from './components/ui/OfflineBanner.vue'
import { useAuth } from './composables/useAuth'

// Session bootstrap is driven entirely by the router's beforeEach guard, which
// awaits initSession() before resolving the first navigation. Triggering it
// here too would race against the guard and double-spend the rotated refresh
// token under Simple JWT's blacklist-on-rotate policy.
const { isSessionLoading } = useAuth()
</script>
