<template>
  <div class="loading">
    <h1> loading... </h1>
    <AudioContextPrompt v-if="requireInteraction !== undefined" @clicked='loadSession'/>
    <Log
      :entries="log"/>
    <p v-for="(error, i) in errors" :key="i" class="error">{{ error }}</p>
    <div class="button" @click="abort">
      {{ errors.length > 0 ? 'ok' : 'abort' }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { TrackConfig } from '@/ipfs-wrapper'
import { LocalSession, PublicSession, Track } from '@/types'

import Log from '@/components/Log.vue'
import { RecentSessionEntry } from '@/local-storage-wrapper'

export default defineComponent({
  data () {
    return {
      requireInteraction: false,
      log: [
        { type: 'msg', s: 'retrieving session with cid:' },
        { type: 'copyable', s: this.$route.params.cid }
      ],
      errors: []
    }
  },
  components: {
    Log
  },
  mounted () {
    this.checkAcAndLoad()
  },
  methods: {
    abort () {
      this.$router.go(-1)
    },
    checkAcAndLoad () {
      if (this.ac.state === 'suspended') {
        this.ac.resume()
        if (this.ac.state === 'suspended') {
          this.requireInteraction = true
        }
      }
      if (!this.requireInteraction) {
        this.loadSession()
      }
    },
    resumeAcAndLoad () {
      this.ac.resume()
      this.loadSession()
    },
    async loadSession () {
      const cid = this.$route.params.cid as string
      let publicSession = this.state.sessions.public[cid]
      if (publicSession === undefined) {
        publicSession = await this.retrieveSessionFromIPFS(cid)
      }
      const localSessionId = this.state.sessions.nextLocalSessionId++
      this.state.sessions.local[localSessionId] = this.copyToLocalSession(publicSession)
      this.$router.replace(`session/${localSessionId}/edit`)
      const rse = new RecentSessionEntry(
        publicSession.cid,
        publicSession.title,
        publicSession.date
      )
      this.state.sessions.recent = this.storageWrapper.addRecentSession(rse, this.state.sessions.recent)
    },
    copyToLocalSession (publicSession: PublicSession): LocalSession {
      const derivative = new LocalSession()
      derivative.title = publicSession.title
      derivative.tracks = publicSession.tracks.map(track => track.clone())
      derivative.previousCid = publicSession.previousCid
      return derivative
    },
    async retrieveSessionFromIPFS (cid: string) {
      const sessionConfig = await this.ipfsWrapper.loadSessionConfig(cid)
      const session = new PublicSession(cid, sessionConfig.localTime)
      session.title = sessionConfig.title
      session.previousCid = sessionConfig.origin
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
          return track
        })
      )
    },
    async retrieveRecordingFromIPFS (cid: string) {
      this.log.push({ type: 'msg', s: 'retrieving recording with cid:' })
      this.log.push({ type: 'copyable', s: cid })
      const audioBuffer = await this.ipfsWrapper.loadRecording(cid)
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
