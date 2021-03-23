<template>
  <div id="nav">
    <router-link to="/">Home</router-link> |
    <router-link to="/session">Session</router-link> |
    <router-link to="/info">Info</router-link> |
    <router-link to="/settings">Settings</router-link>
  </div>
  <AudioContextPrompt v-if="checkAudioContext !== undefined"/>
  <router-view v-else-if="ipfsState === 'initialized'"></router-view>
  <p v-if="ipfsWrapper.state === 'failed'" class='error'>
    failed to connect to ipfs
  </p>
  <p v-else-if="ipfsWrapper.state === 'initializing'">
    connecting to ipfs: {{ ipfsState }}
  </p>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { TrackConfig } from '@/ipfs-wrapper'
import { LocalSession, Process, PublicSession, Track } from '@/types'
import { storageWrapper } from '@/local-storage-wrapper'
import { getParams } from '@/get-params'

import AudioContextPrompt from '@/components/AudioContextPrompt.vue'

export default defineComponent({
  components: {
    AudioContextPrompt
  }, 
  beforeCreate() {
  }, 
  data() {
    return {
      onACEnabled: undefined as undefined | (() => void)
    }
  }, 
  mounted() {
    this.state.sessions.recent = storageWrapper.getRecentSessions()
    this.state.settings = storageWrapper.getSettings()
    this.loadLinkedSession()
  }, 
  methods: {
    /** 
     * Checks whether a session cid has been provided in the link and loads it
     */
    loadLinkedSession() {
      const cid = getParams.loadSession 
      if(cid !== undefined) {
        this.checkAudioContext().then(
          () => {
            this.loadSession(cid)
          },
          () => {
            this.state.sessions.loadingProcesses[cid].errors.push(
              'Audio Context wasn\'t allowed to start but is required even for session loading.'
            )
          }
        )
      }
    }, 
    checkAudioContext () {
      return new Promise<void>((resolve, reject) => { // eslint-disable-line
        if (this.ac.state === 'suspended') {
          this.onACEnabled = () => {
            this.ac.resume()
            this.onACEnabled = undefined
            resolve()
          }
        } else {
          resolve()
        }
      })
    }, 
    async loadSession(cid: string) {
      this.$router.push(`loadSession/${cid}`)
      let publicSession = this.state.sessions.public[cid]
      if(publicSession === undefined) {
        publicSession = await this.retrieveSessionFromIPFS(cid)
      }
      const localSessionId = this.state.sessions.nextLocalSessionId++
      this.state.sessions.local[localSessionId] = publicSession.copyToLocal()
      this.$router.replace(`session/${localSessionId}`)
      this.addToRecentSessions(publicSession)
    },
    createNewSession() {
      const localSessionId = this.state.sessions.nextLocalSessionId++
      this.state.sessions.local[localSessionId] = new LocalSession()
      this.$router.replace(`session/${localSessionId}`)
    }, 
    async retrieveSessionFromIPFS(cid: string){
      const process = this.state.sessions.loadingProcesses[cid] = {
        log: [
          { type: 'msg', s: 'retrieving session with cid:' }, 
          { type: 'copyable', s: cid }
        ], 
        errors: []
      } 
      let sessionConfig = await this.ipfsWrapper.loadSessionConfig(cid)
      const session = new PublicSession(cid, sessionConfig.localTime)
      session.title = sessionConfig.title
      session.previousCid = sessionConfig.origin || null
      session.tracks = await this.createTracks(sessionConfig.tracks, process) 
      return this.state.sessions.public[cid] = session
    },
    async createTracks(trackConfigs: TrackConfig[], process: Process) {
      return Promise.all<Track>(
        trackConfigs.map(async trackConfig => {
          let recording = this.state.recordings[trackConfig.cid]
          if(recording === undefined) {
            recording = await this.retrieveRecordingFromIPFS(trackConfig.cid, process)
          }
          const track = new Track(
            trackConfig.offset, 
            recording
          )
          track.name = trackConfig.name
          track.volume = trackConfig.volume
          track.panning = trackConfig.panning
          return track
        })
      )
    },
    async retrieveRecordingFromIPFS(cid: string, process: Process) {
      process.log.push({ type: 'msg', s: `retrieving recording with cid:`})
      process.log.push({ type: 'copyable', s: cid })
      const audioBuffer = await this.ipfsWrapper.loadRecording(cid)
      return this.state.recordings[cid] = {
        audioBuffer,
        audioBlob: undefined
      }
    },
    async addToRecentSessions(session: PublicSession) {
      const recentSession = {
        title: session.title,
        cid: session.cid,
        timestamp: session.date
      }
      storageWrapper.addRecentSession(recentSession)
      const deduplicated = this.state.sessions.recent.filter(e => e.cid !== recentSession.cid)
      const newList = [recentSession].concat(deduplicated)
      this.state.sessions.recent = newList
    },
  },
  provide() {
    return {
      state: this.state
    }
  }
})
</script>

<style lang="scss">
/* {
  outline: 1px solid pink;
} /**/
body {
  position: absolute;
  width: 100%;
  height: 100%;
  margin: 0;
  max-width: 60vh;
  left: 50%;
  transform: translate(-50%, 0);
  overflow-x: hidden;
}
#app {
  font-family: sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.error {
  color: rgb(128, 9, 9);
}

</style>
