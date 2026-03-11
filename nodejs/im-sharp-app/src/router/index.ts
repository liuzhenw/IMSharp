import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    redirect: '/chats',
  },
  {
    path: '/chats',
    name: 'chats',
    component: () => import('@/pages/ChatsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/chats/:id',
    name: 'chat-detail',
    component: () => import('@/pages/ChatDetailPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/chats/:id/settings',
    name: 'chat-settings',
    component: () => import('@/pages/ChatSettingsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/contacts',
    name: 'contacts',
    component: () => import('@/pages/ContactsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/contacts/:id',
    name: 'contact-detail',
    component: () => import('@/pages/ContactDetailPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/contacts/add',
    name: 'add-friend',
    component: () => import('@/pages/AddFriendPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/contacts/add/:id',
    name: 'send-friend-request',
    component: () => import('@/pages/SendFriendRequestPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/contacts/requests',
    name: 'friend-requests',
    component: () => import('@/pages/FriendRequestsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/groups',
    name: 'groups',
    component: () => import('@/pages/GroupsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/groups/:id',
    name: 'group-detail',
    component: () => import('@/pages/GroupDetailPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/edit',
    name: 'profile-edit',
    component: () => import('@/pages/ProfileEditPage.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    // 需要认证但未登录,重定向到登录页
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    // 已登录访问登录页,重定向到首页
    next({ name: 'chats' })
  } else {
    next()
  }
})

export default router
