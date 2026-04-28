<template>
  <FullScreenLayout>
    <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div class="flex flex-col justify-center w-full h-screen dark:bg-gray-900">
        <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <div class="mb-5 sm:mb-8">
              <h1
                class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md"
              >
                {{ $t('auth.forgotPasswordTitle') }}
              </h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t('auth.forgotPasswordDescription') }}
              </p>
            </div>
            <div>
              <form @submit.prevent="handleSubmit">
                <div class="space-y-5">
                  <div
                    v-if="error"
                    class="rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
                  >
                    {{ error }}
                  </div>
                  <div>
                    <label
                      for="username"
                      class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                    >
                      {{ $t('auth.email') }}<span class="text-error-500">*</span>
                    </label>
                    <input
                      v-model="username"
                      type="email"
                      id="username"
                      :placeholder="$t('auth.emailPlaceholder')"
                      class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      :disabled="isLoading"
                      class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        v-if="isLoading"
                        class="mr-2 h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {{ isLoading ? $t('common.loading') : $t('auth.sendCode') }}
                    </button>
                  </div>
                  <div class="text-center">
                    <router-link
                      to="/signin"
                      class="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      {{ $t('auth.backToSignIn') }}
                    </router-link>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import { forgetPasswordApi } from '@/api/auth'
import axios from 'axios'

const router = useRouter()
const { t } = useI18n()

const username = ref('')
const error = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  error.value = ''
  if (!username.value) {
    error.value = t('auth.fillAllFields')
    return
  }
  isLoading.value = true
  try {
    const { data } = await forgetPasswordApi(username.value)
    router.push({
      name: 'VerifyCode',
      query: {
        username: data.username,
        signed_code: data.signed_code,
      },
    })
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      error.value = err.response.data.detail
    } else {
      error.value = t('auth.serverError')
    }
  } finally {
    isLoading.value = false
  }
}
</script>
