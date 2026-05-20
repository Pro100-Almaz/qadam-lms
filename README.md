# Qadam LMS

Learning Management System for schools in Kazakhstan. Supports multiple user roles (admin, teacher, student, parent), lesson management, grading, student tracking, and AI-powered report generation.

## Tech Stack

- **Vue 3.5** + TypeScript + Composition API (`<script setup>`)
- **Vite 6** build system
- **Tailwind CSS 4** with dark mode
- **Vue Router 4** with role-based guards
- **Pinia** for state management
- **vue-i18n 11** — Russian, Kazakh, English
- **Axios** with JWT auth (access + refresh tokens)
- **ApexCharts** for data visualization
- **FullCalendar** for scheduling

## Getting Started

### Prerequisites

- Node.js 18+ (recommended 20+)
- Backend API running at the configured `VITE_API_BASE_URL`

### Setup

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1/
```

For production (`.env.production`):

```env
VITE_API_BASE_URL=https://api.qadam.edu.kz/api/v1
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Other Commands

```bash
npm run preview       # Preview production build
npm run lint          # ESLint with auto-fix
npm run format        # Prettier formatting
npm run type-check    # TypeScript type checking
```

## Project Structure

```
src/
├── api/              # Axios API modules (auth, lessons, grading, reports, etc.)
├── assets/           # Static assets and global CSS
├── components/       # Reusable UI components
│   ├── layout/       # AdminLayout, Sidebar, Header
│   ├── ui/           # Button, Modal, Badge, Alert, Pagination, Toast
│   ├── reports/      # Report generation modal, history list
│   └── ...
├── composables/      # Vue composables (useAuth, useRoleAccess, useToast, etc.)
├── locales/          # i18n translation files (en, ru, kz)
├── router/           # Route definitions with role-based access control
├── stores/           # Pinia stores (auth)
├── types/            # TypeScript interfaces for all domain models
└── views/            # Page components organized by feature
    ├── Auth/         # Sign in, sign up, password reset
    ├── Subjects/     # Subject management (active, processing, archived)
    ├── Lessons/      # Lesson list, detail, grading
    ├── Students/     # Student list and detail (grades, achievements, clubs, reports)
    ├── Teachers/     # Teacher list and detail
    ├── Teacher/      # Teacher dashboard, workload, psych tracking
    ├── Personal/     # Self-service pages (my subjects, my children, etc.)
    ├── Reports/      # AI report viewer page
    └── Others/       # Profile, calendar
```

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full system access, user registration |
| `supervisor` | Staff-level access, user registration |
| `principal` | Staff-level access, user registration |
| `teacher` | Lessons, grading, student management |
| `homeroom_teacher` | Same as teacher + homeroom features |
| `student` | View own subjects, grades, classmates |
| `parent` | View children's progress, reports |

## Key Features

**Lesson & Subject Management** — Create and manage subjects with status workflow (active/processing/archived). Plan lessons with topics, subtopics, and grading weights.

**Grading System** — Grade students per topic with weighted scoring. Teachers see class-level and per-student breakdowns.

**Student Tracking** — Achievements, reading logs, club participation with file attachments. Psychological state monitoring for counselors.

**AI Reports** — Generate AI-powered student performance reports per quarter. Async generation via Celery (POST returns 202, poll until complete). Reports split data into `report_data` (AI text analysis) and `input_snapshot` (database numbers). PDF download with JWT auth.

**Parent Portal** — Parents view their children's grades, achievements, and AI reports in read-only mode.

**Teacher Dashboard** — Workload overview, class statistics, upcoming lessons.

**Multi-language** — Full interface in Russian, Kazakh, and English. Language persisted in localStorage.

**Dark Mode** — System-wide dark mode via Tailwind. AI report page has independent theme toggle.

## API Integration

All API calls go through `src/api/client.ts` which configures:

- Base URL from `VITE_API_BASE_URL` environment variable
- Bearer token auth via request interceptor
- Automatic token refresh on 401 responses
- Global error handling with toast notifications

API modules export typed async functions. Paginated responses are handled via `unwrapList()` and `unwrapPaginated()` helpers.

## Deployment

The project is deployed on **Vercel**. Vite embeds environment variables at build time, so `.env.production` must be set before building (or configure env vars in Vercel dashboard).

