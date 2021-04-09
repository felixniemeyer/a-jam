import { createApp, reactive } from 'vue'
import App from './App.vue'
import router from './router'

import { State } from '@/state'
import { IPFSWrapper } from '@/ipfs-wrapper'
import { LocalStorageWrapper, StorageWrapper } from '@/local-storage-wrapper'

const storageWrapper = new LocalStorageWrapper()
const state = reactive({
  sessions: {
    recent: storageWrapper.getRecentSessions(),
    public: {},
    local: {},
    nextLocalSessionId: 0
  },
  recordings: {},
  settings: storageWrapper.getSettings()
} as State)
const ac = new AudioContext()
const ipfsWrapper = new IPFSWrapper(ac)
ipfsWrapper.initialize()

router.beforeEach((to, from, next) => {
  const sessionExists = (to.params.localId as string) in state.sessions.local
  if (to.name === 'Session' && !sessionExists) {
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
})

createApp(App)
  .use(({ config }) => {
    Object.assign(config.globalProperties, {
      state,
      ac,
      ipfsWrapper,
      storageWrapper
    })
  })
  .use(router)
  .mount('#app')

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    state: State;
    ac: AudioContext;
    ipfsWrapper: IPFSWrapper;
    storageWrapper: StorageWrapper;
  }
}
