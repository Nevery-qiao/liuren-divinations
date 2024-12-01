import { createRouter, createWebHistory } from 'vue-router'
import DesktopLayout from '../layouts/DesktopLayout.vue'
import MobileLayout from '../layouts/MobileLayout.vue'

// 创建一个简单的设备检测函数，不依赖组件生命周期
const isMobileDevice = () => window.innerWidth < 768

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: DesktopLayout
    },
    {
      path: '/mobile',
      component: MobileLayout,
      children: [
        {
          path: '',
          component: () => import('../views-mobile/HistoryListView.vue')
        },
        {
          path: 'divination/new',
          component: () => import('../views-mobile/NewDivinationView.vue')
        },
        {
          path: 'divination/:id',
          component: () => import('../views-mobile/DivinationDetailView.vue')
        }
      ],
      meta: { requiresMobile: true }
    }
  ]
})

// 路由守卫确保移动端路由只在移动端访问
router.beforeEach((to, from, next) => {
  console.log('[Router Guard] Navigation started:', {
    from: from.path,
    to: to.path,
    fullPath: to.fullPath,
    params: to.params,
    query: to.query
  })

  const isMobile = window.innerWidth < 768
  console.log('[Router Guard] Device check:', {
    width: window.innerWidth,
    isMobile,
    path: to.path,
    matched: to.matched
  })

  if (isMobile && !to.path.startsWith('/mobile')) {
    console.log('[Router Guard] Redirecting to mobile:', `/mobile${to.path}`)
    next({ path: `/mobile${to.path}`, query: to.query, params: to.params })
    return
  }

  if (!isMobile && to.path.startsWith('/mobile')) {
    console.log('[Router Guard] Redirecting to desktop:', to.path.replace('/mobile', ''))
    next({ path: to.path.replace('/mobile', ''), query: to.query, params: to.params })
    return
  }

  console.log('[Router Guard] Proceeding with navigation')
  next()
})

export default router
