import { createApp, reactive } from 'vue'
import App from './App.vue'
import makeRouter from './router'

import { State } from '@/state'
import { LocalStorageWrapper, StorageWrapper } from '@/local-storage-wrapper'
import { debug } from '@/tools'

const storageWrapper = new LocalStorageWrapper()
const state = reactive({
  sessions: {
    recent: storageWrapper.getRecentSessions(),
    public: {},
    local: {},
    nextLocalSessionId: 0
  },
  recordings: {},
  settings: storageWrapper.loadSettings()
} as State)
const ac = new AudioContext()

debug('here is the state', state)

createApp(App)
  .use(({ config }) => {
    Object.assign(config.globalProperties, {
      state,
      ac,
      storageWrapper
    })
  })
  .use(makeRouter(state))
  .mount('#app')

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    state: State;
    ac: AudioContext;
    storageWrapper: StorageWrapper;
  }
}
