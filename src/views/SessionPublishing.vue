<template>
  <div class="publishing">
    <h1> publishing... </h1>
    <Log
      :entries="log"/>
    <p v-for="(error, i) in errors" :key="i" class="error">{{ error }}</p>
    <div v-if="done">
      <a v-if="errors.length > 0" href="https://unstoppabledomains.com/r/ac3b8968ad7245e" target="_blank" class="ud-affiliate">
        Want a blockchain domain so that users can easily find your music on the decentralized web? <b class="nowrap">Click here.</b>
      </a>
      <div class="button" @click="this.router.go(-1)">
        return to session
      </div>
    </div>
    <div v-else class="button" @click="this.router.go(-1)">
      abort
    </div>
  </div>
</template>

<script lang="ts">
import Log, { LogEntry } from '@/components/Log.vue'
import { defineComponent } from 'vue'

import { PublicSession, Track } from '@/types'
import { SessionConfig, TrackConfig } from '@/ipfs-wrapper'
import { storageWrapper } from '@/local-storage-wrapper'

export default defineComponent({
  setup () {

  },
  data () {
    const localId = Number(this.$route.params.localId as string)
    return {
      log: [] as LogEntry[],
      errors: [] as string[],
      done: false,
      localId,
      session: this.state.sessions.local[localId]
    }
  },
  components: {
    Log
  },
  mounted () {
    this.publish()
  },
  methods: {
    async publish () {
      this.$router.push(`session/${this.localId}/publish`)
      try {
        this.log.push({ type: 'msg', s: 'publishing session...' })
        await this.publishRecordings()
        await this.publishSession()
      } catch (e) {
        this.errors.push(e)
      }
    },
    async publishRecordings () {
      const promises: Promise<void>[] = []
      this.session.tracks.forEach(track => {
        if (track.recording.cid === undefined) {
          this.log.push({ type: 'msg', s: `publishing track ${track.name}...` })
          promises.push(this.publishRecording(track))
        }
      })
      if (promises.length === 0) {
        this.log.push({ type: 'msg', s: 'no tracks to publish.' })
      }
      await Promise.all(promises).then()
    },
    async publishRecording (track: Track) {
      const recording = track.recording
      if (recording.audioBlob !== undefined) {
        const cid = await this.ipfsWrapper.saveTrackAudio(recording.audioBlob)
        this.log.push({ type: 'msg', s: `track ${track.name} is now public on ipfs at:` })
        this.log.push({ type: 'copyable', s: cid })
        recording.cid = cid
        this.state.recordings[cid] = track.recording
        delete recording.audioBlob
      } else {
        throw Error("couldn't publish track: audioBlob undefined")
      }
    },
    async publishSession () {
      const sc = new SessionConfig(
        this.session.title,
        this.session.previousCid,
        Date.now(),
        []
      )
      this.session.tracks.forEach(track => {
        if (track.recording.cid !== undefined) {
          sc.addTrack(new TrackConfig(
            track.recording.cid,
            track.name,
            track.volume,
            track.panning,
            track.offset
          ))
        }
      })
      const cid = await this.ipfsWrapper.saveSessionConfig(sc)
      this.session.previousCid = cid
      this.session.dirty = false
      this.logLinks(cid)
      this.state.sessions.recent = storageWrapper.addRecentSession({
        cid,
        title: this.session.title,
        timestamp: sc.localTime
      }, this.state.sessions.recent)
    },
    logLinks (cid: string) {
      const params = [
        `loadSession=${cid}`
      ]
      const paramString = params.join('&')
      this.log.push({ type: 'msg', s: 'jam session is now public on ipfs at:' })
      this.log.push({ type: 'copyable', s: cid })
      this.log.push({ type: 'msg', s: 'link for browsers that support ipfs: ' })
      this.log.push({ type: 'copyable', s: `ipns://${this.ipfsWrapper.appIPNSIdentifier}/?${paramString}` })
      this.log.push({ type: 'msg', s: 'link for all browsers: ' })
      this.log.push({ type: 'copyable', s: `https://${this.ipfsWrapper.gatewayURL}/ipns/${this.ipfsWrapper.appIPNSIdentifier}/?${paramString}` })
      this.log.push({ type: 'msg', s: '(click any link to copy)' })
    },
    copyToPublicSession (cid: string, date: number): PublicSession {
      const publication = new PublicSession(cid, date)
      publication.title = this.session.title
      publication.tracks = this.session.tracks.map(track => track.clone())
      publication.previousCid = this.session.previousCid
      return publication
    }
  }
})
</script>

<style lang="sass">

.nowrap {
  white-space: nowrap;
}

</style>
