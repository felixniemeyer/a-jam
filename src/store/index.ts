import { InjectionKey } from 'vue'
import { createStore, Store, useStore as baseUseStore } from 'vuex'
import Vue from 'vue'

import { Session, Track, Recording, Playback, RecentSessionEntry } from '@/model/types.ts'

export interface State {
  sessions: {
    global: {[cid: string]: Session},
    local: {[localId: number]: Session},
    nextLocalSessionId: number
  }
  tracks: {[trackId: number]: Track}
  recordings: {[recId: number]: Recording}
  playbacks: {[pId: number]: Playback}
  recentSessions: RecentSessionEntry[]
  settings: {
    pinningServices: [],
    defaultRecordingOffset: number
  }
}

// define injection key
export const key: InjectionKey<Store<State>> = Symbol()

export const store = createStore<State>({
  state:  {
    sessions: {
      global: {},
      local: {},
      nextLocalSessionId: 0
    },
    tracks: [],
    recordings: [],
    playbacks: [],
    recentSessions: [],
    settings: {
      pinningServices: [],
      defaultRecordingOffset: 65
    }
  },
  mutations: {
  },
  actions: {
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
