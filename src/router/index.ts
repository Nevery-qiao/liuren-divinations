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
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

export default router
