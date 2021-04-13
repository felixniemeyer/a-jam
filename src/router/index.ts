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
    component: () => import(/* webpackChunkName: "settings" */ '@/views/Settings.vue')
  },
  {
    path: '/session/loadSession/:cid',
    name: 'LoadSession',
    component: () => import(/* webpackChunkName: "sessionLoading " */ '@/views/LoadSession.vue')
  },
  {
    path: '/session/:localId',
    name: 'Session',
    component: () => import(/* webpackChunkName: "session" */ '@/views/Session.vue'),
    children: [
      {
        path: 'edit',
        name: 'SessionEditor',
        component: () => import(/* webpackChunkName: "sessionEditor" */ '@/views/Session/Editor.vue')

      },
      {
        path: 'publish',
        name: 'SessionPublish',
        component: () => import(/* webpackChunkName: "sessionPublishing " */ '@/views/Session/Publish.vue')
      },
      {
        path: 'settings',
        name: 'SessionSettings',
        component: () => import(/* webpackChunkName: "sessionTrack" */ '@/views/Session/Settings.vue')
      },
      {
        path: 'trackKey',
        name: 'SessionTrack',
        component: () => import(/* webpackChunkName: "sessionTrack" */ '@/views/Session/Track.vue')
      }
    ]
  },
  {
    path: '/error/:type',
    name: 'Error',
    component: () => import(/* webpackChunkName: "error" */ '@/views/Error.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: to => ({ path: '/error/unknownPath', query: { extra: to.fullPath } })
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
