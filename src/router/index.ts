import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

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
      path: '/error-404',
      name: '404 Error',
      component: () => import('../views/Errors/FourZeroFour.vue'),
      meta: { title: '404', guest: true },
    },

    // Protected routes — Subjects
    {
      path: '/subjects/active',
      name: 'SubjectsActive',
      component: () => import('../views/Subjects/SubjectsActive.vue'),
      meta: { title: 'Subjects — Active' },
    },
    {
      path: '/subjects/processing',
      name: 'SubjectsProcessing',
      component: () => import('../views/Subjects/SubjectsProcessing.vue'),
      meta: { title: 'Subjects — Processing' },
    },
    {
      path: '/subjects/archived',
      name: 'SubjectsArchived',
      component: () => import('../views/Subjects/SubjectsArchived.vue'),
      meta: { title: 'Subjects — Archived' },
    },

    // Lessons
    {
      path: '/lessons',
      name: 'Lessons',
      component: () => import('../views/Lessons/LessonsList.vue'),
      meta: { title: 'Lessons' },
    },

    // Teachers
    {
      path: '/teachers',
      name: 'Teachers',
      component: () => import('../views/Teachers/TeachersList.vue'),
      meta: { title: 'Teachers' },
    },

    // Students
    {
      path: '/students',
      name: 'Students',
      component: () => import('../views/Students/StudentsList.vue'),
      meta: { title: 'Students' },
    },

    // Personal
    {
      path: '/my-student',
      name: 'MyStudent',
      component: () => import('../views/Personal/MyStudent.vue'),
      meta: { title: 'My Student' },
    },
    {
      path: '/my-class',
      name: 'MyClass',
      component: () => import('../views/Personal/MyClass.vue'),
      meta: { title: 'My Class' },
    },
    {
      path: '/my-lessons',
      name: 'MyLessons',
      component: () => import('../views/Personal/MyLessons.vue'),
      meta: { title: 'My Lessons' },
    },

    // Fallback
    {
      path: '/',
      redirect: '/subjects/active',
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/error-404',
    },
  ],
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title ?? 'Qadam'} | Qadam LMS`

  const { isAuthenticated } = useAuth()

  if (to.meta.guest) {
    if (isAuthenticated.value && (to.name === 'Signin' || to.name === 'Signup')) {
      return next('/subjects/active')
    }
    return next()
  }

  if (!isAuthenticated.value) {
    return next('/signin')
  }

  next()
})

export default router
