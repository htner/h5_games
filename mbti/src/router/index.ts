import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/lobby' },
    { path: '/lobby', component: () => import('@/views/LobbyView.vue') },
    { path: '/setup', component: () => import('@/views/SetupView.vue') },
    { path: '/voting', component: () => import('@/views/VotingView.vue') },
    { path: '/guessing', component: () => import('@/views/GuessingView.vue') },
    { path: '/reveal', component: () => import('@/views/RevealView.vue') },
    { path: '/profile', component: () => import('@/views/ProfileView.vue') },
    { path: '/settlement', component: () => import('@/views/SettlementView.vue') },
  ],
})

export default router
