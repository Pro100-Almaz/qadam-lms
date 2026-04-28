<template>
  <FullScreenLayout>
    <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div
        class="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900"
      >
        <div class="flex flex-col flex-1 w-full lg:w-1/2">
          <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div>
              <div class="mb-5 sm:mb-8">
                <h1
                  class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md"
                >
                  {{ $t('auth.signIn') }}
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ $t('auth.enterCredentials') }}
                </p>
              </div>
              <div>
                <form @submit.prevent="handleSubmit">
                  <div class="space-y-5">
                    <div
                      v-if="successMessage"
                      class="rounded-lg border border-success-300 bg-success-50 px-4 py-3 text-sm text-success-600 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400"
                    >
                      {{ successMessage }}
                    </div>
                    <div
                      v-if="error"
                      class="rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
                    >
                      {{ error }}
                    </div>
                    <!-- Username -->
                    <div>
                      <label
                        for="username"
                        class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                      >
                        {{ $t('auth.username') }}<span class="text-error-500">*</span>
                      </label>
                      <input
                        v-model="username"
                        type="text"
                        id="username"
                        name="username"
                        :placeholder="$t('auth.usernamePlaceholder')"
                        :class="fieldErrors.username ? 'border-error-500 dark:border-error-500' : 'border-gray-300 dark:border-gray-700 focus:border-brand-300 dark:focus:border-brand-800'"
                        class="dark:bg-dark-900 h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                      />
                      <p v-if="fieldErrors.username" class="mt-1.5 text-sm text-error-500">
                        {{ fieldErrors.username[0] }}
                      </p>
                    </div>
                    <!-- Password -->
                    <div>
                      <label
                        for="password"
                        class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                      >
                        {{ $t('auth.password') }}<span class="text-error-500">*</span>
                      </label>
                      <div class="relative">
                        <input
                          v-model="password"
                          :type="showPassword ? 'text' : 'password'"
                          id="password"
                          :placeholder="$t('auth.passwordPlaceholder')"
                          :class="fieldErrors.password ? 'border-error-500 dark:border-error-500' : 'border-gray-300 dark:border-gray-700 focus:border-brand-300 dark:focus:border-brand-800'"
                          class="dark:bg-dark-900 h-11 w-full rounded-lg border bg-transparent py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                        />
                        <span
                          @click="togglePasswordVisibility"
                          class="absolute z-30 text-gray-500 -translate-y-1/2 cursor-pointer right-4 top-1/2 dark:text-gray-400"
                        >
                          <svg
                            v-if="!showPassword"
                            class="fill-current"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M10.0002 13.8619C7.23361 13.8619 4.86803 12.1372 3.92328 9.70241C4.86804 7.26761 7.23361 5.54297 10.0002 5.54297C12.7667 5.54297 15.1323 7.26762 16.0771 9.70243C15.1323 12.1372 12.7667 13.8619 10.0002 13.8619ZM10.0002 4.04297C6.48191 4.04297 3.49489 6.30917 2.4155 9.4593C2.3615 9.61687 2.3615 9.78794 2.41549 9.94552C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C13.5184 15.3619 16.5055 13.0957 17.5849 9.94555C17.6389 9.78797 17.6389 9.6169 17.5849 9.45932C16.5055 6.30919 13.5184 4.04297 10.0002 4.04297ZM9.99151 7.84413C8.96527 7.84413 8.13333 8.67606 8.13333 9.70231C8.13333 10.7286 8.96527 11.5605 9.99151 11.5605H10.0064C11.0326 11.5605 11.8646 10.7286 11.8646 9.70231C11.8646 8.67606 11.0326 7.84413 10.0064 7.84413H9.99151Z"
                              fill="#98A2B3"
                            />
                          </svg>
                          <svg
                            v-else
                            class="fill-current"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M4.63803 3.57709C4.34513 3.2842 3.87026 3.2842 3.57737 3.57709C3.28447 3.86999 3.28447 4.34486 3.57737 4.63775L4.85323 5.91362C3.74609 6.84199 2.89363 8.06395 2.4155 9.45936C2.3615 9.61694 2.3615 9.78801 2.41549 9.94558C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C11.255 15.3619 12.4422 15.0737 13.4994 14.5598L15.3625 16.4229C15.6554 16.7158 16.1302 16.7158 16.4231 16.4229C16.716 16.13 16.716 15.6551 16.4231 15.3622L4.63803 3.57709ZM12.3608 13.4212L10.4475 11.5079C10.3061 11.5423 10.1584 11.5606 10.0064 11.5606H9.99151C8.96527 11.5606 8.13333 10.7286 8.13333 9.70237C8.13333 9.5461 8.15262 9.39434 8.18895 9.24933L5.91885 6.97923C5.03505 7.69015 4.34057 8.62704 3.92328 9.70247C4.86803 12.1373 7.23361 13.8619 10.0002 13.8619C10.8326 13.8619 11.6287 13.7058 12.3608 13.4212ZM16.0771 9.70249C15.7843 10.4569 15.3552 11.1432 14.8199 11.7311L15.8813 12.7925C16.6329 11.9813 17.2187 11.0143 17.5849 9.94561C17.6389 9.78803 17.6389 9.61696 17.5849 9.45938C16.5055 6.30925 13.5184 4.04303 10.0002 4.04303C9.13525 4.04303 8.30244 4.17999 7.52218 4.43338L8.75139 5.66259C9.1556 5.58413 9.57311 5.54303 10.0002 5.54303C12.7667 5.54303 15.1323 7.26768 16.0771 9.70249Z"
                              fill="#98A2B3"
                            />
                          </svg>
                        </span>
                      </div>
                      <p v-if="fieldErrors.password" class="mt-1.5 text-sm text-error-500">
                        {{ fieldErrors.password[0] }}
                      </p>
                    </div>
                    <!-- Checkbox -->
                    <div class="flex items-center justify-between">
                      <div>
                        <label
                          for="keepLoggedIn"
                          class="flex items-center text-sm font-normal text-gray-700 cursor-pointer select-none dark:text-gray-400"
                        >
                          <div class="relative">
                            <input
                              v-model="keepLoggedIn"
                              type="checkbox"
                              id="keepLoggedIn"
                              class="sr-only"
                            />
                            <div
                              :class="
                                keepLoggedIn
                                  ? 'border-brand-500 bg-brand-500'
                                  : 'bg-transparent border-gray-300 dark:border-gray-700'
                              "
                              class="mr-3 flex h-5 w-5 items-center justify-center rounded-md border-[1.25px]"
                            >
                              <span :class="keepLoggedIn ? '' : 'opacity-0'">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 14 14"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                                    stroke="white"
                                    stroke-width="1.94437"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  />
                                </svg>
                              </span>
                            </div>
                          </div>
                          {{ $t('auth.keepLoggedIn') }}
                        </label>
                      </div>
                      <router-link
                        to="/forgot-password"
                        class="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                        >{{ $t('auth.forgotPassword') }}</router-link
                      >
                    </div>
                    <!-- Button -->
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
                          <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                          />
                          <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        {{ isLoading ? $t('common.loading') : $t('auth.signIn') }}
                      </button>
                    </div>
                  </div>
                </form>
                <!-- <div class="mt-5">
                  <p
                    class="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start"
                  >
                    {{ $t('auth.noAccount') }}
                    <router-link
                      to="/signup"
                      class="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                      >{{ $t('auth.signUp') }}</router-link
                    >
                  </p>
                </div> -->
              </div>
            </div>
          </div>
        </div>
        <div
          class="relative items-center hidden w-full h-full overflow-hidden lg:w-1/2 bg-[#2a2a2a] lg:grid"
          @mousemove="onMouseMove"
        >
          <!-- Animated background shapes -->
          <div class="absolute inset-0">
            <div
              v-for="(shape, i) in shapes"
              :key="i"
              class="absolute rounded-full opacity-20 blur-sm"
              :style="{
                width: shape.size + 'px',
                height: shape.size + 'px',
                left: shape.x + '%',
                top: shape.y + '%',
                background: shape.gradient,
                animation: `float-${shape.direction} ${shape.duration}s ease-in-out infinite`,
                animationDelay: shape.delay + 's',
              }"
            />
            <!-- Connecting lines grid -->
            <svg class="absolute inset-0 w-full h-full opacity-10">
              <defs>
                <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#FF3D36" />
                  <stop offset="100%" stop-color="#EAE43D" />
                </linearGradient>
              </defs>
              <line
                v-for="(line, i) in gridLines"
                :key="'l' + i"
                :x1="line.x1"
                :y1="line.y1"
                :x2="line.x2"
                :y2="line.y2"
                stroke="url(#line-grad)"
                stroke-width="0.5"
                :style="{ animation: `pulse-line ${3 + i * 0.5}s ease-in-out infinite`, animationDelay: i * 0.3 + 's' }"
              />
            </svg>
          </div>

          <!-- Mouse-following glow -->
          <div
            class="absolute w-64 h-64 rounded-full pointer-events-none transition-all duration-500 ease-out"
            :style="{
              left: mouseX - 128 + 'px',
              top: mouseY - 128 + 'px',
              background: 'radial-gradient(circle, rgba(232,124,67,0.15) 0%, transparent 70%)',
            }"
          />

          <!-- Center content -->
          <div class="relative flex flex-col items-center z-10">
            <div class="relative mb-8">
              <!-- Glowing ring behind logo -->
              <div class="absolute -inset-6 rounded-full bg-gradient-to-r from-[#FF3D36]/20 to-[#EAE43D]/20 blur-xl animate-pulse" />
              <div class="relative bg-[#383838] rounded-2xl p-6 border border-white/10 shadow-2xl backdrop-blur-sm">
                <img width="160" height="96" src="/images/logo/logo-dark.svg" alt="Qadam School" />
              </div>
            </div>
            <h2 class="text-2xl font-bold text-white mb-2">
              {{ $t('app.school') }}
            </h2>
            <p class="text-sm text-gray-400 mb-6">
              Learning Management System
            </p>
            <!-- Animated feature pills -->
            <div class="flex flex-wrap justify-center gap-2 max-w-xs">
              <span
                v-for="(feature, i) in features"
                :key="i"
                class="px-3 py-1.5 text-xs font-medium text-white/70 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm"
                :style="{ animation: `fade-in-up 0.5s ease-out forwards`, animationDelay: 0.8 + i * 0.15 + 's', opacity: 0 }"
              >
                {{ feature }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { login } = useAuth()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const keepLoggedIn = ref(false)
const error = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
const isLoading = ref(false)
const successMessage = ref(route.query.reset === 'success' ? t('auth.passwordResetSuccess') : '')
const mouseX = ref(0)
const mouseY = ref(0)

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleSubmit = async () => {
  error.value = ''
  fieldErrors.value = {}
  if (!username.value || !password.value) {
    error.value = t('auth.fillAllFields')
    return
  }
  isLoading.value = true
  try {
    const result = await login(username.value, password.value)
    if (result.success) {
      router.push('/')
    } else if (result.errors) {
      fieldErrors.value = result.errors
    }
  } catch {
    error.value = t('auth.serverError')
  } finally {
    isLoading.value = false
  }
}

const onMouseMove = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  mouseX.value = e.clientX - rect.left
  mouseY.value = e.clientY - rect.top
}

const gradients = [
  'linear-gradient(135deg, #FF3D36, #E87C43)',
  'linear-gradient(135deg, #E87C43, #EAE43D)',
  'linear-gradient(135deg, #EAE43D, #eaac3f)',
  'linear-gradient(135deg, #FF3D36, #EAE43D)',
  'linear-gradient(135deg, #eaac3f, #E87C43)',
]

const shapes = Array.from({ length: 12 }, (_, i) => ({
  size: 40 + Math.random() * 120,
  x: Math.random() * 90,
  y: Math.random() * 90,
  gradient: gradients[i % gradients.length],
  duration: 6 + Math.random() * 8,
  delay: Math.random() * 4,
  direction: ['x', 'y', 'xy'][i % 3],
}))

const gridLines = Array.from({ length: 8 }, (_, i) => ({
  x1: `${10 + Math.random() * 80}%`,
  y1: `${10 + Math.random() * 80}%`,
  x2: `${10 + Math.random() * 80}%`,
  y2: `${10 + Math.random() * 80}%`,
}))

const features = computed(() => [
  t('nav.subjects'),
  t('nav.classes'),
  t('nav.lessons'),
  t('nav.teachers'),
  t('nav.students'),
  t('nav.academicYears'),
])
</script>

<style scoped>
@keyframes float-x {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  50% { transform: translateX(30px) rotate(180deg); }
}
@keyframes float-y {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(40px) rotate(180deg); }
}
@keyframes float-xy {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(20px, -20px) rotate(120deg); }
  66% { transform: translate(-15px, 25px) rotate(240deg); }
}
@keyframes pulse-line {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
