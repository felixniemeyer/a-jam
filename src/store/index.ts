import { createStore, Store, useStore as baseUseStore } from 'vuex'

import { ipfsWrapper, TrackConfig, SessionConfig } from '@/ipfs-wrapper'
import { storageWrapper, RecentSessionEntry, Settings } from '@/local-storage-wrapper'

import { Session, Track, Recording, Playback, LogEntry } from '@/store/types'
import { InjectionKey } from 'vue'

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
      state.sessions.local[localId] = { // this is reactive!
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
    },
    initUserMedia () {
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

    initRecorder (stream: MediaStream) {
      this.mediaRecorder = new MediaRecorder(stream)
      this.mediaRecorder.ondataavailable = (e) => {
        this.recordingChunks.push(e.data)
      }
      this.mediaRecorder.onstop = () => {
        const audio = new Blob(this.recordingChunks, {
          type: 'audio/ogg; codecs=opus'
        })
        const fileReader = new FileReader()
        fileReader.onloadend = () => {
          const arrayBuffer = fileReader.result
          if (arrayBuffer instanceof ArrayBuffer) {
            this.ac.decodeAudioData(arrayBuffer).then(
              (audioBuffer) => {
                this.createTrack(audio, audioBuffer, this.playbackDelay + this.defaultRecordingOffset)
              },
              (err) => {
                console.error('failed to decode audio data:', err)
              }
            )
          } else {
            console.error('arrayBuffer is not an ArrayBuffer')
          }
        }
        fileReader.readAsArrayBuffer(audio)
      }
    }

    createTrack (audioBlob: Blob, audioBuffer: AudioBuffer, offset: number) {
      const track = new Track(
        audioBlob,
        audioBuffer
      )
      track.localId = this.nextLocalTrackId++
      track.offset = offset
      track.effectiveDuration = audioBuffer.duration - offset
      track.name = 'new track'
      this.maxTrackDuration = this.checkForHigherTrackDuration(track.effectiveDuration)
      this.tracks.push(track)
    }

    checkForHigherTrackDuration (max = 0) {
      this.tracks.forEach(track => { // have to go through all, because the playtimeInterval may habe pushed this.maxDuration too far
        if (track.effectiveDuration > max) {
          max = track.effectiveDuration
        }
      })
      return max
    }

    leaveSession () {
      if (this.dirty) {
        this.suggestToPublish()
      } else {
        this.confirmLeave()
      }
    }

    suggestToPublish () {
      this.showLeavePromt = true
    }

    confirmLeave () {
      this.$emit('goHome')
      this.stopAllSources()
      this.showLeavePromt = false
    }

    formatTime (seconds: number) {
      const s = (seconds % 60).toFixed(1)
      const m = Math.floor(seconds / 60)
      return `${m.toString().padStart(2, '0')}:${s.padStart(4, '0')}`
    }

    showingSession () {
      return !(
        this.askForAC ||
        this.showLeavePromt ||
        this.loading ||
        this.publishing !== 'no' ||
        this.renaming ||
        this.editTrackIndex !== null
      )
    }

    handleKeydown ($event: KeyboardEvent) {
      if (this.showingSession()) {
        if ($event.key === ' ') {
          this.togglePlay()
        }
        if ($event.key === 'r') {
          this.toggleRecord()
        }
        if ($event.key === 'Escape') {
          this.leaveSession()
        }
      }
      if ($event.key === 'Escape') {
        if (this.showLeavePromt) {
          this.showLeavePromt = false
        }
        if (this.renaming) {
          this.renaming = false
        }
        if (this.editTrackIndex !== null) {
          this.editTrackIndex = null
        }
      }
    }

    togglePlay () {
      if (this.playing) {
        this.stopAllSources()
      } else {
        if (!this.recording) {
          this.playAll()
          this.stopTimeout = setTimeout(
            this.stopAllSources.bind(this),
            this.maxTrackDuration * 1000 + this.playbackDelay * 2
          )
          this.playing = true
        }
      }
    }

    playAll () {
      this.stopAllSources()
      this.tracks.forEach(track => {
        track.source = this.ac.createBufferSource()
        track.source.buffer = track.audioBuffer
        track.panner = this.ac.createStereoPanner()
        track.panner.pan.value = track.panning
        track.gain = this.ac.createGain()
        track.gain.gain.value = track.volume

        track.source
          .connect(track.gain)
          .connect(track.panner)
          .connect(this.ac.destination)
      })

      this.playbackStartTime = this.ac.currentTime + this.playbackDelay
      this.tracks.forEach(track => {
        if (track.source !== undefined) {
          if (track.offset > 0) {
            track.source.start(this.playbackStartTime, track.offset)
          } else {
            track.source.start(this.playbackStartTime - track.offset)
          }
        }
      })

      setTimeout(this.updateTracksCssSize.bind(this))
      this.playtime = 0
      this.playtimeInterval = setInterval(this.updatePlaytime.bind(this), 1000 / 24)
    }

    updatePlaytime () {
      this.playtime = this.ac.currentTime - this.playbackStartTime
      if (this.recording && this.playtime > this.maxTrackDuration) {
        this.maxTrackDuration = this.playtime
      }
    }

    updateTracksCssSize () {
      if (this.$refs.tracksref !== undefined) {
        this.tracksCssSize = (this.$refs.tracksref as HTMLDivElement).clientWidth.toString() + 'px'
      }
    }

    stopAllSources () {
      if (this.playtimeInterval !== undefined) {
        clearInterval(this.playtimeInterval)
        this.playtimeInterval = undefined
      }
      if (this.stopTimeout !== undefined) {
        clearTimeout(this.stopTimeout)
        this.stopTimeout = undefined
      }
      this.tracks.forEach(track => {
        if (track.source !== undefined) {
          track.source.stop()
        }
      })
      this.playing = false
      this.playtime = 0
    }

    toggleRecord () {
      if (this.mediaRecorder !== undefined) {
        if (this.recording) {
          this.mediaRecorder.stop() // triggers onstop callback
          this.stopAllSources()
          this.recording = false
        } else {
          this.stopAllSources()
          this.recordingChunks = []
          this.playAll()
          this.mediaRecorder.start()
          this.recording = true
          this.dirty = true
        }
      } else {
        console.error('mediaRecorder undefined -> recording not possible')
      }
    }

    pLog (msg: string) {
      this.publishingLog.push(
        new LogEntry(
          'msg',
          msg
        )
      )
    }

    pLogCopyable (cid: string) {
      this.publishingLog.push(
        new LogEntry(
          'copyable',
          cid
        )
      )
    }

    publish () {
      if (ipfsWrapper.state.value === 'initialized') {
        this.publishing = 'ongoing'
        this.publishingError = null
        this.publishingLog = []
        const scrollDown = () => {
          setTimeout(() => {
            window.scrollTo(0, document.body.scrollHeight)
          }, 100)
        }
        this.publishTracks().then(
          () => {
            const getIpfsNodeIdPromise = ipfsWrapper.getIpfsNodeId()
            const publishTracksPromise = this.publishSession()
            Promise.all([getIpfsNodeIdPromise, publishTracksPromise]).then(
              values => {
                const ipfsNodeId = values[0]
                const cid = values[1]
                this.base = cid
                RecentSessionEntry.append(new RecentSessionEntry(true, cid, this.title))
                this.logLinks(cid, ipfsNodeId)
                this.publishing = 'done'
                this.dirty = false
                scrollDown()
              },
              err => {
                this.publishingError = String(err)
                this.publishing = 'done'
                scrollDown()
                return err
              }
            )
          },
          err => err
        )
      }
    }

    logLinks (cid: string, ipfsNodeId: string) {
      const params = [
        `loadSession=${cid}`,
        `loadSessionOrigin=${ipfsNodeId}`
      ]
      const paramString = params.join('&')
      this.pLog('jam session is now public on ipfs at:')
      this.pLogCopyable(cid)
      this.pLog('link for browsers that support ipfs: ')
      this.pLogCopyable(`ipns://${ipfsWrapper.appIPNSIdentifier}/?${paramString}`)
      this.pLog('link for all browsers: ')
      this.pLogCopyable(`https://${ipfsWrapper.gatewayURL}/ipns/${ipfsWrapper.appIPNSIdentifier}/?${paramString}`)
      this.pLog('(click any link to copy)')
    }

    publishTracks () {
      return new Promise((resolve, reject) => {
        const promises: Promise<void>[] = []
        this.tracks.forEach(track => {
          if (track.cid === undefined) {
            this.pLog(`publishing track ${track.localId}...`)
            promises.push(this.publishTrack(track))
          }
        })
        if (promises.length === 0) {
          this.pLog('no tracks to publish.')
        }
        Promise.all(promises).then(
          resolve,
          reject
        )
      })
    }

    publishTrack (track: Track) {
      return new Promise<void>((resolve, reject) => {
        if (track.audioBlob !== undefined) {
          ipfsWrapper.saveTrackAudio(track.audioBlob).then(
            cid => {
              this.pLog(`track ${track.localId} is now public on ipfs at:`)
              this.pLogCopyable(cid)
              track.cid = cid
              delete track.localId
              resolve()
            },
            reject
          )
        } else {
          reject(Error("couldn't save track audio: audioBlob undefined"))
        }
      })
    }

    publishSession () {
      const sc = new SessionConfig(
        this.title,
        this.base,
        Date.now(),
        []
      )
      this.tracks.forEach(track => {
        if (track.cid !== undefined) {
          sc.addTrack(new TrackConfig(
            track.cid,
            track.name,
            track.volume,
            track.panning,
            track.offset
          ))
        }
      })
      this.pLog('publishing session...')
      return ipfsWrapper.saveSessionConfig(sc)
    }

    renameSession () {
      this.renaming = true
      this.$nextTick(() => {
        (this.$refs.newSessionTitle as HTMLInputElement).select()
      })
    }

    updateName () {
      this.title = (this.$refs.newSessionTitle as HTMLInputElement).value
      this.renaming = false
      this.dirty = true
    }

    editTrack (index: number) {
      this.editTrackIndex = index
    }

    changeTrackName (name: string | undefined) {
      if (this.editTrackIndex !== null) {
        let somethingChanged = false
        const track = this.tracks[this.editTrackIndex]
        if (name !== undefined) {
          track.name = name
          somethingChanged = true
        }
        this.editTrackIndex = null
        if (somethingChanged) {
          this.dirty = true
        }
      }
    }

    removeTrack () {
      if (this.editTrackIndex !== null) {
        const trackToBeDeleted = this.tracks[this.editTrackIndex]
        this.editTrackIndex = null
        this.tracks = this.tracks.filter(track => track !== trackToBeDeleted)
        this.maxTrackDuration = this.checkForHigherTrackDuration()
      }
    }

    updateTrackVolume (v: number) {
      if (this.editTrackIndex !== null) {
        const track = this.tracks[this.editTrackIndex]
        track.volume = v
        if (track.gain !== undefined) {
          track.gain.gain.value = v
        }
      }
    }

    updateTrackPanning (v: number) {
      if (this.editTrackIndex !== null) {
        const track = this.tracks[this.editTrackIndex]
        track.panning = v
        if (track.panner !== undefined) {
          track.panner.pan.value = v
        }
      }
    }

    updateTrackOffset (v: number) {
      if (this.editTrackIndex !== null) {
        const track = this.tracks[this.editTrackIndex]
        track.offset = v
        track.effectiveDuration = track.audioBuffer.duration - v
      }
    }

    checkAudioContext () {
      return new Promise<void>((resolve, reject) => { // eslint-disable-line
        if (this.ac.state === 'suspended') {
          this.askForAC = true
          this.acceptAudioContext = () => {
            this.askForAC = false
            this.ac.resume()
            resolve()
          }
        } else {
          resolve()
        }
      })
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
