# Qadam LMS — Frontend Implementation Spec

**Purpose:** Step-by-step implementation guide for a coding agent.
**Stack:** Vue 3.5 + TypeScript / Vite 6 / Tailwind CSS 4.0 / Vue Router 4.5 / Vue I18n 11
**Repo structure:** `src/` with `api/`, `components/`, `composables/`, `views/`, `types/`, `locales/`, `router/`

---

## Phase 1 — Critical Fixes

> **Do these first. Do not skip to later phases until Phase 1 is complete.**

### 1.1 Fix Token Storage (XSS Vulnerability)

**Problem:** Refresh token is stored in `localStorage`, which is readable by any JS running on the page — including XSS payloads. A single XSS vulnerability leaks all user sessions.

**Files to modify:**
- `src/composables/useAuth.ts`
- `src/api/client.ts`

**Implementation:**

1. Move the access token out of `localStorage` into an in-memory variable. It should survive only the current tab session:

   ```typescript
   // src/api/client.ts

   let accessToken: string | null = null

   export function setAccessToken(token: string | null) {
     accessToken = token
     if (token) {
       api.defaults.headers.common['Authorization'] = `Bearer ${token}`
     } else {
       delete api.defaults.headers.common['Authorization']
     }
   }

   export function getAccessToken(): string | null {
     return accessToken
   }
   ```

2. Move the refresh token to an `httpOnly` cookie. This requires a backend change — if the backend cannot set `httpOnly` cookies yet, use this interim approach:
   - Keep refresh token in `localStorage` (acceptable short-term since it's rotated and blacklisted)
   - Store access token **only** in memory (never in `localStorage`)
   - Add a comment `// TODO: migrate refresh token to httpOnly cookie when backend supports Set-Cookie`

3. Update `useAuth` composable:

   ```typescript
   // src/composables/useAuth.ts

   import { setAccessToken } from '@/api/client'

   // On login:
   async function login(username: string, password: string) {
     const response = await authApi.login({ username, password })
     setAccessToken(response.tokens.access)
     localStorage.setItem('refresh_token', response.tokens.refresh)
     // ... set user state
   }

   // On logout:
   function logout() {
     setAccessToken(null)
     localStorage.removeItem('refresh_token')
     // ... clear user state, redirect
   }

   // On app init (initSession):
   async function initSession() {
     const refreshToken = localStorage.getItem('refresh_token')
     if (!refreshToken) return

     try {
       const { access } = await authApi.refreshToken(refreshToken)
       setAccessToken(access)
       await fetchCurrentUser()
     } catch {
       logout()
     }
   }
   ```

4. Update the Axios 401 interceptor to use in-memory token:

   ```typescript
   // src/api/client.ts — interceptor

   api.interceptors.response.use(
     (response) => response,
     async (error) => {
       const originalRequest = error.config
       if (error.response?.status === 401 && !originalRequest._retry) {
         originalRequest._retry = true
         const refreshToken = localStorage.getItem('refresh_token')
         if (!refreshToken) {
           // No refresh token — force logout
           window.dispatchEvent(new Event('auth:logout'))
           return Promise.reject(error)
         }
         try {
           const { data } = await axios.post('/auth/token/refresh/', { refresh: refreshToken })
           setAccessToken(data.access)
           if (data.refresh) {
             localStorage.setItem('refresh_token', data.refresh)
           }
           originalRequest.headers['Authorization'] = `Bearer ${data.access}`
           return api(originalRequest)
         } catch {
           window.dispatchEvent(new Event('auth:logout'))
           return Promise.reject(error)
         }
       }
       return Promise.reject(error)
     }
   )
   ```

**Acceptance criteria:**
- Access token never appears in `localStorage` or `sessionStorage`.
- Refresh token is rotated on every refresh call.
- Opening DevTools > Application > Local Storage shows only `refresh_token`, `locale`, and UI preferences — no access token.
- Closing and reopening the tab requires a token refresh (access token lost from memory).

---

### 1.2 Update Password Reset Flow (Backend Alignment)

**Problem:** The backend spec (Phase 1.1) changes the password reset flow. The frontend must match: no more `signed_code` in URLs, verification code is sent out-of-band (email/SMS), and tokens are passed in request bodies.

**Files to modify:**
- `src/views/Auth/ForgotPassword.vue`
- `src/views/Auth/VerifyCode.vue`
- `src/views/Auth/ResetPassword.vue`
- `src/api/auth.ts`
- `src/router/index.ts`
- `src/types/auth.ts`

**Implementation:**

1. Update API module:

   ```typescript
   // src/api/auth.ts

   // BEFORE:
   // forgotPassword returns { username, signed_code }
   // verifyCode takes signed_code in URL path

   // AFTER:
   export async function forgotPassword(identifier: string) {
     // identifier = username or email
     const { data } = await api.post('/auth/forget-password/', { identifier })
     // Response: { message: string, username: string }
     // signed_code is NO LONGER returned
     return data
   }

   export async function verifyCode(username: string, code: string) {
     const { data } = await api.post('/auth/verify-code/', { username, code })
     // Response: { token: string } — short-lived reset token
     return data
   }

   export async function changePassword(token: string, newPassword: string) {
     const { data } = await api.post('/auth/change-password/', {
       token,
       new_password: newPassword,
     })
     return data
   }
   ```

2. Update `ForgotPassword.vue`:
   - Remove any logic that reads `signed_code` from the response.
   - On success, show a message: "Verification code sent to your email/phone."
   - Navigate to `/verify-code` passing only `username` as route query or state.

3. Update `VerifyCode.vue`:
   - Show 6-digit input field (use individual digit boxes for better UX).
   - Submit `{ username, code }` in the request body.
   - Handle 429 (too many attempts) — show "Too many attempts, request a new code."
   - On success, store the returned `token` in component state (not localStorage) and navigate to `/reset-password`.

4. Update `ResetPassword.vue`:
   - Accept the reset `token` from the previous step (via route state or a short-lived reactive store).
   - Submit `{ token, new_password }` in the request body.
   - On success, redirect to `/signin` with a success toast.

5. Update routes:
   ```typescript
   // BEFORE:
   // /verify-code/:username/:signedCode
   // /reset-password/:username/:signedCode

   // AFTER:
   { path: '/verify-code', component: VerifyCode },
   { path: '/reset-password', component: ResetPassword },
   ```

6. Update types:
   ```typescript
   // src/types/auth.ts

   export interface ForgotPasswordResponse {
     message: string
     username: string
   }

   export interface VerifyCodeResponse {
     token: string
   }

   export interface ChangePasswordRequest {
     token: string
     new_password: string
   }
   ```

**Acceptance criteria:**
- No URL contains a verification code or signed token at any point.
- VerifyCode page shows a "resend code" button with a 60-second cooldown.
- After 5 failed attempts, user sees "Too many attempts" and is prompted to restart.
- Reset token is held in memory only — refreshing the page on `/reset-password` sends user back to `/forgot-password`.

---

### 1.3 Remove `any` Types from API Layer

**Problem:** All list API calls use `api.get<any>('/endpoint/')` and cast with `as Type[]`. This disables TypeScript's safety — the compiler can't catch shape mismatches between the API response and the interface.

**Files to modify:** All 13 files in `src/api/`

**Implementation:**

1. Create a generic response wrapper:

   ```typescript
   // src/api/client.ts

   export interface PaginatedResponse<T> {
     count: number
     next: string | null
     previous: string | null
     results: T[]
   }

   export type ListResponse<T> = T[] | PaginatedResponse<T>

   export function unwrapList<T>(data: ListResponse<T>): T[] {
     return Array.isArray(data) ? data : data.results ?? []
   }

   export function unwrapPaginated<T>(data: ListResponse<T>): PaginatedResponse<T> {
     if (Array.isArray(data)) {
       return { count: data.length, next: null, previous: null, results: data }
     }
     return data as PaginatedResponse<T>
   }
   ```

2. Update each API module to use typed responses:

   ```typescript
   // BEFORE (every list endpoint):
   export async function getStudents(params?: any) {
     const { data } = await api.get<any>('/students/', { params })
     return { data: (Array.isArray(data) ? data : data.results ?? []) as Student[] }
   }

   // AFTER:
   import type { Student } from '@/types/student'
   import type { ListResponse } from '@/api/client'
   import { unwrapList } from '@/api/client'

   export async function getStudents(params?: StudentListParams) {
     const { data } = await api.get<ListResponse<Student>>('/students/', { params })
     return unwrapList(data)
   }
   ```

3. Define param types for each endpoint:

   ```typescript
   // src/types/student.ts
   export interface StudentListParams {
     search?: string
     class_group?: number
     academic_year?: number
     page?: number
     page_size?: number
   }
   ```

4. Apply this pattern to all 13 API modules. Each endpoint should have:
   - A typed params interface (if it accepts query params)
   - A typed response (using the existing interfaces from `src/types/`)
   - No `any` anywhere in the function signature or body

**Acceptance criteria:**
- `grep -rn "any" src/api/` returns zero hits (excluding comments).
- `npm run type-check` passes with strict mode.
- Each API function's return type is visible on hover in the IDE.

---

### 1.4 Add Global Error Handling

**Problem:** No error boundary, no global toast/notification system for API errors. Failed requests likely show nothing or crash silently.

**Files to create:**
- `src/composables/useToast.ts`
- `src/components/ui/Toast.vue`
- `src/components/ui/ToastContainer.vue`

**Files to modify:**
- `src/api/client.ts` (add global error interceptor)
- `src/App.vue` (mount ToastContainer)

**Implementation:**

1. Create toast composable:

   ```typescript
   // src/composables/useToast.ts
   import { ref } from 'vue'

   export interface Toast {
     id: string
     type: 'success' | 'error' | 'warning' | 'info'
     title: string
     message?: string
     duration?: number // ms, default 5000
   }

   const toasts = ref<Toast[]>([])

   export function useToast() {
     function show(toast: Omit<Toast, 'id'>) {
       const id = crypto.randomUUID()
       toasts.value.push({ ...toast, id })
       const duration = toast.duration ?? 5000
       if (duration > 0) {
         setTimeout(() => dismiss(id), duration)
       }
     }

     function dismiss(id: string) {
       toasts.value = toasts.value.filter(t => t.id !== id)
     }

     function success(title: string, message?: string) {
       show({ type: 'success', title, message })
     }

     function error(title: string, message?: string) {
       show({ type: 'error', title, message, duration: 8000 })
     }

     function warning(title: string, message?: string) {
       show({ type: 'warning', title, message })
     }

     return { toasts, show, dismiss, success, error, warning }
   }
   ```

2. Add global Axios error interceptor:

   ```typescript
   // src/api/client.ts — add after existing interceptors

   import { useToast } from '@/composables/useToast'

   api.interceptors.response.use(
     (response) => response,
     (error) => {
       const { error: showError } = useToast()

       if (error.response) {
         const status = error.response.status
         const data = error.response.data

         // Don't toast on 401 — handled by auth interceptor
         if (status === 401) return Promise.reject(error)

         if (status === 429) {
           showError(
             i18n.global.t('common.rateLimited'),
             i18n.global.t('common.tryAgainLater')
           )
         } else if (status === 403) {
           showError(i18n.global.t('common.forbidden'))
         } else if (status === 500) {
           showError(i18n.global.t('common.serverError'))
         } else if (data?.detail) {
           showError(data.detail)
         }
       } else if (error.code === 'ERR_NETWORK') {
         showError(
           i18n.global.t('common.networkError'),
           i18n.global.t('common.checkConnection')
         )
       }

       return Promise.reject(error)
     }
   )
   ```

3. Create `ToastContainer.vue` — renders at the top of `App.vue`, positioned fixed top-right, shows stacked toast cards with enter/leave transitions.

4. Add i18n keys for error messages:
   ```json
   {
     "common": {
       "rateLimited": "Too many requests",
       "tryAgainLater": "Please wait and try again",
       "forbidden": "Access denied",
       "serverError": "Server error. Please try again later.",
       "networkError": "Connection lost",
       "checkConnection": "Check your internet connection"
     }
   }
   ```
   Add to all 3 locale files (`en.json`, `ru.json`, `kz.json`).

**Acceptance criteria:**
- API 429 errors show a visible toast with "Too many requests" in the user's language.
- API 500 errors show a toast without leaking technical details.
- Network disconnection shows a persistent toast until reconnection.
- Toasts auto-dismiss after their duration. Error toasts last longer (8s).
- Toast messages render in the active locale.

---

## Phase 2 — State Management & Composables

### 2.1 Add Pinia for State Management

**Problem:** The app has only 2 composables (`useAuth`, `useSidebar`) with all other state managed locally in views. This means:
- No shared cache between views (navigating away and back re-fetches everything).
- No single source of truth for entities (a student updated on one page stays stale on another).
- Business logic is mixed into view components.

**Files to create:**
- `src/stores/auth.ts`
- `src/stores/students.ts`
- `src/stores/subjects.ts`
- `src/stores/lessons.ts`
- `src/stores/teachers.ts`
- `src/stores/notifications.ts`
- `src/stores/academic.ts`

**Files to modify:**
- `src/main.ts` — register Pinia
- `src/composables/useAuth.ts` — migrate to Pinia store

**Implementation:**

1. Install Pinia:
   ```bash
   npm install pinia
   ```

2. Register in `src/main.ts`:
   ```typescript
   import { createPinia } from 'pinia'
   app.use(createPinia())
   ```

3. Migrate `useAuth` to a Pinia store:

   ```typescript
   // src/stores/auth.ts
   import { defineStore } from 'pinia'
   import { ref, computed } from 'vue'
   import { setAccessToken } from '@/api/client'
   import * as authApi from '@/api/auth'
   import type { User } from '@/types/auth'

   export const useAuthStore = defineStore('auth', () => {
     const user = ref<User | null>(null)
     const isSessionLoading = ref(true)

     const isAuthenticated = computed(() => !!user.value)
     const userRole = computed(() => user.value?.role ?? null)

     // Role check helpers
     const isAdmin = computed(() =>
       ['admin', 'supervisor', 'principal'].includes(userRole.value ?? '')
     )
     const isStaff = computed(() =>
       ['admin', 'teacher', 'homeroom_teacher', 'supervisor', 'principal'].includes(userRole.value ?? '')
     )
     const isStudent = computed(() => userRole.value === 'student')
     const isParent = computed(() => userRole.value === 'parent')
     const isTeacher = computed(() =>
       ['teacher', 'homeroom_teacher'].includes(userRole.value ?? '')
     )

     async function login(username: string, password: string) {
       // ... existing login logic
     }

     function logout() {
       // ... existing logout logic
     }

     async function initSession() {
       // ... existing init logic
     }

     async function fetchCurrentUser() {
       // ... existing fetch logic
     }

     async function updateProfile(data: Partial<User>) {
       // ... existing update logic
     }

     async function uploadAvatar(file: File) {
       // ... existing upload logic
     }

     return {
       user, isSessionLoading, isAuthenticated,
       userRole, isAdmin, isStaff, isStudent, isParent, isTeacher,
       login, logout, initSession, fetchCurrentUser,
       updateProfile, uploadAvatar,
     }
   })
   ```

4. Keep `useAuth()` as a thin wrapper for backwards compatibility:

   ```typescript
   // src/composables/useAuth.ts
   import { useAuthStore } from '@/stores/auth'
   import { storeToRefs } from 'pinia'

   export function useAuth() {
     const store = useAuthStore()
     const { user, isAuthenticated, isSessionLoading } = storeToRefs(store)
     return {
       user, isAuthenticated, isSessionLoading,
       login: store.login,
       logout: store.logout,
       initSession: store.initSession,
       updateProfile: store.updateProfile,
       uploadAvatar: store.uploadAvatar,
     }
   }
   ```

5. Create entity stores following this pattern:

   ```typescript
   // src/stores/students.ts
   import { defineStore } from 'pinia'
   import { ref, computed } from 'vue'
   import * as studentsApi from '@/api/students'
   import type { Student, StudentDetail } from '@/types/student'

   export const useStudentsStore = defineStore('students', () => {
     const students = ref<Student[]>([])
     const currentStudent = ref<StudentDetail | null>(null)
     const isLoading = ref(false)
     const totalCount = ref(0)

     async function fetchStudents(params?: Record<string, unknown>) {
       isLoading.value = true
       try {
         const result = await studentsApi.getStudents(params)
         students.value = result
         // If paginated, also set totalCount from response
       } finally {
         isLoading.value = false
       }
     }

     async function fetchStudentDetail(id: number) {
       isLoading.value = true
       try {
         currentStudent.value = await studentsApi.getStudentDetail(id)
       } finally {
         isLoading.value = false
       }
     }

     function clearCurrent() {
       currentStudent.value = null
     }

     return {
       students, currentStudent, isLoading, totalCount,
       fetchStudents, fetchStudentDetail, clearCurrent,
     }
   })
   ```

6. Repeat this pattern for: `subjects`, `lessons`, `teachers`, `notifications`, `academic`.

**Acceptance criteria:**
- Navigating from student list to student detail and back does NOT re-fetch the list (cached in store).
- Role checks use `useAuthStore().isAdmin` instead of inline `computed` in every view.
- All views use store actions for data fetching — no direct API calls in `<script setup>`.
- `useAuth()` composable still works (backwards compatible wrapper).

---

### 2.2 Extract Reusable Composables

**Problem:** Common patterns (data tables with search/filter/pagination, form handling, loading states) are likely duplicated across 25+ views.

**Files to create:**
- `src/composables/useDataTable.ts`
- `src/composables/useForm.ts`
- `src/composables/usePagination.ts`
- `src/composables/useRoleAccess.ts`
- `src/composables/useDebounce.ts`

**Implementation:**

1. `useDataTable` — encapsulates list views:

   ```typescript
   // src/composables/useDataTable.ts
   import { ref, watch, type Ref } from 'vue'
   import { useDebounce } from './useDebounce'

   interface UseDataTableOptions<T> {
     fetchFn: (params: Record<string, unknown>) => Promise<T[]>
     defaultPageSize?: number
     defaultSort?: string
   }

   export function useDataTable<T>(options: UseDataTableOptions<T>) {
     const items = ref<T[]>([]) as Ref<T[]>
     const isLoading = ref(false)
     const search = ref('')
     const debouncedSearch = useDebounce(search, 300)
     const page = ref(1)
     const pageSize = ref(options.defaultPageSize ?? 25)
     const totalCount = ref(0)
     const filters = ref<Record<string, unknown>>({})

     async function fetch() {
       isLoading.value = true
       try {
         const params = {
           search: debouncedSearch.value || undefined,
           page: page.value,
           page_size: pageSize.value,
           ...filters.value,
         }
         items.value = await options.fetchFn(params)
       } finally {
         isLoading.value = false
       }
     }

     function setFilter(key: string, value: unknown) {
       filters.value[key] = value
       page.value = 1 // reset to first page
     }

     // Auto-fetch on search/page/filter change
     watch([debouncedSearch, page, filters], fetch, { deep: true })

     return {
       items, isLoading, search, page, pageSize, totalCount, filters,
       fetch, setFilter,
     }
   }
   ```

2. `useForm` — encapsulates form submission with validation:

   ```typescript
   // src/composables/useForm.ts
   import { ref, reactive } from 'vue'

   interface UseFormOptions<T extends Record<string, unknown>> {
     initialValues: T
     submitFn: (values: T) => Promise<void>
     validate?: (values: T) => Record<string, string>
   }

   export function useForm<T extends Record<string, unknown>>(options: UseFormOptions<T>) {
     const values = reactive({ ...options.initialValues }) as T
     const errors = ref<Record<string, string>>({})
     const isSubmitting = ref(false)
     const isSubmitted = ref(false)

     function setError(field: string, message: string) {
       errors.value[field] = message
     }

     function clearErrors() {
       errors.value = {}
     }

     async function submit() {
       clearErrors()

       if (options.validate) {
         const validationErrors = options.validate(values)
         if (Object.keys(validationErrors).length > 0) {
           errors.value = validationErrors
           return false
         }
       }

       isSubmitting.value = true
       try {
         await options.submitFn(values)
         isSubmitted.value = true
         return true
       } catch (error: unknown) {
         // If backend returns field-level errors, map them
         if (error && typeof error === 'object' && 'response' in error) {
           const resp = (error as { response: { data: Record<string, string[]> } }).response
           if (resp?.data) {
             for (const [field, messages] of Object.entries(resp.data)) {
               if (Array.isArray(messages)) {
                 errors.value[field] = messages[0]
               }
             }
           }
         }
         return false
       } finally {
         isSubmitting.value = false
       }
     }

     function reset() {
       Object.assign(values, options.initialValues)
       clearErrors()
       isSubmitted.value = false
     }

     return { values, errors, isSubmitting, isSubmitted, submit, reset, setError, clearErrors }
   }
   ```

3. `useRoleAccess` — centralized role checks:

   ```typescript
   // src/composables/useRoleAccess.ts
   import { computed } from 'vue'
   import { useAuthStore } from '@/stores/auth'
   import type { UserRole } from '@/types/auth'

   export function useRoleAccess() {
     const auth = useAuthStore()

     function hasRole(...roles: UserRole[]) {
       return computed(() => roles.includes(auth.userRole!))
     }

     function canEdit(resource: string) {
       // Centralized edit permission logic
       const editPermissions: Record<string, UserRole[]> = {
         student: ['admin', 'supervisor'],
         teacher: ['admin', 'supervisor'],
         lesson: ['admin', 'teacher', 'homeroom_teacher', 'supervisor'],
         subject: ['admin', 'teacher', 'homeroom_teacher', 'supervisor'],
         grade: ['admin', 'teacher', 'homeroom_teacher', 'supervisor'],
         achievement: ['admin', 'teacher', 'homeroom_teacher', 'supervisor'],
       }
       return computed(() => {
         const allowed = editPermissions[resource] ?? []
         return allowed.includes(auth.userRole!)
       })
     }

     return {
       hasRole,
       canEdit,
       isAdmin: auth.isAdmin,
       isStaff: auth.isStaff,
       isStudent: auth.isStudent,
       isParent: auth.isParent,
       isTeacher: auth.isTeacher,
     }
   }
   ```

4. `useDebounce`:

   ```typescript
   // src/composables/useDebounce.ts
   import { ref, watch, type Ref } from 'vue'

   export function useDebounce<T>(source: Ref<T>, delay = 300): Ref<T> {
     const debounced = ref(source.value) as Ref<T>
     let timeout: ReturnType<typeof setTimeout>

     watch(source, (val) => {
       clearTimeout(timeout)
       timeout = setTimeout(() => {
         debounced.value = val
       }, delay)
     })

     return debounced
   }
   ```

**Acceptance criteria:**
- Every list view (StudentsList, TeachersList, SubjectsActive, etc.) uses `useDataTable` — no manual search/filter/pagination logic in views.
- Every form (CreateSubjectModal, LessonGrading, RegisterUser, etc.) uses `useForm`.
- All `v-if="isAdmin"` checks in templates use `useRoleAccess()` instead of inline computed.
- `useDebounce` replaces any raw `setTimeout` patterns in search inputs.

---

## Phase 3 — Component Architecture

### 3.1 Add Loading Skeletons

**Problem:** The app likely shows either nothing or a spinner while data loads. Skeleton screens reduce perceived load time and prevent layout shift.

**Files to create:**
- `src/components/ui/Skeleton.vue`
- `src/components/ui/TableSkeleton.vue`
- `src/components/ui/CardSkeleton.vue`
- `src/components/ui/DetailSkeleton.vue`

**Implementation:**

1. Base skeleton component:

   ```vue
   <!-- src/components/ui/Skeleton.vue -->
   <template>
     <div
       class="animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"
       :class="classes"
       :style="{ width, height }"
     />
   </template>

   <script setup lang="ts">
   defineProps<{
     width?: string
     height?: string
     classes?: string
   }>()
   </script>
   ```

2. Create `TableSkeleton.vue` — renders 5-10 rows of skeleton bars matching the table column layout. Accept a `columns` prop for width variety.

3. Create `CardSkeleton.vue` — renders a card with skeleton avatar, title bar, and 2-3 text lines. Used for student cards, teacher cards, subject cards.

4. Create `DetailSkeleton.vue` — renders a full-page skeleton matching the student detail layout (header + 5 tab placeholders).

5. Usage pattern in views:

   ```vue
   <template>
     <TableSkeleton v-if="isLoading" :columns="5" :rows="10" />
     <DataTable v-else :items="students" :columns="columns" />
   </template>
   ```

**Acceptance criteria:**
- Every list view shows a skeleton while loading (not a spinner).
- Every detail view shows a skeleton while loading.
- Skeleton dimensions match the actual content dimensions (no layout shift on load).

---

### 3.2 Build a Typed DataTable Component

**Problem:** `BasicTableOne` is the only table component. With 10+ list views, a reusable typed table with built-in search, sorting, pagination, and empty states is needed.

**Files to create:**
- `src/components/tables/DataTable.vue`
- `src/components/tables/DataTableHeader.vue`
- `src/components/tables/DataTablePagination.vue`

**Implementation:**

```vue
<!-- src/components/tables/DataTable.vue -->
<template>
  <div>
    <!-- Search + filters slot -->
    <div v-if="$slots.filters" class="mb-4 flex flex-wrap items-center gap-3">
      <slot name="filters" />
    </div>

    <!-- Table -->
    <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400"
              :class="col.headerClass"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in items"
            :key="getRowKey(row, idx)"
            class="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
            :class="{ 'cursor-pointer': !!onRowClick }"
            @click="onRowClick?.(row)"
          >
            <td v-for="col in columns" :key="col.key" class="px-4 py-3" :class="col.cellClass">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-if="items.length === 0 && !loading" class="py-12 text-center">
        <slot name="empty">
          <p class="text-gray-500 dark:text-gray-400">{{ t('common.noData') }}</p>
        </slot>
      </div>
    </div>

    <!-- Pagination -->
    <DataTablePagination
      v-if="totalCount > pageSize"
      :page="page"
      :page-size="pageSize"
      :total="totalCount"
      @update:page="$emit('update:page', $event)"
    />
  </div>
</template>
```

Column definition type:

```typescript
export interface DataTableColumn<T = Record<string, unknown>> {
  key: keyof T & string
  label: string
  headerClass?: string
  cellClass?: string
  sortable?: boolean
}
```

**Acceptance criteria:**
- All list views use `DataTable` instead of raw `<table>` markup.
- Each view customizes cells via scoped slots (`#cell-name`, `#cell-grade`, etc.).
- Empty state shows a localized message.
- Pagination renders only when `totalCount > pageSize`.

---

### 3.3 Standardize Form Components

**Problem:** Form components exist (`Input`, `Select`, `Textarea`, etc.) but there's no standardized pattern for validation display, error states, and label association.

**Files to modify:** All components in `src/components/forms/`

**Implementation — add a wrapper component:**

```vue
<!-- src/components/forms/FormField.vue -->
<template>
  <div class="space-y-1.5">
    <label
      v-if="label"
      :for="fieldId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-error-500">*</span>
    </label>
    <slot :id="fieldId" :has-error="!!error" />
    <p v-if="error" class="text-sm text-error-600 dark:text-error-400">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-sm text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label?: string
  error?: string
  hint?: string
  required?: boolean
  name: string
}>()

const fieldId = computed(() => `field-${props.name}`)
</script>
```

Usage:

```vue
<FormField name="username" :label="t('auth.username')" :error="errors.username" required>
  <template #default="{ id, hasError }">
    <Input :id="id" v-model="values.username" :has-error="hasError" />
  </template>
</FormField>
```

Update the existing `Input`, `Select`, `Textarea` components to accept a `hasError` prop that applies error styling (`border-error-500`).

**Acceptance criteria:**
- Every form field has a label, a linked `for`/`id`, and an error display slot.
- Backend validation errors (from `useForm`) render inline below the relevant field.
- Required fields show a red asterisk.

---

## Phase 4 — Testing

### 4.1 Test Infrastructure

**Files to create:**
- `vitest.config.ts`
- `src/__tests__/setup.ts`

**Implementation:**

1. Install dependencies:
   ```bash
   npm install -D vitest @vue/test-utils @pinia/testing jsdom @testing-library/vue
   ```

2. Create Vitest config:

   ```typescript
   // vitest.config.ts
   import { defineConfig } from 'vitest/config'
   import vue from '@vitejs/plugin-vue'
   import { fileURLToPath } from 'node:url'

   export default defineConfig({
     plugins: [vue()],
     test: {
       environment: 'jsdom',
       globals: true,
       setupFiles: ['./src/__tests__/setup.ts'],
       include: ['src/**/*.{test,spec}.ts'],
       coverage: {
         include: ['src/composables/**', 'src/stores/**', 'src/api/**'],
       },
     },
     resolve: {
       alias: {
         '@': fileURLToPath(new URL('./src', import.meta.url)),
       },
     },
   })
   ```

3. Create setup file:

   ```typescript
   // src/__tests__/setup.ts
   import { config } from '@vue/test-utils'
   import { createI18n } from 'vue-i18n'
   import en from '@/locales/en.json'

   const i18n = createI18n({
     legacy: false,
     locale: 'en',
     messages: { en },
   })

   config.global.plugins = [i18n]

   // Mock window.matchMedia for dark mode tests
   Object.defineProperty(window, 'matchMedia', {
     writable: true,
     value: (query: string) => ({
       matches: false,
       media: query,
       onchange: null,
       addListener: () => {},
       removeListener: () => {},
       addEventListener: () => {},
       removeEventListener: () => {},
       dispatchEvent: () => false,
     }),
   })
   ```

4. Add test script to `package.json`:
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:run": "vitest run",
       "test:coverage": "vitest run --coverage"
     }
   }
   ```

---

### 4.2 Store Tests

**Files to create:**
- `src/stores/__tests__/auth.test.ts`
- `src/stores/__tests__/students.test.ts`

**Implementation:**

```typescript
// src/stores/__tests__/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// Mock the API module
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  refreshToken: vi.fn(),
  getMe: vi.fn(),
  logout: vi.fn(),
}))

import * as authApi from '@/api/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('starts unauthenticated', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
  })

  it('login sets user and tokens', async () => {
    const mockUser = { id: 1, username: 'teacher1', role: 'teacher' }
    vi.mocked(authApi.login).mockResolvedValue({
      tokens: { access: 'acc123', refresh: 'ref456' },
      user: mockUser,
    })

    const store = useAuthStore()
    await store.login('teacher1', 'password')

    expect(store.isAuthenticated).toBe(true)
    expect(store.user?.username).toBe('teacher1')
    expect(store.isTeacher).toBe(true)
    expect(store.isAdmin).toBe(false)
  })

  it('logout clears state', async () => {
    const store = useAuthStore()
    // Manually set state as if logged in
    store.user = { id: 1, username: 'admin1', role: 'admin' } as any
    expect(store.isAuthenticated).toBe(true)

    store.logout()

    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('role computed properties are correct', () => {
    const store = useAuthStore()

    store.user = { id: 1, role: 'student' } as any
    expect(store.isStudent).toBe(true)
    expect(store.isAdmin).toBe(false)
    expect(store.isStaff).toBe(false)

    store.user = { id: 2, role: 'admin' } as any
    expect(store.isAdmin).toBe(true)
    expect(store.isStaff).toBe(true)
    expect(store.isStudent).toBe(false)

    store.user = { id: 3, role: 'parent' } as any
    expect(store.isParent).toBe(true)
    expect(store.isStaff).toBe(false)
  })

  it('initSession recovers from valid refresh token', async () => {
    localStorage.setItem('refresh_token', 'valid_refresh')
    vi.mocked(authApi.refreshToken).mockResolvedValue({ access: 'new_access' })
    vi.mocked(authApi.getMe).mockResolvedValue({
      id: 1, username: 'user1', role: 'teacher',
    })

    const store = useAuthStore()
    await store.initSession()

    expect(store.isAuthenticated).toBe(true)
  })

  it('initSession logs out on invalid refresh token', async () => {
    localStorage.setItem('refresh_token', 'expired_refresh')
    vi.mocked(authApi.refreshToken).mockRejectedValue(new Error('401'))

    const store = useAuthStore()
    await store.initSession()

    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })
})
```

---

### 4.3 Composable Tests

**Files to create:**
- `src/composables/__tests__/useForm.test.ts`
- `src/composables/__tests__/useDebounce.test.ts`
- `src/composables/__tests__/useToast.test.ts`

**Example:**

```typescript
// src/composables/__tests__/useForm.test.ts
import { describe, it, expect, vi } from 'vitest'
import { useForm } from '@/composables/useForm'

describe('useForm', () => {
  it('submits successfully with valid data', async () => {
    const submitFn = vi.fn().mockResolvedValue(undefined)
    const form = useForm({
      initialValues: { name: '', email: '' },
      submitFn,
    })

    form.values.name = 'Test'
    form.values.email = 'test@test.com'
    const result = await form.submit()

    expect(result).toBe(true)
    expect(submitFn).toHaveBeenCalledWith({ name: 'Test', email: 'test@test.com' })
    expect(form.isSubmitted.value).toBe(true)
  })

  it('shows validation errors', async () => {
    const form = useForm({
      initialValues: { name: '' },
      submitFn: vi.fn(),
      validate: (values) => {
        const errors: Record<string, string> = {}
        if (!values.name) errors.name = 'Required'
        return errors
      },
    })

    const result = await form.submit()

    expect(result).toBe(false)
    expect(form.errors.value.name).toBe('Required')
  })

  it('maps backend field errors', async () => {
    const submitFn = vi.fn().mockRejectedValue({
      response: { data: { email: ['Already exists'] } },
    })
    const form = useForm({
      initialValues: { email: 'dup@test.com' },
      submitFn,
    })

    await form.submit()

    expect(form.errors.value.email).toBe('Already exists')
  })

  it('resets to initial values', () => {
    const form = useForm({
      initialValues: { name: 'original' },
      submitFn: vi.fn(),
    })

    form.values.name = 'changed'
    form.reset()

    expect(form.values.name).toBe('original')
  })
})
```

---

### 4.4 Router Guard Tests

**File to create:** `src/router/__tests__/guards.test.ts`

```typescript
// src/router/__tests__/guards.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// Test the guard logic directly, not through the router
// Extract guard logic into a testable function if not already

describe('Route Guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('redirects unauthenticated user to /signin', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    // Assert: guard should return { name: 'signin' }
  })

  it('allows authenticated admin to access /students', () => {
    const store = useAuthStore()
    store.user = { id: 1, role: 'admin' } as any
    // Assert: guard should return true for /students route
  })

  it('blocks student from accessing /subjects/active', () => {
    const store = useAuthStore()
    store.user = { id: 1, role: 'student' } as any
    // Assert: guard should redirect student away from staff routes
  })

  it('blocks parent from accessing /lessons/:id/grading', () => {
    const store = useAuthStore()
    store.user = { id: 1, role: 'parent' } as any
    // Assert: guard should redirect parent away from grading
  })

  it('redirects student to /my-subjects as default route', () => {
    const store = useAuthStore()
    store.user = { id: 1, role: 'student' } as any
    // Assert: visiting / redirects to /my-subjects
  })

  it('redirects parent to /my-children as default route', () => {
    const store = useAuthStore()
    store.user = { id: 1, role: 'parent' } as any
    // Assert: visiting / redirects to /my-children
  })
})
```

**Note to agent:** If the guard logic is inline in `src/router/index.ts` as a `beforeEach` callback, extract it into a named function and export it so tests can call it directly.

---

## Phase 5 — UX Improvements

### 5.1 Add 429 Rate Limit Handling with Retry

**Problem:** The backend now returns 429 on auth endpoints. The frontend needs to handle this gracefully beyond just a toast.

**Files to modify:**
- `src/views/Auth/Signin.vue`
- `src/views/Auth/ForgotPassword.vue`
- `src/views/Auth/VerifyCode.vue`

**Implementation:**

Create a composable for rate-limited forms:

```typescript
// src/composables/useRateLimitedAction.ts
import { ref, computed } from 'vue'

export function useRateLimitedAction() {
  const retryAfter = ref(0) // seconds remaining
  const isRateLimited = computed(() => retryAfter.value > 0)
  let interval: ReturnType<typeof setInterval> | null = null

  function handleRateLimitError(error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      (error as any).response?.status === 429
    ) {
      const header = (error as any).response.headers?.['retry-after']
      retryAfter.value = header ? parseInt(header, 10) : 60

      interval = setInterval(() => {
        retryAfter.value--
        if (retryAfter.value <= 0 && interval) {
          clearInterval(interval)
        }
      }, 1000)

      return true // was rate limited
    }
    return false // was not rate limited
  }

  return { retryAfter, isRateLimited, handleRateLimitError }
}
```

Usage in Signin:

```vue
<template>
  <Button :disabled="isSubmitting || isRateLimited" @click="submit">
    <template v-if="isRateLimited">
      {{ t('auth.retryIn', { seconds: retryAfter }) }}
    </template>
    <template v-else>
      {{ t('auth.signIn') }}
    </template>
  </Button>
</template>
```

---

### 5.2 Add Pagination Support for Backend Changes

**Problem:** The backend spec adds pagination to previously unbounded endpoints (`GET /students/`, `GET /lessons/`, `GET /subjects/<pk>/grades/`). The frontend must adapt.

**Files to modify:**
- `src/api/students.ts`, `src/api/lessons.ts`, `src/api/subjects.ts`
- All views that consume these endpoints
- `src/components/tables/DataTablePagination.vue` (already created in 3.2)

**Implementation:**

1. Update API functions to return paginated data:

   ```typescript
   // src/api/students.ts
   import { unwrapPaginated, type PaginatedResponse } from '@/api/client'
   import type { Student, StudentListParams } from '@/types/student'

   export async function getStudents(params?: StudentListParams): Promise<PaginatedResponse<Student>> {
     const { data } = await api.get<PaginatedResponse<Student>>('/students/', { params })
     return unwrapPaginated(data)
   }
   ```

2. Update stores to track pagination:

   ```typescript
   // In useStudentsStore:
   async function fetchStudents(params?: StudentListParams) {
     isLoading.value = true
     try {
       const result = await studentsApi.getStudents(params)
       students.value = result.results
       totalCount.value = result.count
     } finally {
       isLoading.value = false
     }
   }
   ```

3. Update views to pass `page` and `page_size`:

   ```vue
   <DataTable
     :items="students"
     :columns="columns"
     :loading="isLoading"
     :total-count="totalCount"
     :page="page"
     :page-size="pageSize"
     @update:page="page = $event"
   />
   ```

---

### 5.3 Add Notification Dropdown Polling

**Problem:** Notifications are fetched but there's no real-time or near-real-time update mechanism.

**Files to modify:**
- `src/components/layout/header/NotificationMenu.vue`
- `src/stores/notifications.ts`

**Implementation — polling approach (simpler than WebSocket for now):**

```typescript
// src/stores/notifications.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as notifApi from '@/api/notifications'
import type { Notification } from '@/types/notification'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  let pollInterval: ReturnType<typeof setInterval> | null = null

  async function fetchCount() {
    try {
      const count = await notifApi.getCount()
      unreadCount.value = count
    } catch {
      // Silently fail — don't spam errors for background polling
    }
  }

  async function fetchNotifications() {
    notifications.value = await notifApi.getNotifications()
  }

  function startPolling(intervalMs = 30_000) {
    stopPolling()
    fetchCount() // immediate first call
    pollInterval = setInterval(fetchCount, intervalMs)
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  return {
    notifications, unreadCount,
    fetchCount, fetchNotifications,
    startPolling, stopPolling,
  }
})
```

Start polling in `App.vue` after auth init:

```typescript
const auth = useAuthStore()
const notifications = useNotificationsStore()

watch(() => auth.isAuthenticated, (isAuth) => {
  if (isAuth) {
    notifications.startPolling()
  } else {
    notifications.stopPolling()
  }
}, { immediate: true })
```

---

### 5.4 Add Offline Detection Banner

**Files to create:**
- `src/composables/useOnlineStatus.ts`
- `src/components/ui/OfflineBanner.vue`

**Implementation:**

```typescript
// src/composables/useOnlineStatus.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useOnlineStatus() {
  const isOnline = ref(navigator.onLine)

  function update() {
    isOnline.value = navigator.onLine
  }

  onMounted(() => {
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
  })

  onUnmounted(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })

  return { isOnline }
}
```

```vue
<!-- src/components/ui/OfflineBanner.vue -->
<template>
  <Transition name="slide-down">
    <div
      v-if="!isOnline"
      class="fixed inset-x-0 top-0 z-[100] bg-warning-500 px-4 py-2 text-center text-sm font-medium text-white"
    >
      {{ t('common.offlineMessage') }}
    </div>
  </Transition>
</template>
```

Mount `OfflineBanner` at the top of `App.vue`.

---

## Phase 6 — New Views (Backend Feature Alignment)

> **These correspond to backend features in the backend spec. Implement only after the backend endpoints are deployed.**

### 6.1 Grade History / Snapshots View

**Corresponds to:** Backend spec Phase 5.1 (QuarterGradeSnapshot)

**Files to create:**
- `src/api/gradeHistory.ts`
- `src/types/gradeHistory.ts`
- `src/views/Students/GradeHistory.vue` (or a new tab in StudentDetail)

**Type definition:**

```typescript
// src/types/gradeHistory.ts
export interface GradeSnapshot {
  id: number
  offering_name: string
  subject_name: string
  quarter: number
  academic_year: string
  final_grade: number
  percentage: number
  letter_grade: string
  lesson_count: number
  graded_lesson_count: number
  frozen_at: string
  frozen_by: string
}
```

**View:** Add a "Grade History" tab (tab 6) to `StudentDetail` that shows a table of frozen quarter grades, grouped by academic year. Each row shows subject, quarter, percentage, letter grade, and freeze date.

**Admin action:** For admins, add a "Freeze Quarter" button on `SubjectDetail` that calls `POST /offerings/:id/freeze-quarter/` with a confirmation modal.

---

### 6.2 Teacher Workload Dashboard

**Corresponds to:** Backend spec Phase 5.5

**Files to create:**
- `src/api/dashboard.ts` (add `getTeacherWorkload`)
- `src/types/dashboard.ts` (add `TeacherWorkload`)
- `src/views/Personal/TeacherWorkload.vue`

**Type definition:**

```typescript
// src/types/dashboard.ts (add to existing)
export interface TeacherWorkload {
  teacher_id: number
  period: string
  lessons_taught: number
  lessons_upcoming: number
  lessons_without_topics: number
  grading_completion: {
    total_lessons_to_grade: number
    fully_graded: number
    partially_graded: number
    ungraded: number
    completion_percentage: number
  }
  subjects: {
    subject_name: string
    class_group: string
    lessons_this_week: number
    grading_complete: boolean
  }[]
}
```

**View:** A dashboard card layout showing:
- Top row: 4 stat cards (lessons taught, upcoming, ungraded, completion %).
- Main content: subject breakdown table with grading status badges.
- Chart: ApexCharts bar chart of lessons per subject this week.

**Route:** `/my-workload` — available to teacher and homeroom_teacher roles. Add to staff sidebar under "Personal" section.

---

### 6.3 Audit Log Viewer (Admin Only)

**Corresponds to:** Backend spec Phase 5.2

**Files to create:**
- `src/api/audit.ts`
- `src/types/audit.ts`
- `src/views/Admin/AuditLog.vue`

**Type definition:**

```typescript
// src/types/audit.ts
export interface AuditEntry {
  id: number
  model: string // 'TopicGrade' | 'Lesson' | 'Enrollment'
  object_id: number
  action: 'created' | 'changed' | 'deleted'
  changes: Record<string, { old: unknown; new: unknown }>
  user: { id: number; username: string; full_name: string }
  timestamp: string
}
```

**View:** A filterable table showing recent changes. Filters: model type, user, date range, student. Each row is expandable to show the diff (old value → new value) with color coding (red for removed, green for added).

**Route:** `/audit-log` — admin-only. Add to sidebar under "Management".

---

### 6.4 Academic Year Rollover UI (Admin Only)

**Corresponds to:** Backend spec Phase 5.4

**Files to create:**
- `src/views/Admin/YearRollover.vue`

**View:** A step wizard:
1. **Preview**: Shows current year, student counts per class, promotion rules. Calls the backend dry-run endpoint.
2. **Confirm**: Shows a summary of changes (N students promoted, N class groups created, N enrollments archived). Requires typing the new year name to confirm.
3. **Result**: Shows success/failure with a breakdown of what was done.

This is a destructive action — add a confirmation modal with the text "Type '2026-2027' to confirm rollover".

**Route:** `/admin/rollover` — admin-only. Linked from the academic year settings.

---

## Phase 7 — Locale Completeness

### 7.1 Audit Translation Coverage

**Problem:** New features and error messages need translations in all 3 locales.

**Implementation:**

1. Create a script that compares keys across locale files:

   ```typescript
   // scripts/check-i18n.ts
   // Read en.json, ru.json, kz.json
   // Recursively compare keys
   // Report: missing keys per locale, unused keys
   ```

2. Add to CI:
   ```json
   {
     "scripts": {
       "i18n:check": "tsx scripts/check-i18n.ts"
     }
   }
   ```

3. For every new feature in this spec, add keys to ALL 3 locale files at the time of implementation — not as a follow-up.

**New key groups to add across all locales:**

```json
{
  "common": {
    "rateLimited": "...",
    "tryAgainLater": "...",
    "forbidden": "...",
    "serverError": "...",
    "networkError": "...",
    "checkConnection": "...",
    "offlineMessage": "...",
    "noData": "..."
  },
  "auth": {
    "codeSent": "...",
    "resendCode": "...",
    "tooManyAttempts": "...",
    "retryIn": "..."
  },
  "audit": {
    "title": "...",
    "changes": "...",
    "created": "...",
    "changed": "...",
    "deleted": "..."
  },
  "workload": {
    "title": "...",
    "lessonsTaught": "...",
    "upcoming": "...",
    "ungraded": "...",
    "completion": "..."
  },
  "gradeHistory": {
    "title": "...",
    "frozenAt": "...",
    "frozenBy": "...",
    "freezeQuarter": "..."
  },
  "rollover": {
    "title": "...",
    "preview": "...",
    "confirm": "...",
    "typeToConfirm": "..."
  }
}
```

---

## Appendix: Execution Order

> **Execute in this order. Each batch depends on the previous one being complete.**

```
Batch 1 — Security & critical fixes:
  ├── 1.1 Fix token storage
  ├── 1.2 Update password reset flow
  ├── 1.3 Remove `any` types from API layer
  └── 1.4 Add global error handling (toast system)

Batch 2 — State & composables:
  ├── 2.1 Add Pinia stores
  └── 2.2 Extract reusable composables

Batch 3 — Component architecture:
  ├── 3.1 Add loading skeletons
  ├── 3.2 Build typed DataTable component
  └── 3.3 Standardize form components

Batch 4 — Testing:
  ├── 4.1 Test infrastructure (Vitest setup)
  ├── 4.2 Store tests
  ├── 4.3 Composable tests
  └── 4.4 Router guard tests

Batch 5 — UX improvements:
  ├── 5.1 Rate limit handling with retry countdown
  ├── 5.2 Pagination support for backend changes
  ├── 5.3 Notification polling
  └── 5.4 Offline detection banner

Batch 6 — New views (after backend deploys):
  ├── 6.1 Grade history / snapshots tab
  ├── 6.2 Teacher workload dashboard
  ├── 6.3 Audit log viewer
  └── 6.4 Academic year rollover wizard

Batch 7 — Localization:
  └── 7.1 Audit and complete all 3 locale files
```
