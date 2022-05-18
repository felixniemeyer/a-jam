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
        { type: 'msg', s: 'session hash:' },
        { type: 'copyable', s: this.$route.params.hash }
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
      const hash = this.$route.params.hash as string
      let publicSession = this.state.sessions.public[hash]
      if (publicSession === undefined) {
        this.log.push({ type: 'msg', s: 'loading from server.' })
        publicSession = await this.loadSessionFromServer(hash)
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
        publicSession.hash,
        publicSession.title,
        publicSession.date
      )
      this.state.sessions.recent = this.storageWrapper.addRecentSession(rse, this.state.sessions.recent)
    },
    deriveLocalSession (publicSession: PublicSession): LocalSession {
      const derivative = new LocalSession()
      derivative.title = publicSession.title
      derivative.tracks = publicSession.tracks.map(track => track.clone())
      derivative.ancestor = publicSession.hash
      derivative.ancestorsAncestor = publicSession.ancestor
      return derivative
    },
    async loadSessionFromServer(hash: string) {
      const sessionConfig = await loadSessionConfig(hash)
      const session = new PublicSession(hash, sessionConfig.localTime)
      session.title = sessionConfig.title
      session.ancestor = sessionConfig.ancestor
      session.tracks = await this.createTracks(sessionConfig.tracks)
      this.state.sessions.public[hash] = session
      return session
    },
    async createTracks (trackConfigs: TrackConfig[]) {
      return Promise.all<Track>(
        trackConfigs.map(async trackConfig => {
          let recording = this.state.recordings[trackConfig.hash]
          if (recording === undefined) {
            recording = await this.retrieveRecordingFromIPFS(trackConfig.hash)
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
    async retrieveRecordingFromIPFS (hash: string) {
      this.log.push({ type: 'msg', s: 'retrieving recording with hash:' })
      this.log.push({ type: 'copyable', s: hash })
      const arrayBuffer = await loadRecording(hash)
      const audioBuffer = await this.ac.decodeAudioData(arrayBuffer)
      const recording = this.state.recordings[hash] = {
        hash,
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
