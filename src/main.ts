import { createApp, reactive } from 'vue'
import App from './App.vue'
import router from './router'

import { State, state } from '@/state'
import { IPFSWrapper } from '@/ipfs-wrapper'
import { LocalStorageWrapper, StorageWrapper } from '@/local-storage-wrapper'

const ac = new AudioContext()
const ipfsWrapper = new IPFSWrapper(ac)
ipfsWrapper.initialize()

createApp(App)
  .use(({ config }) => {
    Object.assign(config.globalProperties, {
      state: reactive(state),
      ipfsWrapper,
      storageWrapper: new LocalStorageWrapper(),
      ac
    })
  })
  .use(router)
  .mount('#app')

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    state: State;
    ipfsWrapper: IPFSWrapper;
    ac: AudioContext;
    storageWrapper: StorageWrapper;
  }
}
