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

    // Protected routes
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('../views/Ecommerce.vue'),
      meta: { title: 'Dashboard' },
    },
    {
      path: '/calendar',
      name: 'Calendar',
      component: () => import('../views/Others/Calendar.vue'),
      meta: { title: 'Calendar' },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/Others/UserProfile.vue'),
      meta: { title: 'Profile' },
    },
    {
      path: '/form-elements',
      name: 'Form Elements',
      component: () => import('../views/Forms/FormElements.vue'),
      meta: { title: 'Form Elements' },
    },
    {
      path: '/basic-tables',
      name: 'Basic Tables',
      component: () => import('../views/Tables/BasicTables.vue'),
      meta: { title: 'Basic Tables' },
    },
    {
      path: '/line-chart',
      name: 'Line Chart',
      component: () => import('../views/Chart/LineChart/LineChart.vue'),
      meta: { title: 'Line Chart' },
    },
    {
      path: '/bar-chart',
      name: 'Bar Chart',
      component: () => import('../views/Chart/BarChart/BarChart.vue'),
      meta: { title: 'Bar Chart' },
    },
    {
      path: '/alerts',
      name: 'Alerts',
      component: () => import('../views/UiElements/Alerts.vue'),
      meta: { title: 'Alerts' },
    },
    {
      path: '/avatars',
      name: 'Avatars',
      component: () => import('../views/UiElements/Avatars.vue'),
      meta: { title: 'Avatars' },
    },
    {
      path: '/badge',
      name: 'Badge',
      component: () => import('../views/UiElements/Badges.vue'),
      meta: { title: 'Badge' },
    },
    {
      path: '/buttons',
      name: 'Buttons',
      component: () => import('../views/UiElements/Buttons.vue'),
      meta: { title: 'Buttons' },
    },
    {
      path: '/images',
      name: 'Images',
      component: () => import('../views/UiElements/Images.vue'),
      meta: { title: 'Images' },
    },
    {
      path: '/videos',
      name: 'Videos',
      component: () => import('../views/UiElements/Videos.vue'),
      meta: { title: 'Videos' },
    },
    {
      path: '/blank',
      name: 'Blank',
      component: () => import('../views/Pages/BlankPage.vue'),
      meta: { title: 'Blank' },
    },
  ],
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title ?? 'Qadam'} | Qadam LMS`

  const { isAuthenticated } = useAuth()

  if (to.meta.guest) {
    if (isAuthenticated.value && (to.name === 'Signin' || to.name === 'Signup')) {
      return next('/')
    }
    return next()
  }

  if (!isAuthenticated.value) {
    return next('/signin')
  }

  next()
})

export default router
