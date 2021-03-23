import { createStore, Store, useStore as baseUseStore } from 'vuex'

import { ipfsWrapper, TrackConfig, SessionConfig } from '@/ipfs-wrapper'
import { storageWrapper, RecentSessionEntry, Settings } from '@/local-storage-wrapper'

import { Session, Track, Recording, Playback, LogEntry } from '@/types'
import { InjectionKey } from 'vue'


// define injection key
export const key: InjectionKey<Store<State>> = Symbol()

export const store = createStore<State>({
  state: {
    sessions: {
      public: {},
      local: {},
      nextLocalSessionId: 0,
      loading: {
        log: [],
        errors: []
      },
      publishing: {
        log: [],
        errors: []
      }
    },
    tracks: {},
    nextTrackId: 0,
    recordings: {
      public: {},
      local: {}
    },
    playbacks: [],
    playing: false,
    recording: false,
    recentSessions: storageWrapper.getRecentSessions(),
    settings: storageWrapper.getSettings()
  },
  mutations: {
  },
  actions: {
    initUserMedia () { // should happen on record
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false
            }
          })
          .then(this.initRecorder.bind(this))
          .catch(function (err) {
            console.error('The following getUserMedia error occurred: ' + err)
          })
      } else {
        console.error('getUserMedia not supported on your browser!')
      }
    }

  },
    modules: {
  }
})

export function useStore () {
  return baseUseStore(key)
}

/** typed store can now be used in components like this:
import { useStore } from './store'
...
setup () {
  const store = useStore()
}
...
*/
