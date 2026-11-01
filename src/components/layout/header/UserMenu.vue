<template>
  <div class="relative" ref="dropdownRef">
    <button
      type="button"
      class="flex min-h-11 items-center gap-2 rounded-lg p-1 pr-2 text-gray-700 transition hover:bg-gray-100 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:text-gray-400 dark:hover:bg-white/5"
      :aria-expanded="dropdownOpen"
      aria-haspopup="menu"
      @click.prevent="toggleDropdown"
    >
      <span class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 dark:bg-brand-500/20 sm:h-11 sm:w-11">
        <img v-if="user?.avatar" :src="user.avatar" alt="User" class="h-full w-full object-cover" />
        <span v-else class="text-sm font-semibold text-brand-600 dark:text-brand-400">
          {{ (displayName || '?').charAt(0).toUpperCase() }}
        </span>
      </span>

      <ChevronDownIcon class="h-4 w-4 shrink-0 transition-transform" :class="{ 'rotate-180': dropdownOpen }" />
    </button>

    <!-- Dropdown Start -->
    <div
      v-if="dropdownOpen"
      class="absolute right-0 top-full z-50 mt-2 flex max-h-[calc(100dvh-8rem)] w-[calc(100vw-2rem)] max-w-[19rem] origin-top-right flex-col overflow-y-auto overscroll-contain rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-72"
      role="menu"
    >
      <div>
        <span class="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
          {{ displayName }}
        </span>
        <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
          {{ user?.email ?? '' }}
        </span>
      </div>

      <div
        v-if="availableRoles.length > 1"
        class="mt-3 border-t border-gray-200 pt-3 dark:border-gray-800"
      >
        <span class="mb-1.5 block text-theme-xs font-medium uppercase tracking-wide text-gray-400">
          {{ t('auth.enterAs') }}
        </span>
        <SelectMenu
          :model-value="activeRole"
          :options="roleOptions"
          :aria-label="t('auth.enterAs')"
          trigger-class="flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 text-left text-sm font-medium text-gray-800 shadow-theme-xs transition focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          @update:model-value="handleRoleChange"
        />
      </div>

      <ul class="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <li v-for="item in menuItems" :key="item.href">
          <router-link
            :to="item.href"
            class="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            <!-- SVG icon would go here -->
            <component
              :is="item.icon"
              class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
            />
            {{ item.text }}
          </router-link>
        </li>
      </ul>
      <button
        @click="signOut"
        class="flex w-full items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
      >
        <LogoutIcon
          class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        />
        {{ $t('auth.signOut') }}
      </button>
    </div>
    <!-- Dropdown End -->
  </div>
</template>

<script setup lang="ts">
import { UserCircleIcon, ChevronDownIcon, LogoutIcon, SettingsIcon } from '@/icons'
import { useRouter } from 'vue-router'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import { getRoleHome, roleLabelKeys } from '@/utils/roles'
import type { SelectableUserRole } from '@/types/auth'

const router = useRouter()
const { t } = useI18n()
const { user, availableRoles, activeRole, setActiveRole, logout } = useAuth()

const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const displayName = computed(() =>
  [user.value?.first_name, user.value?.last_name].filter(Boolean).join(' ') || user.value?.username || '',
)
const roleOptions = computed<SelectOption[]>(() =>
  availableRoles.value.map(role => ({ value: role, label: t(roleLabelKeys[role]) })),
)

const menuItems = [
  { href: '/profile', icon: UserCircleIcon, text: 'Edit profile' },
  { href: '/profile', icon: SettingsIcon, text: 'Account settings' },
]

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const selectRole = async (role: SelectableUserRole) => {
  if (role === activeRole.value) {
    closeDropdown()
    return
  }
  if (!setActiveRole(role)) return
  closeDropdown()
  await router.push(getRoleHome(role))
}

const handleRoleChange = (value: number | string | null) => {
  if (typeof value !== 'string') return
  void selectRole(value as SelectableUserRole)
}

const signOut = async () => {
  await logout()
  closeDropdown()
  router.push('/signin')
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && event.target instanceof Node && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
