import { State } from '@/state'
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Info from /* webpackChunkName: "about" */ '../views/Info.vue'
import Settings from /* webpackChunkName: "settings" */ '@/views/Settings.vue'
import LoadSession from /* webpackChunkName: "sessionLoading " */ '@/views/LoadSession.vue'
import Session from /* webpackChunkName: "session" */ '@/views/Session.vue'
import SessionEditor from /* webpackChunkName: "sessionEditor" */ '@/views/Session/Editor.vue'
import SessionPublish from /* webpackChunkName: "sessionPublishing " */ '@/views/Session/Publish.vue'
import SessionSettings from /* webpackChunkName: "sessionTrack" */ '@/views/Session/Settings.vue'
import SessionTrack from /* webpackChunkName: "sessionTrack" */ '@/views/Session/Track.vue'
import ByCidImporter from /* webpackChunkName: "sessionTrack" */ '@/views/Session/ByCidImporter.vue'
import FromFileImporter from /* webpackChunkName: "sessionTrack" */ '@/views/Session/FromFileImporter.vue'
import ErrorComponent from /* webpackChunkName: "error" */ '@/views/Error.vue'
import OffsetCalibration from /* webpackChunkName: "error" */ '@/views/OffsetCalibration.vue'

function makeRoutes (state: State): Array<RouteRecordRaw> {
  return [
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
      component: Info
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings
    },
    {
      path: '/offsetCalibration',
      name: 'OffsetCalibration',
      component: OffsetCalibration
    },
    {
      path: '/loadSession/:cid',
      name: 'LoadSession',
      component: LoadSession
    },
    {
      path: '/session/:localId',
      name: 'Session',
      component: Session,
      children: [
        {
          path: 'editor',
          name: 'SessionEditor',
          component: SessionEditor
        },
        {
          path: 'publish',
          name: 'SessionPublish',
          component: SessionPublish
        },
        {
          path: 'settings',
          name: 'SessionSettings',
          component: SessionSettings
        },
        {
          path: 'track/:key',
          name: 'SessionTrack',
          component: SessionTrack
        },
        {
          path: 'byCidImporter',
          name: 'ByCidImporter',
          component: ByCidImporter
        },
        {
          path: 'fromFileImporter',
          name: 'FromFileImporter',
          component: FromFileImporter
        }
      ],
      beforeEnter (to, _from, next) {
        const sessionExists = Number(to.params.localId as string) in state.sessions.local
        if (!sessionExists) {
          next({
            name: 'Error',
            params: {
              type: 'noSuchLocalSession'
            },
            query: {
              localId: to.params.localId
            }
          })
        } else {
          next()
        }
      }
    },
    {
      path: '/error/:type',
      name: 'Error',
      component: ErrorComponent
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: to => ({
        name: 'Error',
        params: {
          type: 'unknownPath'
        },
        query: {
          path: to.fullPath
        }
      })
    }
  ]
}

export default function makeRouter (state: State) {
  return createRouter({
    history: createWebHashHistory(),
    routes: makeRoutes(state)
  })
}
