<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {{ t('auth.registerUser') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ t('auth.registerUserSubtitle') }}
        </p>
      </div>

      <!-- Success Banner -->
      <div
        v-if="successMessage"
        class="flex items-start gap-3 rounded-xl border border-success-300 bg-success-50 px-4 py-3.5 dark:border-success-500/30 dark:bg-success-500/10"
      >
        <CheckCircle class="mt-0.5 h-5 w-5 shrink-0 text-success-500 dark:text-success-400" />
        <div class="flex-1">
          <p class="text-sm font-medium text-success-700 dark:text-success-400">{{ successMessage }}</p>
        </div>
        <button @click="successMessage = ''" class="text-success-500 hover:text-success-600 dark:text-success-400">
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Global Error Banner -->
      <div
        v-if="globalError"
        class="flex items-start gap-3 rounded-xl border border-error-300 bg-error-50 px-4 py-3.5 dark:border-error-500/30 dark:bg-error-500/10"
      >
        <AlertCircle class="mt-0.5 h-5 w-5 shrink-0 text-error-500 dark:text-error-400" />
        <p class="text-sm text-error-600 dark:text-error-400">{{ globalError }}</p>
      </div>

      <form @submit.prevent="handleSubmit" novalidate>
        <div class="space-y-6">

          <!-- ── Section 1: Basic Information ── -->
          <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
            <div class="mb-5 flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
                <User class="h-4 w-4 text-brand-500" />
              </div>
              <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">
                {{ t('auth.basicInformation') }}
              </h2>
            </div>

            <div class="space-y-5">
              <!-- First Name + Last Name -->
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ t('auth.firstName') }}<span class="text-error-500">*</span>
                  </label>
                  <input
                    v-model="form.first_name"
                    type="text"
                    :placeholder="t('auth.firstNamePlaceholder')"
                    :class="inputClass('first_name')"
                    class="h-11 w-full rounded-lg border bg-white px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  />
                  <FieldError :errors="fieldErrors.first_name" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ t('auth.lastName') }}<span class="text-error-500">*</span>
                  </label>
                  <input
                    v-model="form.last_name"
                    type="text"
                    :placeholder="t('auth.lastNamePlaceholder')"
                    :class="inputClass('last_name')"
                    class="h-11 w-full rounded-lg border bg-white px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  />
                  <FieldError :errors="fieldErrors.last_name" />
                </div>
              </div>

              <!-- Email -->
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('auth.email') }}<span class="text-error-500">*</span>
                </label>
                <div class="relative">
                  <Mail class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    v-model="form.email"
                    type="email"
                    :placeholder="t('auth.emailPlaceholder')"
                    :class="inputClass('email')"
                    class="h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  />
                </div>
                <FieldError :errors="fieldErrors.email" />
              </div>

              <!-- Password + Confirm Password -->
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ t('auth.password') }}<span class="text-error-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      v-model="form.password1"
                      :type="showPassword1 ? 'text' : 'password'"
                      :placeholder="t('auth.passwordPlaceholder')"
                      :class="inputClass('password1')"
                      class="h-11 w-full rounded-lg border bg-white py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                    />
                    <button
                      type="button"
                      @click="showPassword1 = !showPassword1"
                      class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      <Eye v-if="!showPassword1" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </button>
                  </div>
                  <FieldError :errors="fieldErrors.password1" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ t('auth.confirmPassword') }}<span class="text-error-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      v-model="form.password2"
                      :type="showPassword2 ? 'text' : 'password'"
                      :placeholder="t('auth.confirmPasswordPlaceholder')"
                      :class="inputClass('password2')"
                      class="h-11 w-full rounded-lg border bg-white py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                    />
                    <button
                      type="button"
                      @click="showPassword2 = !showPassword2"
                      class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      <Eye v-if="!showPassword2" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </button>
                  </div>
                  <FieldError :errors="fieldErrors.password2" />
                </div>
              </div>

              <!-- Avatar Upload -->
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('auth.avatar') }}
                </label>
                <div class="flex items-center gap-4">
                  <!-- Preview -->
                  <div class="relative h-16 w-16 shrink-0">
                    <div
                      v-if="avatarPreview"
                      class="h-16 w-16 overflow-hidden rounded-full border-2 border-brand-200 dark:border-brand-500/30"
                    >
                      <img :src="avatarPreview" alt="Avatar preview" class="h-full w-full object-cover" />
                    </div>
                    <div
                      v-else
                      class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <ImageIcon class="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <button
                      v-if="avatarPreview"
                      type="button"
                      @click="removeAvatar"
                      class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-white shadow-sm hover:bg-error-600"
                    >
                      <X class="h-3 w-3" />
                    </button>
                  </div>
                  <!-- File input trigger -->
                  <div class="flex flex-col gap-1.5">
                    <button
                      type="button"
                      @click="avatarInputRef?.click()"
                      class="flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      <Upload class="h-4 w-4" />
                      {{ t('auth.uploadAvatar') }}
                    </button>
                    <p class="text-xs text-gray-400 dark:text-gray-500">{{ t('auth.avatarHint') }}</p>
                  </div>
                  <input
                    ref="avatarInputRef"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="onAvatarChange"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- ── Section 2: Role Selection ── -->
          <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
            <div class="mb-5 flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
                <Shield class="h-4 w-4 text-brand-500" />
              </div>
              <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">
                {{ t('auth.roleSelection') }}
              </h2>
            </div>

            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              <button
                v-for="role in roles"
                :key="role.value"
                type="button"
                @click="selectRole(role.value)"
                :class="[
                  'flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-center transition-all',
                  form.role === role.value
                    ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/10'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-white/5',
                ]"
              >
                <div
                  :class="[
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    form.role === role.value
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
                  ]"
                >
                  <component :is="role.icon" class="h-5 w-5" />
                </div>
                <span
                  :class="[
                    'text-xs font-medium leading-tight',
                    form.role === role.value
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-gray-600 dark:text-gray-400',
                  ]"
                >
                  {{ role.label }}
                </span>
              </button>
            </div>
            <FieldError :errors="fieldErrors.role" class="mt-2" />
          </div>

          <!-- ── Section 3: Role-Specific Fields ── -->
          <Transition name="fade-slide">
            <div
              v-if="showTeacherFields || showStudentFields || showParentFields"
              class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6"
            >
              <div class="mb-5 flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10">
                  <Settings class="h-4 w-4 text-amber-500" />
                </div>
                <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">
                  {{ t('auth.roleSpecificFields') }}
                </h2>
              </div>

              <!-- Teacher / HomeroomTeacher fields -->
              <div v-if="showTeacherFields" class="space-y-5">
                <!-- Gender -->
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ t('auth.gender') }}
                  </label>
                  <div class="flex gap-4">
                    <label
                      v-for="g in genderOptions"
                      :key="g.value"
                      :class="[
                        'flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm transition-all',
                        form.gender === g.value
                          ? 'border-brand-500 bg-brand-50 text-brand-600 dark:border-brand-500 dark:bg-brand-500/10 dark:text-brand-400'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600',
                      ]"
                    >
                      <input
                        v-model="form.gender"
                        type="radio"
                        :value="g.value"
                        class="sr-only"
                      />
                      <component :is="g.icon" class="h-4 w-4" />
                      {{ g.label }}
                    </label>
                  </div>
                  <FieldError :errors="fieldErrors.gender" />
                </div>

                <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <!-- Academic Degree -->
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      {{ t('auth.academicDegree') }}
                    </label>
                    <input
                      v-model="form.academic_degree"
                      type="text"
                      :placeholder="t('auth.academicDegreePlaceholder')"
                      :class="inputClass('academic_degree')"
                      class="h-11 w-full rounded-lg border bg-white px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                    />
                    <FieldError :errors="fieldErrors.academic_degree" />
                  </div>

                  <!-- Employment Type -->
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      {{ t('auth.employmentType') }}
                    </label>
                    <select
                      v-model="form.employment_type"
                      :class="inputClass('employment_type')"
                      class="h-11 w-full appearance-none rounded-lg border bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90"
                    >
                      <option value="">{{ t('common.selectOption') }}</option>
                      <option value="full_time">{{ t('auth.fullTime') }}</option>
                      <option value="part_time">{{ t('auth.partTime') }}</option>
                    </select>
                    <FieldError :errors="fieldErrors.employment_type" />
                  </div>
                </div>

                <!-- Occupation -->
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ t('auth.occupation') }}
                  </label>
                  <input
                    v-model="form.occupation"
                    type="text"
                    :placeholder="t('auth.occupationPlaceholder')"
                    :class="inputClass('occupation')"
                    class="h-11 w-full rounded-lg border bg-white px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  />
                  <FieldError :errors="fieldErrors.occupation" />
                </div>
              </div>

              <!-- Student fields -->
              <div v-if="showStudentFields" class="space-y-5">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ t('auth.schoolGroup') }}
                  </label>
                  <div v-if="loadingGroups" class="flex h-11 items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                    <Loader2 class="h-4 w-4 animate-spin" />
                    {{ t('common.loading') }}
                  </div>
                  <select
                    v-else
                    v-model="form.school_group"
                    :class="inputClass('school_group')"
                    class="h-11 w-full appearance-none rounded-lg border bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90"
                  >
                    <option :value="undefined">{{ t('auth.selectSchoolGroup') }}</option>
                    <option
                      v-for="group in schoolGroups"
                      :key="group.id"
                      :value="group.id"
                    >
                      {{ group.name }}
                    </option>
                  </select>
                  <FieldError :errors="fieldErrors.school_group" />
                </div>
              </div>

              <!-- Parent fields -->
              <div v-if="showParentFields" class="space-y-5">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ t('auth.studentId') }}
                  </label>
                  <div class="relative">
                    <Link class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      v-model.number="form.student_id"
                      type="number"
                      min="1"
                      :placeholder="t('auth.studentIdPlaceholder')"
                      :class="inputClass('student_id')"
                      class="h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                    />
                  </div>
                  <FieldError :errors="fieldErrors.student_id" />
                  <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ t('auth.studentIdHint') }}</p>
                </div>
              </div>
            </div>
          </Transition>

          <!-- ── Section 4: Optional Information ── -->
          <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
            <div class="mb-5 flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <Info class="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">
                  {{ t('auth.optionalInformation') }}
                </h2>
                <p class="text-xs text-gray-400 dark:text-gray-500">{{ t('auth.optionalInformationHint') }}</p>
              </div>
            </div>

            <div class="space-y-5">
              <!-- Phone + Date of Birth -->
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ t('auth.phoneNumber') }}
                  </label>
                  <div class="relative">
                    <Phone class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      v-model="form.phone_number"
                      type="tel"
                      :placeholder="t('auth.phoneNumberPlaceholder')"
                      :class="inputClass('phone_number')"
                      class="h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                    />
                  </div>
                  <FieldError :errors="fieldErrors.phone_number" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {{ t('auth.dateOfBirth') }}
                  </label>
                  <div class="relative">
                    <Calendar class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      v-model="form.date_of_birth"
                      type="date"
                      :class="inputClass('date_of_birth')"
                      class="h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm text-gray-800 shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90"
                    />
                  </div>
                  <FieldError :errors="fieldErrors.date_of_birth" />
                </div>
              </div>

              <!-- School -->
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('auth.school') }}
                </label>
                <div class="relative">
                  <Building class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    v-model="form.school"
                    type="text"
                    :placeholder="t('auth.schoolPlaceholder')"
                    :class="inputClass('school')"
                    class="h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  />
                </div>
                <FieldError :errors="fieldErrors.school" />
              </div>

              <!-- Address -->
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('auth.address') }}
                </label>
                <div class="relative">
                  <MapPin class="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <textarea
                    v-model="form.address"
                    rows="3"
                    :placeholder="t('auth.addressPlaceholder')"
                    :class="inputClass('address')"
                    class="w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  />
                </div>
                <FieldError :errors="fieldErrors.address" />
              </div>
            </div>
          </div>

          <!-- ── Submit / Cancel ── -->
          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              @click="resetForm"
              :disabled="isLoading"
              class="flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-6 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
            >
              {{ t('common.reset') }}
            </button>
            <button
              type="submit"
              :disabled="isLoading"
              class="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-8 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
              <UserPlus v-else class="h-4 w-4" />
              {{ isLoading ? t('common.loading') : t('auth.registerUser') }}
            </button>
          </div>

        </div>
      </form>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, defineComponent, h } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  User,
  Mail,
  Eye,
  EyeOff,
  Shield,
  Settings,
  Info,
  Phone,
  Calendar,
  Building,
  MapPin,
  Upload,
  ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserPlus,
  Link,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Users,
  UserCog,
  Briefcase,
  Heart,
  UserCircle,
  VenetianMask,
} from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { registerUserApi, getSchoolGroupsApi } from '@/api/auth'
import type { RegisterRole, SchoolGroup } from '@/api/auth'

// ── Inline FieldError component ─────────────────────────────────────────────
const FieldError = defineComponent({
  props: { errors: { type: Array as () => string[] | undefined, default: undefined } },
  setup(props) {
    return () =>
      props.errors?.length
        ? h('p', { class: 'mt-1.5 text-sm text-error-500' }, props.errors[0])
        : null
  },
})

const { t } = useI18n()
const router = useRouter()

// ── State ────────────────────────────────────────────────────────────────────
const isLoading = ref(false)
const successMessage = ref('')
const globalError = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

const showPassword1 = ref(false)
const showPassword2 = ref(false)

const avatarInputRef = ref<HTMLInputElement | null>(null)
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)

const schoolGroups = ref<SchoolGroup[]>([])
const loadingGroups = ref(false)

// ── Form state ────────────────────────────────────────────────────────────────
const initialForm = () => ({
  first_name: '',
  last_name: '',
  email: '',
  password1: '',
  password2: '',
  role: '' as RegisterRole | '',
  school: '',
  phone_number: '',
  date_of_birth: '',
  address: '',
  gender: '' as 'M' | 'F' | '',
  academic_degree: '',
  employment_type: '',
  occupation: '',
  school_group: undefined as number | undefined,
  student_id: undefined as number | undefined,
})

const form = ref(initialForm())

// ── Role definitions ─────────────────────────────────────────────────────────
const roles = computed(() => [
  { value: 'Admin' as RegisterRole, label: t('auth.roles.admin'), icon: ShieldCheck },
  { value: 'Teacher' as RegisterRole, label: t('auth.roles.teacher'), icon: GraduationCap },
  { value: 'HomeroomTeacher' as RegisterRole, label: t('auth.roles.homeroomTeacher'), icon: BookOpen },
  { value: 'Student' as RegisterRole, label: t('auth.roles.student'), icon: Users },
  { value: 'Supervisor' as RegisterRole, label: t('auth.roles.supervisor'), icon: UserCog },
  { value: 'Principal' as RegisterRole, label: t('auth.roles.principal'), icon: Briefcase },
  { value: 'Parent' as RegisterRole, label: t('auth.roles.parent'), icon: Heart },
])

const genderOptions = computed(() => [
  { value: 'M' as const, label: t('auth.male'), icon: User },
  { value: 'F' as const, label: t('auth.female'), icon: UserCircle },
])

// ── Computed visibility ───────────────────────────────────────────────────────
const showTeacherFields = computed(
  () => form.value.role === 'Teacher' || form.value.role === 'HomeroomTeacher',
)
const showStudentFields = computed(() => form.value.role === 'Student')
const showParentFields = computed(() => form.value.role === 'Parent')

// ── Watchers ──────────────────────────────────────────────────────────────────
watch(
  () => form.value.role,
  () => {
    // Clear role-specific fields when role changes
    form.value.gender = ''
    form.value.academic_degree = ''
    form.value.employment_type = ''
    form.value.occupation = ''
    form.value.school_group = undefined
    form.value.student_id = undefined
    fieldErrors.value = {}
  },
)

watch(showStudentFields, async (val) => {
  if (val && schoolGroups.value.length === 0) {
    await fetchSchoolGroups()
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function inputClass(field: string): string {
  return fieldErrors.value[field]?.length
    ? 'border-error-500 dark:border-error-500 focus:border-error-500 dark:focus:border-error-500'
    : 'border-gray-300 dark:border-gray-700 focus:border-brand-300 dark:focus:border-brand-800'
}

function selectRole(value: RegisterRole) {
  form.value.role = value
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => {
    avatarPreview.value = ev.target?.result as string
  }
  reader.readAsDataURL(file)
}

function removeAvatar() {
  avatarFile.value = null
  avatarPreview.value = null
  if (avatarInputRef.value) avatarInputRef.value.value = ''
}

// ── School groups ─────────────────────────────────────────────────────────────
async function fetchSchoolGroups() {
  loadingGroups.value = true
  try {
    const { data } = await getSchoolGroupsApi()
    schoolGroups.value = data
  } catch {
    schoolGroups.value = []
  } finally {
    loadingGroups.value = false
  }
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateForm(): boolean {
  const errors: Record<string, string[]> = {}

  if (!form.value.first_name.trim())
    errors.first_name = [t('validation.required')]
  if (!form.value.last_name.trim())
    errors.last_name = [t('validation.required')]
  if (!form.value.email.trim()) {
    errors.email = [t('validation.required')]
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.email = [t('validation.invalidEmail')]
  }
  if (!form.value.password1)
    errors.password1 = [t('validation.required')]
  if (!form.value.password2) {
    errors.password2 = [t('validation.required')]
  } else if (form.value.password1 !== form.value.password2) {
    errors.password2 = [t('validation.passwordMismatch')]
  }
  if (!form.value.role)
    errors.role = [t('validation.required')]

  fieldErrors.value = errors
  return Object.keys(errors).length === 0
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function handleSubmit() {
  globalError.value = ''
  successMessage.value = ''

  if (!validateForm()) return

  isLoading.value = true
  try {
    await registerUserApi({
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      email: form.value.email,
      password1: form.value.password1,
      password2: form.value.password2,
      role: form.value.role as RegisterRole,
      ...(form.value.school && { school: form.value.school }),
      ...(form.value.phone_number && { phone_number: form.value.phone_number }),
      ...(form.value.date_of_birth && { date_of_birth: form.value.date_of_birth }),
      ...(form.value.address && { address: form.value.address }),
      ...(avatarFile.value && { avatar: avatarFile.value }),
      ...(showTeacherFields.value && form.value.gender && { gender: form.value.gender as 'M' | 'F' }),
      ...(showTeacherFields.value && form.value.academic_degree && { academic_degree: form.value.academic_degree }),
      ...(showTeacherFields.value && form.value.employment_type && { employment_type: form.value.employment_type }),
      ...(showTeacherFields.value && form.value.occupation && { occupation: form.value.occupation }),
      ...(showStudentFields.value && form.value.school_group != null && { school_group: form.value.school_group }),
      ...(showParentFields.value && form.value.student_id != null && { student_id: form.value.student_id }),
    })

    successMessage.value = t('auth.registerSuccess', {
      name: `${form.value.first_name} ${form.value.last_name}`,
    })

    // Redirect to appropriate list page after short delay
    const redirectMap: Partial<Record<RegisterRole, string>> = {
      Teacher: '/teachers',
      HomeroomTeacher: '/teachers',
      Student: '/students',
    }
    const redirect = redirectMap[form.value.role as RegisterRole]

    resetForm()

    if (redirect) {
      setTimeout(() => router.push(redirect), 1500)
    }
  } catch (err: any) {
    const data = err?.response?.data
    if (data && typeof data === 'object' && !data.detail) {
      // Field-level errors from API
      const apiErrors: Record<string, string[]> = {}
      for (const [key, val] of Object.entries(data)) {
        apiErrors[key] = Array.isArray(val) ? (val as string[]) : [String(val)]
      }
      fieldErrors.value = apiErrors
      globalError.value = t('auth.fixErrors')
    } else {
      globalError.value = data?.detail || t('auth.serverError')
    }
  } finally {
    isLoading.value = false
  }
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function resetForm() {
  form.value = initialForm()
  fieldErrors.value = {}
  globalError.value = ''
  removeAvatar()
}

onMounted(() => {
  // Pre-fetch school groups in background
  fetchSchoolGroups()
})
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
