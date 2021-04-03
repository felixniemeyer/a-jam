import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/info',
    name: 'Info',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/Info.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "settings" */ '@/views/Settings.vue')
  },
  {
    path: '/session/:localId',
    name: 'Session',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "session" */ '@/views/Session.vue')
  },
  {
    path: '/sessionLoading/:cid',
    name: 'SessionLoading',
    component: () => import(/* webpackChunkName: sessionloading */ '@/views/SessionLoading.vue')
  },
  {
    path: '/session/:localId/track/:trackKey',
    name: 'TrackSettings',
    component: () => import(/* webpackChunkName: trackSettings */ '@/views/TrackSettings.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
