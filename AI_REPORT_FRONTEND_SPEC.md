# AI Student Report — Frontend Spec

**Purpose:** Implementation guide for a coding agent. Frontend only.
**Stack:** Vue 3.5 + TypeScript / Vite 6 / Tailwind CSS 4.0 / Vue Router 4.5 / Vue I18n 11
**Feature:** AI-generated student performance report — generation UI, report renderer, PDF download.
**Access:** Admin + Teacher roles only (enforced by router guard + v-if).

---

## API Contract (shared with backend)

> **The backend spec implements these endpoints. Do not change the request/response shapes without updating the backend spec.**

### Endpoints

```
POST   /api/v1/students/<student_id>/reports/generate/   → Generate a new report
GET    /api/v1/students/<student_id>/reports/             → List past reports for student
GET    /api/v1/reports/<id>/                              → Get single report with full data
GET    /api/v1/reports/<id>/pdf/                          → Download report as PDF (binary)
```

### Request / Response

**POST /generate/ — Request Body:**
```json
{
  "language": "ru",
  "quarter": 3
}
```
- `language`: required, one of `"ru"`, `"kk"`, `"en"`
- `quarter`: optional, integer 1-4. Omit or null for full-year report.

**POST /generate/ — Response (also GET /reports/\<id\>/):**
```json
{
  "id": 42,
  "student": 15,
  "academic_year": 3,
  "quarter": 3,
  "language": "ru",
  "status": "completed",
  "report_data": { "...see ReportData schema below..." },
  "tokens_used": 2847,
  "generation_time_ms": 6200,
  "generated_by": 7,
  "generated_by_name": "Aisha Nurlanovna",
  "created_at": "2026-05-04T14:30:00Z",
  "error_message": ""
}
```
- `status`: one of `"pending"`, `"generating"`, `"completed"`, `"failed"`
- `report_data`: null when status is not `"completed"`
- `error_message`: empty string on success, human-readable on failure

**GET /students/\<id\>/reports/ — Response (list, no report_data):**
```json
[
  {
    "id": 42,
    "quarter": 3,
    "language": "ru",
    "status": "completed",
    "generated_by_name": "Aisha Nurlanovna",
    "created_at": "2026-05-04T14:30:00Z"
  }
]
```

### ReportData Schema

Every key is guaranteed present when `status == "completed"`:

```json
{
  "summary": "string",
  "overall_assessment": {
    "score_label": "Excellent|Good|Average|Below Average|Needs Attention",
    "description": "string"
  },
  "academic_performance": {
    "overview": "string",
    "subject_analyses": [
      {
        "subject": "string",
        "grade_percentage": 85.0,
        "class_average": 72.0,
        "trend": "improving|declining|stable",
        "analysis": "string",
        "recommendation": "string"
      }
    ]
  },
  "strengths": [
    { "area": "string", "description": "string" }
  ],
  "areas_for_improvement": [
    { "area": "string", "description": "string", "suggested_action": "string" }
  ],
  "psychological_profile": {
    "summary": "string",
    "observations": ["string"],
    "recommendations": ["string"]
  },
  "extracurricular": {
    "summary": "string",
    "highlights": ["string"]
  },
  "recommendations": {
    "for_teachers": ["string"],
    "for_parents": ["string"],
    "for_student": ["string"]
  },
  "conclusion": "string"
}
```

### HTTP Codes to Handle

| Code | Meaning | Frontend action |
|------|---------|-----------------|
| 201 | Report generated | Show report |
| 200 | Cached report returned | Show report |
| 500 | Generation failed | Show error + retry button |
| 429 | Rate limited | Show countdown timer |
| 403 | Not admin/teacher | Should never happen (UI hides button) |
| 404 | Student not found | Show error toast |

---

## Files to Create

```
src/
├── types/
│   └── report.ts
├── api/
│   └── reports.ts
├── components/
│   └── reports/
│       ├── GenerateReportModal.vue
│       ├── ReportView.vue
│       ├── ReportHistoryList.vue
│       ├── SubjectAnalysisCard.vue
│       └── __tests__/
│           └── ReportView.test.ts
├── views/
│   └── Reports/
│       └── ReportPage.vue
└── locales/
    ├── en.json  (add "reports" key group)
    ├── ru.json  (add "reports" key group)
    └── kz.json  (add "reports" key group)
```

**Files to modify:**
- `src/views/Students/StudentDetail.vue` — add generate button + report history
- `src/router/index.ts` — add `/reports/:id` route

---

## 1. Types

**File to create:** `src/types/report.ts`

```typescript
export type ReportLanguage = 'ru' | 'kk' | 'en'
export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed'

export interface GenerateReportRequest {
  language: ReportLanguage
  quarter?: number | null
}

export interface SubjectAnalysis {
  subject: string
  grade_percentage: number
  class_average: number
  trend: 'improving' | 'declining' | 'stable'
  analysis: string
  recommendation: string
}

export interface ReportData {
  summary: string
  overall_assessment: {
    score_label: string
    description: string
  }
  academic_performance: {
    overview: string
    subject_analyses: SubjectAnalysis[]
  }
  strengths: Array<{ area: string; description: string }>
  areas_for_improvement: Array<{
    area: string
    description: string
    suggested_action: string
  }>
  psychological_profile: {
    summary: string
    observations: string[]
    recommendations: string[]
  }
  extracurricular: {
    summary: string
    highlights: string[]
  }
  recommendations: {
    for_teachers: string[]
    for_parents: string[]
    for_student: string[]
  }
  conclusion: string
}

export interface StudentReport {
  id: number
  student: number
  academic_year: number
  quarter: number | null
  language: ReportLanguage
  status: ReportStatus
  report_data: ReportData | null
  tokens_used: number | null
  generation_time_ms: number | null
  generated_by: number | null
  generated_by_name: string | null
  created_at: string
  error_message: string
}

export interface StudentReportListItem {
  id: number
  quarter: number | null
  language: ReportLanguage
  status: ReportStatus
  generated_by_name: string | null
  created_at: string
}
```

---

## 2. API Module

**File to create:** `src/api/reports.ts`

```typescript
import api from '@/api/client'
import type {
  GenerateReportRequest,
  StudentReport,
  StudentReportListItem,
} from '@/types/report'

export async function generateReport(
  studentId: number,
  params: GenerateReportRequest
): Promise<StudentReport> {
  const { data } = await api.post<StudentReport>(
    `/students/${studentId}/reports/generate/`,
    params
  )
  return data
}

export async function getReport(reportId: number): Promise<StudentReport> {
  const { data } = await api.get<StudentReport>(`/reports/${reportId}/`)
  return data
}

export async function getStudentReports(
  studentId: number
): Promise<StudentReportListItem[]> {
  const { data } = await api.get<StudentReportListItem[]>(
    `/students/${studentId}/reports/`
  )
  return Array.isArray(data) ? data : []
}

export function getReportPdfUrl(reportId: number): string {
  // Returns full URL for opening in a new tab / download link
  const baseUrl = api.defaults.baseURL ?? '/api/v1'
  return `${baseUrl}/reports/${reportId}/pdf/`
}
```

---

## 3. Generate Report Modal

**File to create:** `src/components/reports/GenerateReportModal.vue`

### Wireframe

```
┌──────────────────────────────────────────────────┐
│  Generate AI Report                         [X]  │
│                                                  │
│  Student: Mukhtar Aitzhanov                      │
│  Class: 7B                                       │
│                                                  │
│  ── Report Period ─────────────────────────────   │
│  ( ) Full Year                                   │
│  (•) Quarter     [ Q3 ▾ ]                        │
│                                                  │
│  ── Report Language ───────────────────────────   │
│  ┌──────────┬──────────┬──────────┐              │
│  │ Русский  │ Қазақша  │ English  │              │
│  └──────────┴──────────┴──────────┘              │
│                                                  │
│  ⓘ Report generation takes 5-10 seconds.         │
│                                                  │
│  [Cancel]                [✨ Generate Report]     │
│                                                  │
└──────────────────────────────────────────────────┘

// While generating:
┌──────────────────────────────────────────────────┐
│  Generating Report...                            │
│                                                  │
│  ◌ Collecting student data...                    │
│  ◌ Analyzing grades and trends...                │
│  ◌ Building recommendations...                   │
│                                                  │
│  [Cancel]                      [⏳ Generating...]  │
└──────────────────────────────────────────────────┘

// On rate limit (429):
┌──────────────────────────────────────────────────┐
│  ⚠ Too many reports generated.                   │
│  Try again in 47 seconds.                        │
│                                                  │
│  [Cancel]            [Generate (47s)]            │
└──────────────────────────────────────────────────┘
```

### Props

```typescript
interface Props {
  studentId: number
  studentName: string
  classGroup: string
}
```

### Emits

```typescript
interface Emits {
  (e: 'close'): void
  (e: 'generated', report: StudentReport): void
}
```

### Behavior

1. **Default state:**
   - Period: "Full Year" selected by default.
   - Language: user's current locale (from `useI18n().locale.value`) selected.
   - Quarter dropdown: hidden when "Full Year" selected, shows Q1-Q4 when "Quarter" selected.

2. **On "Generate Report" click:**
   - Disable the button, show spinner + loading text.
   - Call `generateReport(studentId, { language, quarter })`.
   - **Success (200 or 201):** emit `'generated'` with the report, close modal.
   - **Error 429:** extract `Retry-After` header, start countdown timer. Disable button, show "Generate (Xs)" until timer reaches 0.
   - **Error 500:** show error message from `report.error_message` + a "Retry" button.
   - **Other errors:** show generic error toast (handled by global interceptor).

3. **Rate limit handling:**
   Use the `useRateLimitedAction` composable (from frontend main spec Phase 5.1) or implement inline:

   ```typescript
   const retryAfter = ref(0)
   const isRateLimited = computed(() => retryAfter.value > 0)
   let countdownInterval: ReturnType<typeof setInterval> | null = null

   function startCountdown(seconds: number) {
     retryAfter.value = seconds
     countdownInterval = setInterval(() => {
       retryAfter.value--
       if (retryAfter.value <= 0 && countdownInterval) {
         clearInterval(countdownInterval)
       }
     }, 1000)
   }

   // In the catch block:
   if (error.response?.status === 429) {
     const retry = parseInt(error.response.headers['retry-after'] ?? '60', 10)
     startCountdown(retry)
   }
   ```

---

## 4. Report Renderer

**File to create:** `src/components/reports/ReportView.vue`

### Props

```typescript
interface Props {
  reportData: ReportData
  studentName: string
  classGroup: string
  academicYear?: string
  quarterLabel?: string // "Q3" or "Full Year"
  generatedBy?: string
  generatedAt?: string
}
```

### Layout

The component renders a full report as a structured document. It is designed to be:
- Readable on-screen in the app.
- `@media print` friendly (hide app chrome, full-width sections).

**Section-by-section layout:**

```
┌──────────────────────────────────────────────────────┐
│  QADAM ANALYTICS — STUDENT REPORT                    │
│  {{ studentName }}  •  {{ classGroup }}               │
│  {{ quarterLabel }}  •  {{ academicYear }}            │
│  Generated: {{ generatedAt }} by {{ generatedBy }}   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─ Summary ──────────────────────────────────────┐  │
│  │ {{ summary }}                                  │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Overall Assessment ───────────────────────────┐  │
│  │ [ Badge: {{ score_label }} ]                   │  │
│  │ {{ description }}                              │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Academic Performance ─────────────────────────┐  │
│  │ {{ overview }}                                 │  │
│  │                                                │  │
│  │ ┌─ SubjectAnalysisCard per subject ──────────┐ │  │
│  │ │ Subject Name        85% (class avg: 72%)   │ │  │
│  │ │ [████████░░] student  [███████░░░] class    │ │  │
│  │ │ ↑ Improving                                │ │  │
│  │ │ Analysis text...                           │ │  │
│  │ │ 💡 Recommendation text...                  │ │  │
│  │ └───────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Strengths ────────────────────────────────────┐  │
│  │ ✓ {{ area }} — {{ description }}               │  │
│  │ ✓ {{ area }} — {{ description }}               │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Areas for Improvement ────────────────────────┐  │
│  │ △ {{ area }} — {{ description }}               │  │
│  │   → Action: {{ suggested_action }}             │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Psychological Profile ────────────────────────┐  │
│  │ {{ summary }}                                  │  │
│  │ Observations:                                  │  │
│  │   • {{ observation }}                          │  │
│  │ Recommendations:                               │  │
│  │   • {{ recommendation }}                       │  │
│  │                                                │  │
│  │ (If summary == "No data available", show       │  │
│  │  a muted "No psychological data recorded")     │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Extracurricular ─────────────────────────────┐   │
│  │ {{ summary }}                                 │   │
│  │   • {{ highlight }}                           │   │
│  │                                               │   │
│  │ (If empty, show muted placeholder)            │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ Recommendations ─────────────────────────────┐   │
│  │ For Teachers:                                 │   │
│  │   • {{ recommendation }}                      │   │
│  │ For Parents:                                  │   │
│  │   • {{ recommendation }}                      │   │
│  │ For Student:                                  │   │
│  │   • {{ recommendation }}                      │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ Conclusion ──────────────────────────────────┐   │
│  │ {{ conclusion }}                              │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Styling Rules

- **Cards:** Use existing project pattern — `rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900`
- **Section headers:** `text-lg font-semibold text-gray-900 dark:text-white`
- **Score label badge colors:**

  | Label | Background | Text |
  |-------|-----------|------|
  | Excellent | `bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400` |
  | Good | `bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400` |
  | Average | `bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400` |
  | Below Average | `bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400` |
  | Needs Attention | `bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400` |

- **Trend indicators:**

  | Trend | Icon | Color |
  |-------|------|-------|
  | improving | `↑` or Lucide `TrendingUp` | `text-success-600 dark:text-success-400` |
  | declining | `↓` or Lucide `TrendingDown` | `text-error-600 dark:text-error-400` |
  | stable | `→` or Lucide `Minus` | `text-gray-500 dark:text-gray-400` |

- **Grade progress bars:** Use the existing `gradeColor()` helper for the student bar. Class average bar is always `bg-gray-300 dark:bg-gray-600`.
- **Print styles:** Add `@media print` rules — hide `.no-print` elements, remove background colors, set `100%` width, add page breaks between major sections.

---

## 5. Subject Analysis Card

**File to create:** `src/components/reports/SubjectAnalysisCard.vue`

Extracted component used inside `ReportView.vue` — one per subject.

### Props

```typescript
import type { SubjectAnalysis } from '@/types/report'

interface Props {
  analysis: SubjectAnalysis
}
```

### Template structure

```vue
<template>
  <div class="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
    <!-- Header row: subject name + grade vs class avg -->
    <div class="flex items-center justify-between">
      <h4 class="font-medium text-gray-900 dark:text-white">
        {{ analysis.subject }}
      </h4>
      <div class="text-sm">
        <span :class="gradeColor(analysis.grade_percentage)" class="font-semibold">
          {{ analysis.grade_percentage }}%
        </span>
        <span class="text-gray-400 mx-1">vs</span>
        <span class="text-gray-500">
          {{ t('reports.classAverage') }}: {{ analysis.class_average }}%
        </span>
      </div>
    </div>

    <!-- Dual progress bars -->
    <div class="mt-3 space-y-1.5">
      <!-- Student grade bar -->
      <div class="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          class="h-2 rounded-full transition-all"
          :class="gradeBarColor(analysis.grade_percentage)"
          :style="{ width: `${Math.min(analysis.grade_percentage, 100)}%` }"
        />
      </div>
      <!-- Class average bar -->
      <div class="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          class="h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"
          :style="{ width: `${Math.min(analysis.class_average, 100)}%` }"
        />
      </div>
    </div>

    <!-- Trend indicator -->
    <div class="mt-2 flex items-center gap-1.5 text-sm" :class="trendColor(analysis.trend)">
      <component :is="trendIcon(analysis.trend)" class="h-4 w-4" />
      <span>{{ t(`reports.${analysis.trend}`) }}</span>
    </div>

    <!-- Analysis text -->
    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      {{ analysis.analysis }}
    </p>

    <!-- Recommendation -->
    <div class="mt-2 flex items-start gap-2 rounded-md bg-brand-50 p-2.5 text-sm dark:bg-brand-900/20">
      <LightbulbIcon class="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
      <span class="text-gray-700 dark:text-gray-300">{{ analysis.recommendation }}</span>
    </div>
  </div>
</template>
```

### Helper functions

```typescript
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'

function trendIcon(trend: string) {
  if (trend === 'improving') return TrendingUp
  if (trend === 'declining') return TrendingDown
  return Minus
}

function trendColor(trend: string): string {
  if (trend === 'improving') return 'text-success-600 dark:text-success-400'
  if (trend === 'declining') return 'text-error-600 dark:text-error-400'
  return 'text-gray-500 dark:text-gray-400'
}

// Reuse existing gradeColor from the project
function gradeBarColor(grade: number): string {
  if (grade > 80) return 'bg-success-500'
  if (grade > 60) return 'bg-warning-500'
  return 'bg-error-500'
}
```

---

## 6. Report History List

**File to create:** `src/components/reports/ReportHistoryList.vue`

Small component shown on the StudentDetail page — lists previously generated reports.

### Props

```typescript
interface Props {
  studentId: number
}
```

### Behavior

- On mount, call `getStudentReports(studentId)`.
- Render a compact list: date, quarter label, language flag, "View" link.
- If empty, show muted text: "No reports generated yet."
- Clicking a row navigates to `/reports/:id`.

### Template

```vue
<template>
  <div>
    <h3 class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ t('reports.history') }}
    </h3>

    <div v-if="reports.length === 0" class="text-sm text-gray-400">
      {{ t('reports.noReports') }}
    </div>

    <div v-else class="space-y-2">
      <router-link
        v-for="report in reports"
        :key="report.id"
        :to="`/reports/${report.id}`"
        class="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
      >
        <div class="flex items-center gap-2">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ report.quarter ? `Q${report.quarter}` : t('reports.fullYear') }}
          </span>
          <span class="text-xs text-gray-400 uppercase">{{ report.language }}</span>
        </div>
        <div class="flex items-center gap-2 text-gray-500">
          <span>{{ formatDate(report.created_at) }}</span>
          <ChevronRightIcon class="h-4 w-4" />
        </div>
      </router-link>
    </div>
  </div>
</template>
```

---

## 7. Integration into Student Detail Page

**File to modify:** `src/views/Students/StudentDetail.vue`

### Add the Generate Button

In the student detail header area (near the student's name/avatar), add a button visible only to admin and teacher roles:

```vue
<template>
  <!-- In the page header section, after the student name -->
  <div class="flex items-center gap-3">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
      {{ fullName }}
    </h1>

    <!-- AI Report Button — admin + teacher only -->
    <button
      v-if="canGenerateReport"
      class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
      @click="showReportModal = true"
    >
      <SparklesIcon class="h-4 w-4" />
      {{ t('reports.generate') }}
    </button>
  </div>

  <!-- Somewhere in the page body (below tabs or as a sidebar section) -->
  <ReportHistoryList :student-id="studentId" />

  <!-- Modal -->
  <GenerateReportModal
    v-if="showReportModal"
    :student-id="studentId"
    :student-name="fullName"
    :class-group="classGroup"
    @close="showReportModal = false"
    @generated="onReportGenerated"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Sparkles as SparklesIcon } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import GenerateReportModal from '@/components/reports/GenerateReportModal.vue'
import ReportHistoryList from '@/components/reports/ReportHistoryList.vue'
import type { StudentReport } from '@/types/report'

const router = useRouter()
const { user } = useAuth()

const showReportModal = ref(false)

const canGenerateReport = computed(() => {
  const role = user.value?.role
  return [
    'admin', 'teacher', 'homeroom_teacher', 'supervisor', 'principal'
  ].includes(role ?? '')
})

function onReportGenerated(report: StudentReport) {
  showReportModal.value = false
  router.push(`/reports/${report.id}`)
}
</script>
```

**Note to agent:** The exact placement depends on the current template structure. The button should be visually close to the student's name — not buried in a tab. The `ReportHistoryList` can go in a sidebar, below the tabs, or as a new 6th tab titled "AI Reports".

---

## 8. Report Page (Full View)

**File to create:** `src/views/Reports/ReportPage.vue`

This is the standalone page for viewing a generated report.

```vue
<template>
  <div class="mx-auto max-w-4xl px-4 py-6">
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full border-4 border-brand-500 border-t-transparent h-8 w-8" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="rounded-xl border border-error-200 bg-error-50 p-6 text-center dark:border-error-800 dark:bg-error-900/20">
      <p class="text-error-700 dark:text-error-400">{{ error }}</p>
      <button
        class="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600"
        @click="fetchReport"
      >
        {{ t('common.retry') }}
      </button>
    </div>

    <!-- Report -->
    <template v-else-if="report?.report_data">
      <!-- Action bar -->
      <div class="mb-6 flex items-center justify-between no-print">
        <button
          class="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          @click="router.back()"
        >
          <ArrowLeftIcon class="h-4 w-4" />
          {{ t('common.back') }}
        </button>

        <a
          :href="pdfUrl"
          target="_blank"
          class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          <DownloadIcon class="h-4 w-4" />
          {{ t('reports.downloadPdf') }}
        </a>
      </div>

      <!-- Report content -->
      <ReportView
        :report-data="report.report_data"
        :student-name="studentName"
        :class-group="classGroup"
        :academic-year="academicYear"
        :quarter-label="quarterLabel"
        :generated-by="report.generated_by_name ?? undefined"
        :generated-at="formatDateTime(report.created_at)"
      />

      <!-- Generation metadata (muted, below report) -->
      <div class="mt-6 flex items-center gap-4 text-xs text-gray-400 no-print">
        <span v-if="report.generation_time_ms">
          Generated in {{ (report.generation_time_ms / 1000).toFixed(1) }}s
        </span>
        <span v-if="report.tokens_used">
          {{ report.tokens_used.toLocaleString() }} tokens
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft as ArrowLeftIcon, Download as DownloadIcon } from 'lucide-vue-next'
import { getReport, getReportPdfUrl } from '@/api/reports'
import ReportView from '@/components/reports/ReportView.vue'
import type { StudentReport } from '@/types/report'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const report = ref<StudentReport | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const reportId = computed(() => Number(route.params.id))
const pdfUrl = computed(() => getReportPdfUrl(reportId.value))

// These come from the report data — agent: extract from the report's related objects.
// If the API response doesn't include student name directly, fetch the student detail
// or pass from the previous page via route state.
const studentName = computed(() => '—')  // Agent: resolve from report + student data
const classGroup = computed(() => '—')
const academicYear = computed(() => '—')
const quarterLabel = computed(() =>
  report.value?.quarter ? `Q${report.value.quarter}` : t('reports.fullYear')
)

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString()
}

async function fetchReport() {
  isLoading.value = true
  error.value = null
  try {
    report.value = await getReport(reportId.value)
    if (report.value.status === 'failed') {
      error.value = report.value.error_message || t('reports.failed')
    }
  } catch (e) {
    error.value = t('reports.failed')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchReport)
</script>
```

**Note to agent:** The `studentName`, `classGroup`, and `academicYear` computed values need data that isn't in the report API response directly. Two options:
1. **Preferred:** Pass them via `router.push({ path: '/reports/42', state: { studentName, classGroup, academicYear } })` from the generation modal / student detail page. Read from `history.state` on mount.
2. **Fallback:** Fetch the student detail in parallel: `getStudentDetail(report.student)`.

---

## 9. Route

**File to modify:** `src/router/index.ts`

Add this route to the authenticated routes:

```typescript
{
  path: '/reports/:id',
  name: 'report-detail',
  component: () => import('@/views/Reports/ReportPage.vue'),
  meta: {
    roles: ['admin', 'teacher', 'homeroom_teacher', 'supervisor', 'principal'],
  },
}
```

---

## 10. Locale Keys

Add the `"reports"` key group to **all 3 locale files**. Agent: translate `ru.json` and `kz.json` values appropriately.

**`src/locales/en.json`** (add inside the top-level object):

```json
{
  "reports": {
    "generate": "Generate AI Report",
    "generating": "Generating report...",
    "estimatedTime": "This usually takes 5-10 seconds",
    "title": "Student Report",
    "fullYear": "Full Year",
    "quarter": "Quarter",
    "reportPeriod": "Report Period",
    "reportLanguage": "Report Language",
    "downloadPdf": "Download PDF",
    "history": "Report History",
    "generatedBy": "Generated by",
    "retry": "Retry",
    "failed": "Report generation failed. Please try again.",
    "rateLimited": "Too many reports generated. Please wait.",
    "noReports": "No reports generated yet",
    "summary": "Summary",
    "overallAssessment": "Overall Assessment",
    "academicPerformance": "Academic Performance",
    "strengths": "Strengths",
    "areasForImprovement": "Areas for Improvement",
    "psychologicalProfile": "Psychological Profile",
    "extracurricular": "Extracurricular Activities",
    "recommendations": "Recommendations",
    "forTeachers": "For Teachers",
    "forParents": "For Parents",
    "forStudent": "For Student",
    "conclusion": "Conclusion",
    "classAverage": "Class avg",
    "improving": "Improving",
    "declining": "Declining",
    "stable": "Stable",
    "noDataAvailable": "No data recorded"
  }
}
```

**`src/locales/ru.json`:**

```json
{
  "reports": {
    "generate": "Создать ИИ-отчёт",
    "generating": "Генерация отчёта...",
    "estimatedTime": "Обычно это занимает 5-10 секунд",
    "title": "Отчёт об ученике",
    "fullYear": "Весь год",
    "quarter": "Четверть",
    "reportPeriod": "Период отчёта",
    "reportLanguage": "Язык отчёта",
    "downloadPdf": "Скачать PDF",
    "history": "История отчётов",
    "generatedBy": "Создал",
    "retry": "Повторить",
    "failed": "Не удалось создать отчёт. Попробуйте ещё раз.",
    "rateLimited": "Слишком много отчётов. Подождите.",
    "noReports": "Отчёты ещё не создавались",
    "summary": "Краткое описание",
    "overallAssessment": "Общая оценка",
    "academicPerformance": "Академическая успеваемость",
    "strengths": "Сильные стороны",
    "areasForImprovement": "Области для улучшения",
    "psychologicalProfile": "Психологический профиль",
    "extracurricular": "Внеклассная деятельность",
    "recommendations": "Рекомендации",
    "forTeachers": "Для учителей",
    "forParents": "Для родителей",
    "forStudent": "Для ученика",
    "conclusion": "Заключение",
    "classAverage": "Ср. по классу",
    "improving": "Улучшается",
    "declining": "Снижается",
    "stable": "Стабильно",
    "noDataAvailable": "Данные не записаны"
  }
}
```

**`src/locales/kz.json`:**

```json
{
  "reports": {
    "generate": "AI есеп жасау",
    "generating": "Есеп жасалуда...",
    "estimatedTime": "Бұл әдетте 5-10 секунд алады",
    "title": "Оқушы есебі",
    "fullYear": "Бүкіл жыл",
    "quarter": "Тоқсан",
    "reportPeriod": "Есеп кезеңі",
    "reportLanguage": "Есеп тілі",
    "downloadPdf": "PDF жүктеу",
    "history": "Есеп тарихы",
    "generatedBy": "Жасаған",
    "retry": "Қайталау",
    "failed": "Есепті жасау мүмкін болмады. Қайталап көріңіз.",
    "rateLimited": "Тым көп есеп жасалды. Күте тұрыңыз.",
    "noReports": "Есептер әлі жасалмаған",
    "summary": "Қысқаша сипаттама",
    "overallAssessment": "Жалпы баға",
    "academicPerformance": "Академиялық үлгерім",
    "strengths": "Күшті жақтары",
    "areasForImprovement": "Жақсарту бағыттары",
    "psychologicalProfile": "Психологиялық профиль",
    "extracurricular": "Сыныптан тыс іс-шаралар",
    "recommendations": "Ұсыныстар",
    "forTeachers": "Мұғалімдерге",
    "forParents": "Ата-аналарға",
    "forStudent": "Оқушыға",
    "conclusion": "Қорытынды",
    "classAverage": "Сынып орт.",
    "improving": "Жақсаруда",
    "declining": "Төмендеуде",
    "stable": "Тұрақты",
    "noDataAvailable": "Деректер жазылмаған"
  }
}
```

---

## 11. Tests

**File to create:** `src/components/reports/__tests__/ReportView.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReportView from '@/components/reports/ReportView.vue'
import type { ReportData } from '@/types/report'

const mockReport: ReportData = {
  summary: 'Student shows consistent academic growth across most subjects.',
  overall_assessment: {
    score_label: 'Good',
    description: 'Solid performance with room for improvement in humanities.',
  },
  academic_performance: {
    overview: 'Above average in STEM, average in humanities.',
    subject_analyses: [
      {
        subject: 'Mathematics',
        grade_percentage: 88,
        class_average: 72,
        trend: 'improving',
        analysis: 'Strong problem-solving skills. Excels in algebra.',
        recommendation: 'Introduce competition-level problems.',
      },
      {
        subject: 'History',
        grade_percentage: 62,
        class_average: 70,
        trend: 'declining',
        analysis: 'Struggles with essay-based assessments.',
        recommendation: 'Practice structured essay writing weekly.',
      },
    ],
  },
  strengths: [
    { area: 'Mathematics', description: 'Top 3 in class consistently.' },
    { area: 'Science', description: 'Active participation in experiments.' },
  ],
  areas_for_improvement: [
    {
      area: 'Written Communication',
      description: 'Essays lack structure and depth.',
      suggested_action: 'Write one 500-word essay per week with teacher feedback.',
    },
  ],
  psychological_profile: {
    summary: 'Generally positive outlook with mild test anxiety.',
    observations: ['Shows nervousness before exams', 'Good peer relationships'],
    recommendations: ['Introduce breathing exercises before tests'],
  },
  extracurricular: {
    summary: 'Active in chess club and reading program.',
    highlights: ['Chess club: 90% attendance', '12 books read this year'],
  },
  recommendations: {
    for_teachers: ['Challenge with advanced math problems', 'Provide essay templates'],
    for_parents: ['Encourage daily reading', 'Discuss school progress weekly'],
    for_student: ['Set a daily 30-min study routine', 'Ask for help in History'],
  },
  conclusion: 'A promising student with strong STEM aptitude. Focused effort on writing skills will round out an excellent academic profile.',
}

describe('ReportView', () => {
  const defaultProps = {
    reportData: mockReport,
    studentName: 'Mukhtar Aitzhanov',
    classGroup: '7B',
  }

  it('renders the student name and class', () => {
    const wrapper = mount(ReportView, { props: defaultProps })
    expect(wrapper.text()).toContain('Mukhtar Aitzhanov')
    expect(wrapper.text()).toContain('7B')
  })

  it('renders the summary section', () => {
    const wrapper = mount(ReportView, { props: defaultProps })
    expect(wrapper.text()).toContain('consistent academic growth')
  })

  it('renders the overall assessment badge', () => {
    const wrapper = mount(ReportView, { props: defaultProps })
    expect(wrapper.text()).toContain('Good')
  })

  it('renders all subject analysis cards', () => {
    const wrapper = mount(ReportView, { props: defaultProps })
    expect(wrapper.text()).toContain('Mathematics')
    expect(wrapper.text()).toContain('88')
    expect(wrapper.text()).toContain('History')
    expect(wrapper.text()).toContain('62')
  })

  it('shows improving trend for Mathematics', () => {
    const wrapper = mount(ReportView, { props: defaultProps })
    // Agent: adjust selector based on actual implementation
    const mathCard = wrapper.findAll('[data-testid="subject-card"]')[0]
    expect(mathCard?.text()).toContain('Improving')
  })

  it('shows declining trend for History', () => {
    const wrapper = mount(ReportView, { props: defaultProps })
    const historyCard = wrapper.findAll('[data-testid="subject-card"]')[1]
    expect(historyCard?.text()).toContain('Declining')
  })

  it('renders strengths', () => {
    const wrapper = mount(ReportView, { props: defaultProps })
    expect(wrapper.text()).toContain('Top 3 in class')
  })

  it('renders areas for improvement with actions', () => {
    const wrapper = mount(ReportView, { props: defaultProps })
    expect(wrapper.text()).toContain('Written Communication')
    expect(wrapper.text()).toContain('500-word essay per week')
  })

  it('renders psychological profile', () => {
    const wrapper = mount(ReportView, { props: defaultProps })
    expect(wrapper.text()).toContain('mild test anxiety')
    expect(wrapper.text()).toContain('breathing exercises')
  })

  it('renders extracurricular highlights', () => {
    const wrapper = mount(ReportView, { props: defaultProps })
    expect(wrapper.text()).toContain('chess club')
    expect(wrapper.text()).toContain('12 books')
  })

  it('renders all three recommendation groups', () => {
    const wrapper = mount(ReportView, { props: defaultProps })
    expect(wrapper.text()).toContain('advanced math problems')
    expect(wrapper.text()).toContain('daily reading')
    expect(wrapper.text()).toContain('30-min study routine')
  })

  it('renders the conclusion', () => {
    const wrapper = mount(ReportView, { props: defaultProps })
    expect(wrapper.text()).toContain('strong STEM aptitude')
  })

  it('handles empty psychological data gracefully', () => {
    const report = {
      ...mockReport,
      psychological_profile: {
        summary: 'No data available',
        observations: [],
        recommendations: [],
      },
    }
    const wrapper = mount(ReportView, { props: { ...defaultProps, reportData: report } })
    expect(wrapper.text()).toContain('No data')
    // Should not render empty observation/recommendation lists
  })

  it('handles empty extracurricular data gracefully', () => {
    const report = {
      ...mockReport,
      extracurricular: {
        summary: 'No extracurricular data recorded',
        highlights: [],
      },
    }
    const wrapper = mount(ReportView, { props: { ...defaultProps, reportData: report } })
    expect(wrapper.text()).toContain('No extracurricular data')
  })
})
```

**File to create:** `src/api/__tests__/reports.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateReport, getReport, getStudentReports, getReportPdfUrl } from '@/api/reports'

// Mock the api client
vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: { baseURL: '/api/v1' },
  },
}))

import api from '@/api/client'

describe('reports API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generateReport posts correct payload', async () => {
    const mockResponse = { data: { id: 1, status: 'completed' } }
    vi.mocked(api.post).mockResolvedValue(mockResponse)

    const result = await generateReport(15, { language: 'ru', quarter: 3 })

    expect(api.post).toHaveBeenCalledWith(
      '/students/15/reports/generate/',
      { language: 'ru', quarter: 3 }
    )
    expect(result.id).toBe(1)
  })

  it('getReport fetches by ID', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { id: 42 } })

    const result = await getReport(42)

    expect(api.get).toHaveBeenCalledWith('/reports/42/')
    expect(result.id).toBe(42)
  })

  it('getStudentReports returns array', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] })

    const result = await getStudentReports(15)

    expect(result).toHaveLength(2)
  })

  it('getStudentReports handles empty response', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] })

    const result = await getStudentReports(15)

    expect(result).toEqual([])
  })

  it('getReportPdfUrl returns correct URL', () => {
    const url = getReportPdfUrl(42)
    expect(url).toBe('/api/v1/reports/42/pdf/')
  })
})
```

---

## Execution Order

```
Batch 1 — Data layer:
  ├── 1.  Types (report.ts)
  └── 2.  API module (reports.ts)

Batch 2 — Components:
  ├── 5.  SubjectAnalysisCard.vue
  ├── 4.  ReportView.vue (uses SubjectAnalysisCard)
  ├── 3.  GenerateReportModal.vue
  └── 6.  ReportHistoryList.vue

Batch 3 — Pages & routing:
  ├── 8.  ReportPage.vue
  ├── 9.  Route registration
  └── 7.  StudentDetail.vue integration

Batch 4 — Polish:
  ├── 10. Locale keys (all 3 languages)
  └── 11. Tests
```
