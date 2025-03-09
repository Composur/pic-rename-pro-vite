import { createRouter, createWebHistory, createWebHashHistory, RouteRecordRaw } from 'vue-router'

// 路由配置
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: {
      title: '首页 - PicRenamePro'
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
    meta: {
      title: '关于 - PicRenamePro'
    }
  }
]

// 创建路由实例
const router = createRouter({
  // 根据运行环境选择不同的历史模式
  // Electron环境使用Hash模式，Web环境使用History模式
  history: typeof window !== 'undefined' && window.electronAPI
    ? createWebHashHistory()
    : createWebHistory(),
  routes
})

// 路由前置守卫，用于设置页面标题
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  next()
})

export default router