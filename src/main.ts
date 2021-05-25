import { createApp, reactive } from 'vue'
import App from './App.vue'
import makeRouter from './router'

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

createApp(App)
  .use(({ config }) => {
    Object.assign(config.globalProperties, {
      state,
      ac,
      ipfsWrapper,
      storageWrapper
    })
  })
  .use(makeRouter(state))
  .mount('#app')

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    state: State;
    ac: AudioContext;
    ipfsWrapper: IPFSWrapper;
    storageWrapper: StorageWrapper;
  }
}
