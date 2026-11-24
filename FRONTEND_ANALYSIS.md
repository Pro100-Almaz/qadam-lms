# Qadam LMS — Frontend Analysis

## 1. Project Overview

| Field | Value |
|-------|-------|
| Framework | Vue 3.5 + TypeScript (Composition API, `<script setup>`) |
| Build | Vite 6, `vue-tsc` for type checking |
| Styling | Tailwind CSS 4.0, CSS-based dark mode |
| Router | Vue Router 4.5 with role-based guards |
| i18n | Vue I18n 11, 3 locales: Russian (default), Kazakh, English |
| HTTP | Axios with JWT auth + automatic token refresh |
| Charts | ApexCharts (vue3-apexcharts) |
| Calendar | FullCalendar 6.1 |
| Icons | Lucide Vue Next |
| State | Composables (no Pinia/Vuex) |

### Scripts

```bash
npm run dev        # Vite dev server
npm run build      # vue-tsc + vite build
npm run lint       # ESLint with auto-fix
npm run type-check # vue-tsc --build
```

---

## 2. Directory Structure

```
src/
├── api/               # Axios API modules (13 modules)
├── assets/            # CSS (main.css with Tailwind theme)
├── components/
│   ├── layout/        # AdminLayout, AppSidebar, AppHeader, ThemeProvider
│   │   └── header/    # LanguageSwitcher, NotificationMenu, SearchBar, UserMenu
│   ├── ui/            # Button, Badge, Modal, Alert, Avatar, Breadcrumb, Pagination
│   ├── forms/         # Input, Select, Textarea, Checkbox, Toggle, Dropzone
│   ├── charts/        # BarChart, LineChart
│   ├── common/        # PageBreadcrumb, DropdownMenu, ThemeToggler
│   ├── profile/       # ProfileCard, PersonalInfoCard
│   ├── subjects/      # CreateSubjectModal
│   └── tables/        # BasicTableOne
├── composables/       # useAuth, useSidebar
├── i18n/              # i18n setup (index.ts)
├── icons/             # Custom SVG icon components
├── locales/           # en.json, ru.json, kz.json
├── router/            # index.ts with role-based routing
├── types/             # TypeScript interfaces (12 files)
└── views/
    ├── Auth/          # Signin, Signup, ForgotPassword, VerifyCode, ResetPassword, RegisterUser
    ├── Lessons/       # LessonsList, LessonDetail, LessonGrading
    ├── Subjects/      # SubjectsActive, SubjectsProcessing, SubjectsArchived, SubjectDetail
    ├── Teachers/      # TeachersList, TeacherDetail
    ├── Students/      # StudentsList, StudentDetail
    ├── Personal/      # MySubjects, MyTeachers, MyClassmates, MyChildren, MyChildDetail,
    │                  # ParentTeachers, MyStudent, MyClass, MyLessons
    ├── Others/        # UserProfile, Calendar
    └── Errors/        # FourZeroFour
```

---

## 3. Authentication Flow

1. **Login** (`POST /auth/login/`) returns `{ tokens: { access, refresh }, user }`
2. Access token stored in Axios headers; refresh token in `localStorage`
3. Auth state lives in the Pinia store `useAuthStore` (`src/stores/auth.ts`); `useAuth()` is a thin `storeToRefs` wrapper over it
4. On app init, `initSession()` loads the refresh token from localStorage and fetches `/auth/me/`
5. After login / `/auth/me/`, `reconcileActiveRole()` picks the **active role**: the stored pick for this user, else the primary role, else the first available
6. Every request carries an `X-Active-Role` header (`src/api/client.ts`); role-scoped endpoints answer 403 without it
7. Axios interceptor catches 401, refreshes token via `/auth/token/refresh/`
8. On refresh failure, clears state and redirects to `/signin`

### Composable API

```typescript
const {
  user, assignedRoles, availableRoles, activeRole, activeRoles,
  isAuthenticated, isSessionLoading,
  login, logout, initSession, fetchCurrentUser, updateProfile, uploadAvatar, setActiveRole,
} = useAuth()
```

### Active Role Switching

- A user has several `roles`; they act as exactly one at a time (`activeRole`), switched from the header `UserMenu`
- The pick is persisted to localStorage (keyed by user id) so it survives reloads
- `homeroom_teacher` is not selectable: picking `teacher` also grants `homeroom_teacher` if assigned (`getActiveRoles` in `src/utils/roles.ts`)
- Switching to a role whose home is the current page triggers a full reload so the page refetches under the new role

---

## 4. Role-Based Access Control

### User Roles

```typescript
type UserRole = 'admin' | 'teacher' | 'homeroom_teacher' | 'student' | 'supervisor' | 'principal' | 'parent' | 'clubmanager' | 'psychologist'
type SelectableUserRole = Exclude<UserRole, 'homeroom_teacher'>
```

Access checks use the **active** roles (`activeRoles`), not every assigned role.

### Role Groups (Router)

| Group | Roles |
|-------|-------|
| `staffRoles` | admin, teacher, homeroom_teacher, supervisor, principal |
| `adminRoles` | admin, supervisor, principal |

### Default Redirect by Role

| Role | Home Route |
|------|-----------|
| student | `/my-subjects` |
| parent | `/my-children` |
| clubmanager | `/clubs` |
| psychologist | `/students` |
| admin, teacher, supervisor, principal | `/subjects/active` |

Source: `getRoleHome()` in `src/utils/roles.ts`.

### Route Access Matrix

| Route | Student | Parent | Teacher | Admin |
|-------|:-------:|:------:|:-------:|:-----:|
| `/subjects/*` | - | - | Yes | Yes |
| `/lessons` (calendar) | Yes | Yes | Yes | Yes |
| `/lessons/:id` (detail) | - | - | Yes | Yes |
| `/lessons/:id/grading` | - | - | Yes | Yes |
| `/teachers` | - | - | Yes | Yes |
| `/students` | - | - | Yes | Yes |
| `/register` | - | - | - | Yes |
| `/my-subjects` | Yes | - | - | - |
| `/my-teachers` | Yes | - | - | - |
| `/my-classmates` | Yes | - | - | - |
| `/my-children` | - | Yes | - | - |
| `/my-children/:id` | - | Yes | - | - |
| `/parent-teachers` | - | Yes | - | - |
| `/my-student` | - | Yes | Yes | Yes |
| `/my-class` | - | - | Yes | Yes |
| `/my-lessons` | - | - | Yes | Yes |
| `/profile` | Yes | Yes | Yes | Yes |

### Sidebar Menus

**Student**: My Subjects, Calendar, My Teachers, My Classmates

**Parent**: My Children, Calendar, My Teachers

**Staff** (admin/teacher/supervisor/principal):
- Management: Subjects (Active/Processing/Archived), Schedule, Teachers, Students, Register (admin only)
- Personal: My Student, My Class, My Lessons

---

## 5. API Layer

### Client (`src/api/client.ts`)

- Base URL: `VITE_API_BASE_URL` (default `/api/v1`)
- Bearer token in `Authorization` header
- 401 interceptor with token refresh and retry queue

### API Modules (24 files)

| Module | Endpoints | Description |
|--------|-----------|-------------|
| `auth.ts` | login, logout, me, updateProfile, uploadAvatar, register, forgotPassword, verifyCode, changePassword, schoolGroups | Authentication and user management |
| `lessons.ts` | getLessons, getCalendarLessons, getLessonDetail, createLesson, deleteLesson, topic/subtopic CRUD, distributeWeights | Lesson and schedule management |
| `subjects.ts` | getSubjects, getSubjectDetail, getSubjectGrades, createSubject, changeStatus, delete, getMySubjects | Subject catalog and status management |
| `students.ts` | getStudents, getStudentDetail, updateStudent, psychStatesCRUD, getTemplates | Student profiles and psych tracking |
| `teachers.ts` | getTeachers, getTeacherDetail, updateTeacher | Teacher profiles |
| `grading.ts` | getGrading, submitGrading, updateGrading, deleteStudentGrading | Lesson grading interface |
| `achievements.ts` | achievements/reading/clubs CRUD, downloadCertificate | Student achievements, reading, clubs |
| `studentSelf.ts` | getMySubjects, getMyTeachers, getMyClassmates | Student self-service (role: student) |
| `parentSelf.ts` | getMyChildren, getMyChildDetail, getParentTeachers | Parent self-service (role: parent) |
| `academic.ts` | getAcademicYears, getClassGroups | Academic year and class data |
| `dashboard.ts` | getDashboardStats | Dashboard metrics |
| `notifications.ts` | getNotifications, getNotification, getCount, delete | User notifications |
| `enrollments.ts` | getEnrollments | Student enrollment data |
| `analytics.ts` | student/assignment trajectories, topic heatmap, subject radar, assignment & attendance summaries | Analytics charts |
| `attendance.ts` | session attendance get/create, attendance record CRUD, student attendance | Attendance sheet |
| `clubs.ts` | clubs CRUD, members, available students, student clubs & club attendance | Clubs |
| `gradeReports.ts` | downloadClassGroupGradeReport, downloadStudentGradeReport | Grade report exports |
| `homeworks.ts` | homework CRUD (quarter required), homework grades CRUD, student / my-class / teacher homework lists | Homeworks |
| `quarterGrades.ts` | quarter grades CRUD | Quarter (2-5) grades |
| `reports.ts` | generateReport, getReport, getStudentReports, downloadReportPdf | AI student reports |
| `schedule.ts` | subject schedules CRUD, schedule sessions CRUD | Timetable |
| `subjectAssignments.ts` | assignment categories, subject assignments CRUD (quarter required) | Gradebook assignments |
| `teacherDashboard.ts` | teacher/psychologist dashboards, homeroom class, workload, my classes, `/teacher/offerings/` | Teacher-facing pages |
| `teachingAssignments.ts` | teaching assignments list/create/update (quarter-scoped, server `can_edit`) | Teaching assignments |

### Response Handling Pattern

All list endpoints handle both paginated and array responses:

```typescript
const { data } = await api.get<any>('/endpoint/')
return { data: (Array.isArray(data) ? data : data.results ?? []) as Type[] }
```

---

## 6. TypeScript Types

### Core Types (12 files)

| File | Key Interfaces |
|------|---------------|
| `auth.ts` | `UserRole`, `User`, `AuthTokens`, `LoginRequest`, `LoginResponse` |
| `student.ts` | `Student`, `StudentDetail`, `PsychologicalState`, `PsychologicalStateTemplate` |
| `teacher.ts` | `Teacher`, `TeacherDetail`, `TeacherAssignment` |
| `lesson.ts` | `CalendarLesson`, `Lesson`, `LessonDetail`, `Topic`, `Subtopic`, `LessonStudent` |
| `subject.ts` | `Subject`, `SubjectOffering`, `SubjectDetail`, `SubjectGrades`, `SubjectStatus`, `LanguageGroup` |
| `academic.ts` | `AcademicYear`, `GradeLevel`, `ClassGroup` |
| `grading.ts` | `GradingData`, `SubmitGradingRequest` |
| `achievement.ts` | `Achievement`, `ReadingEntry`, `ClubEntry`, `AchievementCategory` |
| `notification.ts` | `Notification`, `NotificationAction` |
| `studentSelf.ts` | `MySubject`, `MyTeacher`, `MyClassmate` |
| `parentSelf.ts` | `ParentChild`, `ParentTeacher` |
| `dashboard.ts` | `DashboardStats` |

### Key Data Structures

**StudentDetail** (most complex):
```typescript
interface StudentDetail extends Student {
  offerings: SubjectOffering[]
  subject_quarter_grades: Record<string, Record<string, number>>  // quarter → subject → %
  total_quarter_grades: Record<string, number>                     // quarter → grade (2-5)
  cumulative_subject_grades: Record<string, number>                // subject → avg %
  student_total_grade: number                                       // overall score
  psychological_states: {
    current: PsychologicalState[]
    history: Record<string, PsychologicalState[]>
  }
}
```

**LessonDetail**:
```typescript
interface LessonDetail extends Lesson {
  topics: Topic[]           // with nested subtopics
  students: LessonStudent[]
  student_grades: Record<string, any>
}
```

---

## 7. Views & Pages Summary

### Auth Pages (6)

| Page | Route | Description |
|------|-------|-------------|
| Signin | `/signin` | Username/password login |
| Signup | `/signup` | Public registration |
| ForgotPassword | `/forgot-password` | Email/username entry for password reset |
| VerifyCode | `/verify-code` | 6-digit OTP verification |
| ResetPassword | `/reset-password` | New password entry |
| RegisterUser | `/register` | Admin-only user registration with role assignment |

### Management Pages (10)

| Page | Route | Tabs/Features |
|------|-------|---------------|
| SubjectsActive | `/subjects/active` | Table with search, language filter, pagination, create modal |
| SubjectsProcessing | `/subjects/processing` | Same layout, different status filter |
| SubjectsArchived | `/subjects/archived` | Same layout, restore action |
| SubjectDetail | `/subjects/:id` | Gradebook, top students, lesson list, subject info |
| LessonsList | `/lessons` | FullCalendar (month/week/day), date range API, filter by subject/class/quarter |
| LessonDetail | `/lessons/:id` | Topics/subtopics with weights, student grades, delete action |
| LessonGrading | `/lessons/:id/grading` | Cascade/independent mode, per-topic grading, comment templates |
| TeachersList | `/teachers` | Table with search, position filter, delete |
| TeacherDetail | `/teachers/:userId` | Profile, assignments, personal info, contact |
| StudentsList | `/students` | Table with search, class/year filter |

### Student Detail Page

`/students/:userId` — The most feature-rich page with 5 tabs:

1. **Subjects**: Quarter grades (Q1-Q4), cumulative subjects table with progress bars, line chart (quarter trend), radar chart (subject comparison)
2. **Clubs**: Club entries grid with attendance bars, plan, criteria, comments. CRUD for admin.
3. **Psychological States**: State cards with star ratings, score labels, comments, timestamps. History timeline modal. CRUD for admin.
4. **Rating**: Achievements table (category badges, certificate download) + Reading list cards (covers, pages, test scores). CRUD for admin.
5. **Personal Info**: User details (username, email, name, DOB, phone, address), school info (role, school, class)

### Student Self-Service (3)

| Page | Route | Description |
|------|-------|-------------|
| MySubjects | `/my-subjects` | Subject cards with teacher, grade, quarter breakdown |
| MyTeachers | `/my-teachers` | Teacher cards with avatar, email, subject badges |
| MyClassmates | `/my-classmates` | Classmate cards with search, grades |

### Parent Self-Service (3)

| Page | Route | Description |
|------|-------|-------------|
| MyChildren | `/my-children` | Children cards with grades, quarter breakdown, links to detail |
| MyChildDetail | `/my-children/:id` | Full student detail (5 tabs) — read-only mirror of admin StudentDetail |
| ParentTeachers | `/parent-teachers` | Teacher cards with subject + children badges |

### Staff Personal (3)

| Page | Route | Description |
|------|-------|-------------|
| MyStudent | `/my-student` | Parent's linked student view (profile, grades, psych states) |
| MyClass | `/my-class` | Homeroom teacher's class |
| MyLessons | `/my-lessons` | Teacher's lesson schedule |

---

## 8. Styling & Theming

### Tailwind Configuration

- **Tailwind CSS 4.0** with CSS-based theme (`@theme` directive in `main.css`)
- **Font**: Outfit (Google Fonts)
- **Dark mode**: Class-based (`.dark` on `<html>`)
- **Theme toggler**: `ThemeToggler.vue` component

### Color Palette

| Token | Usage |
|-------|-------|
| `brand-*` | Primary accent (orange gradient) |
| `gray-*` | Neutral backgrounds, borders, text |
| `success-*` | Positive states (green) |
| `error-*` | Negative states (red) |
| `warning-*` | Warning states (amber) |

### Responsive Breakpoints

Standard Tailwind + custom: `2xsm` (375px), `xsm` (425px), `3xl` (2000px)

### Common UI Patterns

- Cards: `rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900`
- Loading: Spinner with `animate-spin rounded-full border-4 border-brand-500 border-t-transparent`
- Empty state: Centered icon + text in dashed border container
- Tables: Full-width with header styling, hover states
- Badges: `rounded-full px-2.5 py-0.5 text-xs font-medium` with color variants
- Modals: `Modal.vue` with fullscreen backdrop

---

## 9. Internationalization

### Setup

- 3 locales: `en` (English), `ru` (Russian, default), `kz` (Kazakh)
- Persisted in `localStorage` key `locale`
- Language switcher in header (`LanguageSwitcher.vue`)

### Translation Keys Structure

```json
{
  "app": {},           // App name
  "nav": {},           // Sidebar navigation labels
  "common": {},        // Shared UI strings (add, edit, delete, save, etc.)
  "validation": {},    // Form validation messages
  "auth": {},          // Auth pages, registration, roles
  "dashboard": {},     // Dashboard metrics
  "academicYears": {}, // Academic year management
  "subjects": {},      // Subject management + languages
  "classes": {},       // Class management
  "lessons": {},       // Schedule, days of week
  "teachers": {},      // Teacher management
  "students": {},      // Student management, achievements, clubs, reading
  "profile": {},       // User profile
  "grading": {},       // Lesson grading
  "pagination": {}     // Table pagination
}
```

---

## 10. Key Composables

### `useAuth()`

Global auth state and operations. Uses `localStorage` for persistence.

```typescript
interface UseAuth {
  user: Ref<User | null>
  isAuthenticated: ComputedRef<boolean>
  isSessionLoading: Ref<boolean>
  login(username: string, password: string): Promise<{ success: boolean; errors?: Record<string, string[]> }>
  logout(): void
  initSession(): void
  fetchCurrentUser(): void
  updateProfile(data: Partial<User>): Promise<{ success: boolean }>
  uploadAvatar(file: File): Promise<{ success: boolean }>
}
```

### `useQuarterStore()` (`src/stores/quarter.ts`)

The quarter picked in any quarter picker, shared across pages (attendance, grading, homeworks). Persisted in sessionStorage, so it survives reloads in the tab but a new tab or sign-in starts from the current quarter. Resets when the signed-in user changes.

### `useSidebar()`

Sidebar UI state with provide/inject pattern.

```typescript
interface UseSidebar {
  isExpanded: Ref<boolean>
  isMobileOpen: Ref<boolean>
  isHovered: Ref<boolean>
  openSubmenu: Ref<string | null>
  toggleSidebar(): void
  toggleMobileSidebar(): void
}
```

---

## 11. Notable Patterns

### API Response Normalization

All list APIs handle both `[]` and `{ results: [] }` responses:

```typescript
const { data } = await api.get<any>('/endpoint/')
return { data: (Array.isArray(data) ? data : data.results ?? []) as Type[] }
```

### Role-Based UI Visibility

```typescript
// Role flags come from the auth store and follow the ACTIVE role
const auth = useAuthStore()
// auth.isAdmin  -> admin | supervisor | principal
// auth.isStaff  -> admin | teacher | homeroom_teacher | supervisor | principal
// In template: v-if="auth.isAdmin"
```

### Breadcrumb Navigation

Reusable `Breadcrumb.vue` component on all detail pages:

```vue
<Breadcrumb backTo="/students" :crumbs="[
  { label: t('students.title'), to: '/students' },
  { label: fullName }
]" />
```

### Grade Color Helpers

Consistent grade-to-color mapping across all views:

```typescript
function gradeColor(grade: number | null): string {
  if (grade == null) return 'text-gray-400 dark:text-gray-500'
  if (grade > 80) return 'text-success-600 dark:text-success-400'
  if (grade > 60) return 'text-warning-600 dark:text-warning-400'
  return 'text-error-600 dark:text-error-400'
}
```

### Quarter Grade Scale

Backend uses 2-5 scale for quarter grades:

| Grade | Label | Color |
|-------|-------|-------|
| 5 | Excellent | Success (green) |
| 4 | Good | Brand (blue) |
| 3 | Average | Warning (amber) |
| 2 | Below Average | Error (red) |

---

## 12. File Count Summary

| Category | Count |
|----------|-------|
| Views (pages) | 25 |
| Components | ~40 |
| API modules | 13 |
| Type files | 12 |
| Composables | 2 |
| Locale files | 3 |
| **Total source files** | **~95** |
