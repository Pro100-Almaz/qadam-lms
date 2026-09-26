import { createRouter, createWebHistory } from 'vue-router'
import type { UserRole } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'
import i18n from '@/i18n'

declare module 'vue-router' {
  interface RouteMeta {
    /** i18n key resolved into the browser tab title — e.g. `'nav.students'`. */
    titleKey?: string
    guest?: boolean
    roles?: UserRole[]
  }
}

const staffRoles: UserRole[] = ['admin', 'teacher', 'homeroom_teacher', 'supervisor', 'principal', 'psychologist']
const adminRoles: UserRole[] = ['admin', 'supervisor', 'principal']
const clubRoles: UserRole[] = ['clubmanager']
const teacherRoles: UserRole[] = ['teacher', 'homeroom_teacher']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    // Public routes
    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/Auth/Signin.vue'),
      meta: { titleKey: 'auth.signIn', guest: true },
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('../views/Auth/ForgotPassword.vue'),
      meta: { titleKey: 'auth.forgotPasswordTitle', guest: true },
    },
    {
      path: '/verify-code',
      name: 'VerifyCode',
      component: () => import('../views/Auth/VerifyCode.vue'),
      meta: { titleKey: 'auth.verifyCodeTitle', guest: true },
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('../views/Auth/ResetPassword.vue'),
      meta: { titleKey: 'auth.resetPasswordTitle', guest: true },
    },
    {
      path: '/error-404',
      name: '404 Error',
      component: () => import('../views/Errors/FourZeroFour.vue'),
      meta: { titleKey: 'pageTitles.notFound', guest: true },
    },

    // Protected routes — Subjects (staff only)
    {
      path: '/subjects/active',
      name: 'SubjectsActive',
      component: () => import('../views/Subjects/SubjectsActive.vue'),
      meta: { titleKey: 'pageTitles.subjectsActive', roles: [...adminRoles, ...teacherRoles] },
    },
    {
      path: '/subjects/processing',
      name: 'SubjectsProcessing',
      component: () => import('../views/Subjects/SubjectsProcessing.vue'),
      meta: { titleKey: 'pageTitles.subjectsProcessing', roles: staffRoles },
    },
    {
      path: '/subjects/archived',
      name: 'SubjectsArchived',
      component: () => import('../views/Subjects/SubjectsArchived.vue'),
      meta: { titleKey: 'pageTitles.subjectsArchived', roles: staffRoles },
    },
    {
      path: '/subjects/:id',
      name: 'SubjectDetail',
      component: () => import('../views/Subjects/SubjectDetail.vue'),
      meta: { titleKey: 'pageTitles.subjectDetail', roles: staffRoles },
    },

    // Lessons / Calendar (staff only — students and parents get /timetable)
    {
      path: '/lessons',
      name: 'Lessons',
      component: () => import('../views/Lessons/LessonsList.vue'),
      meta: { titleKey: 'nav.lessonCalendar', roles: [...staffRoles, 'clubmanager'] },
    },
    {
      path: '/lessons/:id',
      name: 'LessonDetail',
      component: () => import('../views/Lessons/LessonDetail.vue'),
      meta: { titleKey: 'lessons.lessonDetail', roles: staffRoles },
    },
    {
      path: '/lessons/:id/grading',
      name: 'LessonGrading',
      component: () => import('../views/Lessons/LessonGrading.vue'),
      meta: { titleKey: 'grading.title', roles: staffRoles },
    },

    // Weekly timetable — everyone sees their own; staff pick a class group.
    {
      path: '/timetable',
      name: 'Timetable',
      component: () => import('../views/Schedule/WeekTimetable.vue'),
      meta: { titleKey: 'nav.timetable' },
    },

    // Schedule builder (admins; homeroom teachers for their class's free entries)
    {
      path: '/schedule-builder',
      name: 'ScheduleBuilder',
      component: () => import('../views/Schedule/ScheduleBuilder.vue'),
      meta: { titleKey: 'nav.scheduleBuilder', roles: [...adminRoles, 'homeroom_teacher'] },
    },

    // Attendance (teachers & homeroom teachers)
    {
      path: '/attendance',
      name: 'Attendance',
      component: () => import('../views/Attendance/AttendanceSheet.vue'),
      meta: { titleKey: 'nav.attendance', roles: ['teacher', 'homeroom_teacher'] },
    },

    // Homeworks — a teacher's own tasks; not a school-wide view, so staff are out
    {
      path: '/homeworks',
      name: 'Homeworks',
      component: () => import('../views/Homeworks/HomeworksList.vue'),
      meta: { titleKey: 'nav.homeworks', roles: teacherRoles },
    },
    {
      path: '/homeworks/create',
      name: 'CreateHomework',
      component: () => import('../views/Homeworks/HomeworkForm.vue'),
      meta: { titleKey: 'homeworks.createTitle', roles: teacherRoles },
    },
    {
      path: '/homeworks/:id/edit',
      name: 'EditHomework',
      component: () => import('../views/Homeworks/HomeworkForm.vue'),
      meta: { titleKey: 'homeworks.editTitle', roles: teacherRoles },
    },

    // Grading — a teacher's graded assignments; writes are offering-scoped
    {
      path: '/grading',
      name: 'Grading',
      component: () => import('../views/Grading/AssignmentsList.vue'),
      meta: { titleKey: 'assignments.title', roles: teacherRoles },
    },

    // Teachers (staff only)
    {
      path: '/teachers',
      name: 'Teachers',
      component: () => import('../views/Teachers/TeachersList.vue'),
      meta: { titleKey: 'nav.teachers', roles: staffRoles },
    },
    {
      path: '/teachers/:userId',
      name: 'TeacherDetail',
      component: () => import('../views/Teachers/TeacherDetail.vue'),
      meta: { titleKey: 'pageTitles.teacherDetail', roles: staffRoles },
    },

    // Students (staff only)
    {
      path: '/students',
      name: 'Students',
      component: () => import('../views/Students/StudentsList.vue'),
      meta: { titleKey: 'nav.students', roles: staffRoles },
    },
    {
      path: '/students/:userId',
      name: 'StudentDetail',
      component: () => import('../views/Students/StudentDetail.vue'),
      meta: { titleKey: 'pageTitles.studentDetail', roles: staffRoles },
    },
    {
      path: '/students/:studentId/clubs/:clubId',
      name: 'StudentClubDetail',
      component: () => import('../views/Students/StudentClubDetail.vue'),
      meta: { titleKey: 'pageTitles.studentClubDetail', roles: [...staffRoles, 'student', 'parent'] },
    },

    // Register (admin only)
    {
      path: '/register',
      name: 'RegisterUser',
      component: () => import('../views/Auth/RegisterUser.vue'),
      meta: { titleKey: 'auth.registerUser', roles: adminRoles },
    },

    // Club management
    {
      path: '/clubs',
      name: 'Clubs',
      component: () => import('../views/Clubs/ClubsList.vue'),
      meta: { titleKey: 'nav.clubs', roles: clubRoles },
    },
    {
      path: '/clubs/create',
      name: 'CreateClub',
      component: () => import('../views/Clubs/CreateClub.vue'),
      meta: { titleKey: 'clubs.createTitle', roles: clubRoles },
    },
    {
      path: '/clubs/:id/edit',
      name: 'EditClub',
      component: () => import('../views/Clubs/CreateClub.vue'),
      meta: { titleKey: 'clubs.editTitle', roles: clubRoles },
    },
    {
      path: '/clubs/:id/attendance',
      name: 'ClubAttendance',
      component: () => import('../views/Clubs/ClubAttendance.vue'),
      meta: { titleKey: 'clubs.attendanceTitle', roles: clubRoles },
    },
    {
      path: '/clubs/:id',
      name: 'ClubDetail',
      component: () => import('../views/Clubs/ClubDetail.vue'),
      meta: { titleKey: 'pageTitles.clubDetail', roles: clubRoles },
    },

    // Profile (all authenticated users)
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/Others/UserProfile.vue'),
      meta: { titleKey: 'nav.profile' },
    },

    // Student self-service pages
    {
      path: '/my-subjects',
      name: 'MySubjects',
      component: () => import('../views/Personal/MySubjects.vue'),
      meta: { titleKey: 'nav.mySubjects', roles: ['student'] },
    },
    {
      path: '/my-homeworks',
      name: 'MyHomeworks',
      component: () => import('../views/Personal/MyHomeworks.vue'),
      meta: { titleKey: 'nav.myHomeworks', roles: ['student'] },
    },
    {
      path: '/my-teachers',
      name: 'MyTeachers',
      component: () => import('../views/Personal/MyTeachers.vue'),
      meta: { titleKey: 'nav.myTeachers', roles: ['student'] },
    },
    {
      path: '/my-classmates',
      name: 'MyClassmates',
      component: () => import('../views/Personal/MyClassmates.vue'),
      meta: { titleKey: 'nav.myClassmates', roles: ['student'] },
    },

    // Parent self-service pages
    {
      path: '/my-children',
      name: 'MyChildren',
      component: () => import('../views/Personal/MyChildren.vue'),
      meta: { titleKey: 'nav.myChildren', roles: ['parent'] },
    },
    {
      path: '/my-children/:id',
      name: 'MyChildDetail',
      component: () => import('../views/Personal/MyChildDetail.vue'),
      meta: { titleKey: 'pageTitles.childDetail', roles: ['parent'] },
    },
    {
      path: '/my-children/:childId/subjects/:subjectId',
      name: 'MyChildSubjectDetail',
      component: () => import('../views/Personal/MyChildSubjectDetail.vue'),
      meta: { titleKey: 'pageTitles.childSubjectDetail', roles: ['parent'] },
    },
    {
      path: '/parent-teachers',
      name: 'ParentTeachers',
      component: () => import('../views/Personal/ParentTeachers.vue'),
      meta: { titleKey: 'nav.myTeachers', roles: ['parent'] },
    },

    // Teacher dashboard & sub-pages
    {
      path: '/teacher',
      name: 'TeacherDashboard',
      component: () => import('../views/Teacher/TeacherDashboard.vue'),
      meta: { titleKey: 'nav.teacherDashboard', roles: staffRoles },
    },
    {
      path: '/teacher/workload',
      name: 'TeacherWorkload',
      component: () => import('../views/Teacher/TeacherWorkload.vue'),
      meta: { titleKey: 'nav.workload', roles: staffRoles },
    },
    {
      path: '/teacher/psychologist/:studentId',
      name: 'PsychStudentDetail',
      component: () => import('../views/Teacher/PsychStudentDetail.vue'),
      meta: { titleKey: 'pageTitles.psychStudentDetail', roles: staffRoles },
    },

    // AI Reports
    {
      path: '/reports/:id',
      name: 'ReportDetail',
      component: () => import('../views/Reports/ReportPage.vue'),
      meta: { titleKey: 'reports.title', roles: [...staffRoles, 'parent'] },
    },

    // Personal (staff)
    {
      path: '/my-student',
      name: 'MyStudent',
      component: () => import('../views/Personal/MyStudent.vue'),
      meta: { titleKey: 'nav.myStudent', roles: [...staffRoles, 'parent'] },
    },
    {
      path: '/my-class',
      name: 'MyClass',
      component: () => import('../views/Personal/MyClass.vue'),
      meta: { titleKey: 'nav.myClass', roles: staffRoles },
    },
    {
      path: '/my-lessons',
      name: 'MyLessons',
      component: () => import('../views/Personal/MyLessons.vue'),
      meta: { titleKey: 'nav.myLessons', roles: staffRoles },
    },

    // Fallback — redirect handled in beforeEach based on role
    {
      path: '/',
      name: 'Home',
      redirect: '/subjects/active',
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/error-404',
    },
  ],
})

function getDefaultRoute(roles: UserRole[]): string {
  if (roles.length === 0) return '/'
  if (roles.includes('student')) return '/my-subjects'
  if (roles.includes('parent')) return '/my-children'
  if (roles.includes('clubmanager')) return '/clubs'
  if (roles.includes('psychologist')) return '/students'
  return '/subjects/active'
}

/** `titleKey` resolved in the current locale, suffixed with the app name. */
function resolvePageTitle(titleKey?: string): string {
  const { t } = i18n.global
  const appName = t('app.name')
  return titleKey ? `${t(titleKey)} | ${appName}` : appName
}

/**
 * Re-applies the current route's title in the browser tab — called by
 * `setLocale` (see `src/i18n/index.ts`) so a language switch updates the tab
 * without a navigation.
 */
export function refreshDocumentTitle() {
  document.title = resolvePageTitle(router.currentRoute.value.meta.titleKey)
}

router.beforeEach(async (to, from, next) => {
  document.title = resolvePageTitle(to.meta.titleKey)

  const authStore = useAuthStore()

  if (authStore.isSessionLoading){
    await authStore.initSession()
  }

  const isAuthenticated = authStore.isAuthenticated
  const roles = authStore.user?.roles || []

  if (to.meta.guest) {
    if (isAuthenticated && to.name === 'Signin') {
      return next(getDefaultRoute(roles))
    }
    return next()
  }

  if (!isAuthenticated) {
    return next('/signin')
  }

  // Role-based home redirect
  if (to.name === 'Home') {
    return next(getDefaultRoute(roles))
  }

  // Role-based route guard
  if (to.meta.roles && roles && !to.meta.roles.some((role) => roles.includes(role))) {
    return next(getDefaultRoute(roles))
  }

  next()
})

export default router
