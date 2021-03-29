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
import { PublicSession, Track } from '@/types'
import { storageWrapper } from '@/local-storage-wrapper'

import Log from '@/components/Log.vue'

export default defineComponent({
  data() {
    return {
      requireInteraction: false,
      log: [
        { type: 'msg', s: 'retrieving session with cid:' },
        { type: 'copyable', s: this.$route.params.cid }
      ],
      errors: [],
    }
  },
  components: {
    Log
  },
  mounted() {
    this.loadSession()
  },
  methods: {
    abort() {
      this.$router.go(-1)
    },
    checkAudioContext () {
      if (this.ac.state === 'suspended') {
        this.requireInteraction = true
      } else {
        this.loadSession()
      }
    },
    async loadSession() {
      const cid = this.$route.params.cid as string
      this.$router.push(`loadSession/${cid}`)
      let publicSession = this.state.sessions.public[cid]
      if(publicSession === undefined) {
        publicSession = await this.retrieveSessionFromIPFS(cid)
      }
      const localSessionId = this.state.sessions.nextLocalSessionId++
      this.state.sessions.local[localSessionId] = publicSession.copyToLocal()
      this.$router.replace(`session/${localSessionId}`)
      this.state.sessions.recent = storageWrapper.addRecentSession({
        title: publicSession.title,
        cid: publicSession.cid,
        timestamp: publicSession.date
      }, this.state.sessions.recent)
    },
    async retrieveSessionFromIPFS(cid: string){
      let sessionConfig = await this.ipfsWrapper.loadSessionConfig(cid)
      const session = new PublicSession(cid, sessionConfig.localTime)
      session.title = sessionConfig.title
      session.previousCid = sessionConfig.origin
      session.tracks = await this.createTracks(sessionConfig.tracks)
      return this.state.sessions.public[cid] = session
    },
    async createTracks(trackConfigs: TrackConfig[]) {
      return Promise.all<Track>(
        trackConfigs.map(async trackConfig => {
          let recording = this.state.recordings[trackConfig.cid]
          if(recording === undefined) {
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
    async retrieveRecordingFromIPFS(cid: string) {
      this.log.push({ type: 'msg', s: `retrieving recording with cid:`})
      this.log.push({ type: 'copyable', s: cid })
      const audioBuffer = await this.ipfsWrapper.loadRecording(cid)
      return this.state.recordings[cid] = {
        cid,
        audioBuffer,
        audioBlob: undefined
      }
    },
  }
})
</script>

<style lang="sass">

</style>
