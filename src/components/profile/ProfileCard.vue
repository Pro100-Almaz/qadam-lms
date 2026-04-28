<template>
  <div>
    <div class="p-5 mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div
            class="relative w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 group cursor-pointer"
            @click="triggerFileInput"
          >
            <img
              :src="user?.avatar || '/images/user/owner.jpg'"
              :alt="fullName"
              class="w-full h-full object-cover"
            />
            <div
              class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg
                v-if="!isUploading"
                class="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <svg
                v-else
                class="w-6 h-6 text-white animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileChange"
            />
          </div>
          <div class="order-3 xl:order-2">
            <h4
              class="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left"
            >
              {{ fullName }}
            </h4>
            <div
              class="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left"
            >
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ user?.role_display }}
              </p>
              <div
                v-if="user?.email"
                class="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"
              ></div>
              <p v-if="user?.email" class="text-sm text-gray-500 dark:text-gray-400">
                {{ user.email }}
              </p>
            </div>
            <p
              v-if="avatarError"
              class="mt-2 text-sm text-error-500"
            >
              {{ avatarError }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'

const { t } = useI18n()
const { user, uploadAvatar } = useAuth()

const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const avatarError = ref('')

const fullName = computed(() => {
  if (!user.value) return ''
  return `${user.value.last_name} ${user.value.first_name}`.trim()
})

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  input.value = ''
  avatarError.value = ''
  isUploading.value = true
  try {
    const result = await uploadAvatar(file)
    if (!result.success && result.errors?.avatar) {
      avatarError.value = result.errors.avatar[0]
    }
  } catch {
    avatarError.value = t('auth.serverError')
  } finally {
    isUploading.value = false
  }
}
</script>
