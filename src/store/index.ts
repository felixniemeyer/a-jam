import { InjectionKey, nextTick } from 'vue'
import { createStore, Store, useStore as baseUseStore } from 'vuex'

import { ipfsWrapper, TrackConfig, SessionConfig } from '@/ipfs-wrapper'
import { storageWrapper, RecentSessionEntry, Settings } from '@/local-storage-wrapper'

import { Session, Track, Recording, Playback, LogEntry } from '@/store/types'

export interface State {
  sessions: {
    public: {[cid: string]: Session},
    local: {[localId: number]: Session},
    nextLocalSessionId: number
    loading: {
      log: LogEntry[]
      errors: string[]
    },
    publishing: {
      log: LogEntry[]
      errors: string[]
    }
  }
  tracks: {[id: number]: Track},
  nextTrackId: number,
  recordings: {
    public: {[cid: string]: Recording},
    local: {[localId: number]: Recording}
  },
  playbacks: {[id: number]: Playback}
  playing: boolean
  recording: boolean
  recentSessions: RecentSessionEntry[]
  settings: Settings
}

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
    incrementLocalSessionId(state: State) {
      state.sessions.nextLocalSessionId++
    },
    createSession(state: State, localId: number) {
      state.sessions.local[localId] = {
        title: "New Session",
        trackIds: [],
        publication: undefined,
        previousCid: undefined
      }
    },
    createLocalCopy(state: State, payload: {cid: string, localId: number}) {
      const original = state.sessions.public[payload.cid]
      const trackIds = original.trackIds.map(trackId => {
        const newTrackId = state.nextTrackId++;
        state.tracks[newTrackId] = Object.assign({},
          state.tracks[trackId]
        )
        return newTrackId
      })
      state.sessions.local[payload.localId] = {
        title: original.title,
        trackIds,
        publication: undefined,
        previousCid: original.publication!.cid
      }
    },
    addPublicSession(state: State, session: Session) {
      state.sessions.public[session.publication!.cid] = session
    },
    incrementNextTrackId(state: State, i: number) {
      state.nextTrackId += i
    },
    addPublicRecording(state: State, recording: Recording) {
      state.recordings.public[recording.cid!] = recording
    },
    createTrack(state: State, payload: {localId: number, track: Track}) {
      state.tracks[payload.localId] = payload.track
    },
    addRecentSession(state: State, rse: RecentSessionEntry) {
      state.recentSessions = [rse].concat(state.recentSessions.filter(e => e.cid !== rse.cid))
    }
  },
  actions: {
    // loadSession
    async loadSession({dispatch, commit, state}, cid: string) {
      if(state.sessions.public[cid] === undefined) {
        await dispatch('retrieveSessionFromIPFS', cid)
      }
      const localId = state.sessions.nextLocalSessionId
      commit("createLocalCopy", {cid, localId})
      commit("incrementLocalSessionId")
      dispatch('addToRecentSessions', cid)
      return localId
    },
    async retrieveSessionFromIPFS({dispatch, commit, state}, cid: string){
      commit('loadingLog', { type: 'msg', s: 'retrieving session with cid:' })
      commit('loadingLog', { type: 'copyable', s: cid })
      let sessionConfig = await ipfsWrapper.loadSessionConfig(cid)
      let trackIds = await dispatch('createTracks', sessionConfig.tracks)
      commit('addPublicSession', {
        title: sessionConfig.title,
        publication: {
          cid,
          date: sessionConfig.localTime
        },
        previousCid: sessionConfig.origin,
        trackIds
      })
    },
    async createTracks({dispatch, commit, state}, trackConfigs) {
      const localId = state.nextTrackId
      commit('incrementNextTrackId', trackConfigs.length)

      const promises = trackConfigs.map(async (trackConfig: TrackConfig, i:number) => {
        let recording = state.recordings.public[trackConfig.cid]
        if(recording === undefined) {
          await dispatch('retrieveRecordingFromIPFS', trackConfigs.cid)
        }
        commit('createTrack', { localId: localId + i, track: { // TODO: maybe make track reactive for e.g. effective duration
          name: trackConfig.name,
          volume: trackConfig.volume,
          panning: trackConfig.panning,
          offset: trackConfig.offset,
          effectiveDuration: recording.audioBuffer.duration - trackConfig.offset,
          recordingId: trackConfig.cid
        }})
      })
      const trackIds = await Promise.all(promises)
      return trackIds
    },
    async retrieveRecordingFromIPFS({commit}, cid) {
      commit('loadingLog', { type: 'msg', s: `retrieving recording with cid:` })
      commit('loadingLog', { type: 'copyable', s: cid })
      const audioBuffer = await ipfsWrapper.loadAudio(cid)
      commit('addPublicRecording', {
        cid,
        audioBuffer,
        audioBlob: undefined
      })
    },

    // create session
    async createSession({commit, state}) {
      const localId = state.sessions.nextLocalSessionId
      commit("incrementLocalSessionId")
      commit("createSession", {
        localId
      })
      return localId
    },

    // various
    async addToRecentSessions({commit, state}, session: Session) {
      const rse = {
        title: session.title,
        cid: session.publication!.cid,
        timestamp: session.publication!.date
      } as RecentSessionEntry
      storageWrapper.addRecentSession(rse)
      commit("addRecentSession", rse)
    },
    setDefaultRecordingOffset({commit}, v) {
      storageWrapper.setDefaultRecordingOffset(v)
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
