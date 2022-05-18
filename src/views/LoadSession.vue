<template>
  <div class="loading">
    <AudioContextPrompt v-if="requireInteraction" @clicked='resumeAcAndLoad'/>
    <div v-else>
      <h1> loading session... </h1>
      <Log
        :entries="log"/>
      <p v-for="(error, i) in errors" :key="i" class="error">{{ error }}</p>
    </div>
    <div class="button" @click="leave">
      {{ errors.length > 0 ? 'ok' : 'abort' }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { LocalSession, PublicSession, Track } from '@/types'

import { TrackConfig, loadRecording, loadSessionConfig } from '@/server-wrapper'

import Log, { LogEntry } from '@/components/Log.vue'
import AudioContextPrompt from '@/components/AudioContextPrompt.vue'
import { RecentSessionEntry } from '@/local-storage-wrapper'

export default defineComponent({
  data () {
    return {
      requireInteraction: false,
      log: [
        { type: 'msg', s: 'session cid:' },
        { type: 'copyable', s: this.$route.params.cid }
      ] as LogEntry[],
      errors: []
    }
  },
  components: {
    AudioContextPrompt,
    Log
  },
  mounted () {
    this.checkAcAndLoad()
  },
  methods: {
    leave () {
      this.$router.replace('/')
    },
    async checkAcAndLoad () {
      if (this.ac === undefined || this.ac.state !== 'running') {
        this.requireInteraction = true
      } else {
        this.loadSession()
      }
    },
    async resumeAcAndLoad () {
      this.requireInteraction = false
      await this.ac.resume()
      this.loadSession()
    },
    async loadSession () {
      const cid = this.$route.params.cid as string
      let publicSession = this.state.sessions.public[cid]
      if (publicSession === undefined) {
        this.log.push({ type: 'msg', s: 'loading from server.' })
        publicSession = await this.loadSessionFromServer(cid)
      } else {
        this.log.push({ type: 'msg', s: 'found session in memory.' })
      }
      const localSessionId = this.state.sessions.nextLocalSessionId++
      this.state.sessions.local[localSessionId] = this.deriveLocalSession(publicSession)
      this.$router.replace({
        name: 'SessionEditor',
        params: {
          localId: localSessionId
        }
      })
      const rse = new RecentSessionEntry(
        publicSession.cid,
        publicSession.title,
        publicSession.date
      )
      this.state.sessions.recent = this.storageWrapper.addRecentSession(rse, this.state.sessions.recent)
    },
    deriveLocalSession (publicSession: PublicSession): LocalSession {
      const derivative = new LocalSession()
      derivative.title = publicSession.title
      derivative.tracks = publicSession.tracks.map(track => track.clone())
      derivative.ancestor = publicSession.cid
      derivative.ancestorsAncestor = publicSession.ancestor
      return derivative
    },
    async loadSessionFromServer(cid: string) {
      const sessionConfig = await loadSessionConfig(cid)
      console.log("loaded session config: ", sessionConfig)
      const session = new PublicSession(cid, sessionConfig.localTime)
      session.title = sessionConfig.title
      session.ancestor = sessionConfig.ancestor
      session.tracks = await this.createTracks(sessionConfig.tracks)
      this.state.sessions.public[cid] = session
      return session
    },
    async createTracks (trackConfigs: TrackConfig[]) {
      return Promise.all<Track>(
        trackConfigs.map(async trackConfig => {
          let recording = this.state.recordings[trackConfig.cid]
          if (recording === undefined) {
            recording = await this.retrieveRecordingFromIPFS(trackConfig.cid)
          }
          const track = new Track(
            trackConfig.offset,
            recording
          )
          track.name = trackConfig.name
          track.volume = trackConfig.volume
          track.panning = trackConfig.panning
          track.muted = trackConfig.muted
          return track
        })
      )
    },
    async retrieveRecordingFromIPFS (cid: string) {
      this.log.push({ type: 'msg', s: 'retrieving recording with cid:' })
      this.log.push({ type: 'copyable', s: cid })
      const arrayBuffer = await loadRecording(cid)
      const audioBuffer = await this.ac.decodeAudioData(arrayBuffer)
      const recording = this.state.recordings[cid] = {
        cid,
        audioBuffer,
        audioBlob: undefined
      }
      return recording
    }
  }
})
</script>

<style lang="scss">
.loading {
  .button {
    @include clickable-surface;
  }
  .inline-button{
    @include clickable-surface;
    display: inline-block;
  }
  .ud-affiliate {
    display: block;
    text-decoration: none;
    @include clickable-surface;
    color: #4c46f7;
    border: 0.1em solid #4c46f7;
    box-shadow: 0 0 0.5em #4c46f799;
  }
}
</style>
