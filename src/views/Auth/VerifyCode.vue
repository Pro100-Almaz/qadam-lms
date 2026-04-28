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
                {{ $t('auth.verifyCodeTitle') }}
              </h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t('auth.verifyCodeDescription') }}
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
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      {{ $t('auth.verificationCode') }}
                    </label>
                    <div class="flex gap-3 justify-between">
                      <input
                        v-for="(_, index) in digits"
                        :key="index"
                        ref="digitRefs"
                        v-model="digits[index]"
                        type="text"
                        inputmode="numeric"
                        maxlength="1"
                        class="dark:bg-dark-900 h-13 w-13 rounded-lg border border-gray-300 bg-transparent text-center text-lg font-semibold text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        @input="onDigitInput(index)"
                        @keydown="onDigitKeydown($event, index)"
                        @paste="onPaste"
                      />
                    </div>
                  </div>
                  <div>
                    <button
                      type="submit"
                      :disabled="isLoading || code.length < 6"
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
                      {{ isLoading ? $t('common.loading') : $t('auth.verify') }}
                    </button>
                  </div>
                  <div class="text-center">
                    <router-link
                      to="/forgot-password"
                      class="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      {{ $t('auth.resendCode') }}
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import { verifyCodeApi } from '@/api/auth'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const username = computed(() => (route.query.username as string) || '')
const signedCode = computed(() => (route.query.signed_code as string) || '')

const digits = reactive(['', '', '', '', '', ''])
const digitRefs = ref<HTMLInputElement[]>([])
const error = ref('')
const isLoading = ref(false)

const code = computed(() => digits.join(''))

onMounted(() => {
  if (!username.value || !signedCode.value) {
    router.replace('/forgot-password')
    return
  }
  digitRefs.value[0]?.focus()
})

function onDigitInput(index: number) {
  digits[index] = digits[index].replace(/\D/g, '').slice(0, 1)
  if (digits[index] && index < 5) {
    digitRefs.value[index + 1]?.focus()
  }
}

function onDigitKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'Backspace' && !digits[index] && index > 0) {
    digitRefs.value[index - 1]?.focus()
  }
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault()
  const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
  for (let i = 0; i < 6; i++) {
    digits[i] = pasted[i] || ''
  }
  const focusIndex = Math.min(pasted.length, 5)
  digitRefs.value[focusIndex]?.focus()
}

const handleSubmit = async () => {
  error.value = ''
  if (code.value.length < 6) return
  isLoading.value = true
  try {
    const { data } = await verifyCodeApi(username.value, signedCode.value, code.value)
    router.push({
      name: 'ResetPassword',
      query: {
        username: data.username,
        signed_code: data.signed_code,
      },
    })
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 400) {
      error.value = err.response.data.detail
    } else {
      error.value = t('auth.serverError')
    }
  } finally {
    isLoading.value = false
  }
}
</script>
