<template>
  <div>
    <div class="p-5 mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            {{ $t('profile.personalInfo') }}
          </h4>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {{ $t('profile.firstName') }}
              </p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ user?.first_name || '—' }}
              </p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {{ $t('profile.lastName') }}
              </p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ user?.last_name || '—' }}
              </p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {{ $t('profile.email') }}
              </p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ user?.email || '—' }}
              </p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {{ $t('profile.phone') }}
              </p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ user?.phone_number || '—' }}
              </p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {{ $t('profile.dateOfBirth') }}
              </p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ user?.date_of_birth || '—' }}
              </p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {{ $t('profile.address') }}
              </p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ user?.address || '—' }}
              </p>
            </div>
          </div>
        </div>

        <button class="edit-button" @click="openModal">
          <svg
            class="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          {{ $t('common.edit') }}
        </button>
      </div>
    </div>

    <Modal v-if="isModalOpen" @close="closeModal">
      <template #body>
        <div
          class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11"
        >
          <button
            @click="closeModal"
            class="transition-color absolute right-5 top-5 z-999 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300"
          >
            <svg
              class="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z"
                fill=""
              />
            </svg>
          </button>
          <div class="px-2 pr-14">
            <h4 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {{ $t('profile.editPersonalInfo') }}
            </h4>
            <p class="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {{ $t('profile.editDescription') }}
            </p>
          </div>

          <div
            v-if="generalError"
            class="mx-2 mb-4 rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
          >
            {{ generalError }}
          </div>

          <form class="flex flex-col" @submit.prevent="saveProfile">
            <div class="custom-scrollbar overflow-y-auto p-2">
              <div class="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ $t('profile.firstName') }}
                  </label>
                  <input
                    v-model="form.first_name"
                    type="text"
                    :class="fieldErrors.first_name ? 'border-error-500 dark:border-error-500' : 'border-gray-300 dark:border-gray-700'"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <p v-if="fieldErrors.first_name" class="mt-1.5 text-sm text-error-500">
                    {{ fieldErrors.first_name[0] }}
                  </p>
                </div>

                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ $t('profile.lastName') }}
                  </label>
                  <input
                    v-model="form.last_name"
                    type="text"
                    :class="fieldErrors.last_name ? 'border-error-500 dark:border-error-500' : 'border-gray-300 dark:border-gray-700'"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <p v-if="fieldErrors.last_name" class="mt-1.5 text-sm text-error-500">
                    {{ fieldErrors.last_name[0] }}
                  </p>
                </div>

                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ $t('profile.email') }}
                  </label>
                  <input
                    v-model="form.email"
                    type="email"
                    :class="fieldErrors.email ? 'border-error-500 dark:border-error-500' : 'border-gray-300 dark:border-gray-700'"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <p v-if="fieldErrors.email" class="mt-1.5 text-sm text-error-500">
                    {{ fieldErrors.email[0] }}
                  </p>
                </div>

                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ $t('profile.phone') }}
                  </label>
                  <input
                    v-model="form.phone_number"
                    type="tel"
                    :class="fieldErrors.phone_number ? 'border-error-500 dark:border-error-500' : 'border-gray-300 dark:border-gray-700'"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <p v-if="fieldErrors.phone_number" class="mt-1.5 text-sm text-error-500">
                    {{ fieldErrors.phone_number[0] }}
                  </p>
                </div>

                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ $t('profile.dateOfBirth') }}
                  </label>
                  <input
                    v-model="form.date_of_birth"
                    type="date"
                    :class="fieldErrors.date_of_birth ? 'border-error-500 dark:border-error-500' : 'border-gray-300 dark:border-gray-700'"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <p v-if="fieldErrors.date_of_birth" class="mt-1.5 text-sm text-error-500">
                    {{ fieldErrors.date_of_birth[0] }}
                  </p>
                </div>

                <div class="col-span-2 lg:col-span-1">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ $t('profile.address') }}
                  </label>
                  <input
                    v-model="form.address"
                    type="text"
                    :class="fieldErrors.address ? 'border-error-500 dark:border-error-500' : 'border-gray-300 dark:border-gray-700'"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <p v-if="fieldErrors.address" class="mt-1.5 text-sm text-error-500">
                    {{ fieldErrors.address[0] }}
                  </p>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <button
                @click="closeModal"
                type="button"
                class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="isSaving"
                class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
              >
                {{ isSaving ? $t('common.loading') : $t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import Modal from './Modal.vue'

const { t } = useI18n()
const { user, updateProfile } = useAuth()

const isModalOpen = ref(false)
const isSaving = ref(false)
const fieldErrors = ref<Record<string, string[]>>({})
const generalError = ref('')

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  date_of_birth: '',
  address: '',
})

function openModal() {
  if (user.value) {
    form.first_name = user.value.first_name || ''
    form.last_name = user.value.last_name || ''
    form.email = user.value.email || ''
    form.phone_number = user.value.phone_number || ''
    form.date_of_birth = user.value.date_of_birth || ''
    form.address = user.value.address || ''
  }
  fieldErrors.value = {}
  generalError.value = ''
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

async function saveProfile() {
  fieldErrors.value = {}
  generalError.value = ''
  isSaving.value = true
  try {
    const result = await updateProfile({ ...form })
    if (result.success) {
      closeModal()
    } else if (result.errors) {
      fieldErrors.value = result.errors
    }
  } catch {
    generalError.value = t('auth.serverError')
  } finally {
    isSaving.value = false
  }
}
</script>
