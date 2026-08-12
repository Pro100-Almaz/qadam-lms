import { createRouter, createWebHistory } from 'vue-router'
import type { UserRole } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
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
      meta: { title: 'Sign In', guest: true },
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('../views/Auth/Signup.vue'),
      meta: { title: 'Sign Up', guest: true },
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('../views/Auth/ForgotPassword.vue'),
      meta: { title: 'Forgot Password', guest: true },
    },
    {
      path: '/verify-code',
      name: 'VerifyCode',
      component: () => import('../views/Auth/VerifyCode.vue'),
      meta: { title: 'Verify Code', guest: true },
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('../views/Auth/ResetPassword.vue'),
      meta: { title: 'Reset Password', guest: true },
    },
    {
      path: '/error-404',
      name: '404 Error',
      component: () => import('../views/Errors/FourZeroFour.vue'),
      meta: { title: '404', guest: true },
    },

    // Protected routes — Subjects (staff only)
    {
      path: '/subjects/active',
      name: 'SubjectsActive',
      component: () => import('../views/Subjects/SubjectsActive.vue'),
      meta: { title: 'Subjects — Active', roles: [...adminRoles, ...teacherRoles] },
    },
    {
      path: '/subjects/processing',
      name: 'SubjectsProcessing',
      component: () => import('../views/Subjects/SubjectsProcessing.vue'),
      meta: { title: 'Subjects — Processing', roles: staffRoles },
    },
    {
      path: '/subjects/archived',
      name: 'SubjectsArchived',
      component: () => import('../views/Subjects/SubjectsArchived.vue'),
      meta: { title: 'Subjects — Archived', roles: staffRoles },
    },
    {
      path: '/subjects/:id',
      name: 'SubjectDetail',
      component: () => import('../views/Subjects/SubjectDetail.vue'),
      meta: { title: 'Subject Detail', roles: staffRoles },
    },

    // Lessons / Calendar (all authenticated users)
    {
      path: '/lessons',
      name: 'Lessons',
      component: () => import('../views/Lessons/LessonsList.vue'),
      meta: { title: 'Lessons' },
    },
    {
      path: '/lessons/:id',
      name: 'LessonDetail',
      component: () => import('../views/Lessons/LessonDetail.vue'),
      meta: { title: 'Lesson Detail', roles: staffRoles },
    },
    {
      path: '/lessons/:id/grading',
      name: 'LessonGrading',
      component: () => import('../views/Lessons/LessonGrading.vue'),
      meta: { title: 'Lesson Grading', roles: staffRoles },
    },

    // Teachers (staff only)
    {
      path: '/teachers',
      name: 'Teachers',
      component: () => import('../views/Teachers/TeachersList.vue'),
      meta: { title: 'Teachers', roles: staffRoles },
    },
    {
      path: '/teachers/:userId',
      name: 'TeacherDetail',
      component: () => import('../views/Teachers/TeacherDetail.vue'),
      meta: { title: 'Teacher Detail', roles: staffRoles },
    },

    // Students (staff only)
    {
      path: '/students',
      name: 'Students',
      component: () => import('../views/Students/StudentsList.vue'),
      meta: { title: 'Students', roles: staffRoles },
    },
    {
      path: '/students/:userId',
      name: 'StudentDetail',
      component: () => import('../views/Students/StudentDetail.vue'),
      meta: { title: 'Student Detail', roles: staffRoles },
    },
    {
      path: '/students/:studentId/clubs/:clubId',
      name: 'StudentClubDetail',
      component: () => import('../views/Students/StudentClubDetail.vue'),
      meta: { title: 'Student Club Detail', roles: [...staffRoles, 'student', 'parent'] },
    },

    // Register (admin only)
    {
      path: '/register',
      name: 'RegisterUser',
      component: () => import('../views/Auth/RegisterUser.vue'),
      meta: { title: 'Register User', roles: adminRoles },
    },

    // Club management
    {
      path: '/clubs',
      name: 'Clubs',
      component: () => import('../views/Clubs/ClubsList.vue'),
      meta: { title: 'Clubs', roles: clubRoles },
    },
    {
      path: '/clubs/create',
      name: 'CreateClub',
      component: () => import('../views/Clubs/CreateClub.vue'),
      meta: { title: 'Create Club', roles: clubRoles },
    },
    {
      path: '/clubs/:id/edit',
      name: 'EditClub',
      component: () => import('../views/Clubs/CreateClub.vue'),
      meta: { title: 'Edit Club', roles: clubRoles },
    },
    {
      path: '/clubs/:id/attendance',
      name: 'ClubAttendance',
      component: () => import('../views/Clubs/ClubAttendance.vue'),
      meta: { title: 'Club Attendance', roles: clubRoles },
    },
    {
      path: '/clubs/:id',
      name: 'ClubDetail',
      component: () => import('../views/Clubs/ClubDetail.vue'),
      meta: { title: 'Club Detail', roles: clubRoles },
    },

    // Profile (all authenticated users)
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/Others/UserProfile.vue'),
      meta: { title: 'Profile' },
    },

    // Student self-service pages
    {
      path: '/my-subjects',
      name: 'MySubjects',
      component: () => import('../views/Personal/MySubjects.vue'),
      meta: { title: 'My Subjects', roles: ['student'] },
    },
    {
      path: '/my-teachers',
      name: 'MyTeachers',
      component: () => import('../views/Personal/MyTeachers.vue'),
      meta: { title: 'My Teachers', roles: ['student'] },
    },
    {
      path: '/my-classmates',
      name: 'MyClassmates',
      component: () => import('../views/Personal/MyClassmates.vue'),
      meta: { title: 'My Classmates', roles: ['student'] },
    },

    // Parent self-service pages
    {
      path: '/my-children',
      name: 'MyChildren',
      component: () => import('../views/Personal/MyChildren.vue'),
      meta: { title: 'My Children', roles: ['parent'] },
    },
    {
      path: '/my-children/:id',
      name: 'MyChildDetail',
      component: () => import('../views/Personal/MyChildDetail.vue'),
      meta: { title: 'Child Detail', roles: ['parent'] },
    },
    {
      path: '/my-children/:childId/subjects/:subjectId',
      name: 'MyChildSubjectDetail',
      component: () => import('../views/Personal/MyChildSubjectDetail.vue'),
      meta: { title: 'Child Subject Detail', roles: ['parent'] },
    },
    {
      path: '/parent-teachers',
      name: 'ParentTeachers',
      component: () => import('../views/Personal/ParentTeachers.vue'),
      meta: { title: 'My Teachers', roles: ['parent'] },
    },

    // Teacher dashboard & sub-pages
    {
      path: '/teacher',
      name: 'TeacherDashboard',
      component: () => import('../views/Teacher/TeacherDashboard.vue'),
      meta: { title: 'Teacher Dashboard', roles: staffRoles },
    },
    {
      path: '/teacher/workload',
      name: 'TeacherWorkload',
      component: () => import('../views/Teacher/TeacherWorkload.vue'),
      meta: { title: 'Teacher Workload', roles: staffRoles },
    },
    {
      path: '/teacher/psychologist/:studentId',
      name: 'PsychStudentDetail',
      component: () => import('../views/Teacher/PsychStudentDetail.vue'),
      meta: { title: 'Student Psych Detail', roles: staffRoles },
    },

    // AI Reports
    {
      path: '/reports/:id',
      name: 'ReportDetail',
      component: () => import('../views/Reports/ReportPage.vue'),
      meta: { title: 'AI Report', roles: [...staffRoles, 'parent'] },
    },

    // Personal (staff)
    {
      path: '/my-student',
      name: 'MyStudent',
      component: () => import('../views/Personal/MyStudent.vue'),
      meta: { title: 'My Student', roles: [...staffRoles, 'parent'] },
    },
    {
      path: '/my-class',
      name: 'MyClass',
      component: () => import('../views/Personal/MyClass.vue'),
      meta: { title: 'My Class', roles: staffRoles },
    },
    {
      path: '/my-lessons',
      name: 'MyLessons',
      component: () => import('../views/Personal/MyLessons.vue'),
      meta: { title: 'My Lessons', roles: staffRoles },
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

router.beforeEach(async (to, from, next) => {
  document.title = `${to.meta.title ?? 'Qadam'} | Qadam LMS`

  const authStore = useAuthStore()

  if (authStore.isSessionLoading){
    await authStore.initSession()
  }

  const isAuthenticated = authStore.isAuthenticated
  const roles = authStore.user?.roles || []

  if (to.meta.guest) {
    if (isAuthenticated && (to.name === 'Signin' || to.name === 'Signup')) {
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
