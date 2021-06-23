<template>
  <div class="publishing">
    <h1> publishing session... </h1>
    <Log
      :entries="log"/>
    <p v-for="(error, i) in errors" :key="i" class="error">{{ error }}</p>
    <div v-if="done">
      <div class="button" @click="this.$router.go(-1)">
        return to session
      </div>
      <a href="https://unstoppabledomains.com/r/ac3b8968ad7245e" target="_blank" class="ud-affiliate">
        Want a blockchain domain so that users can easily find your music on the decentralized web? <b class="nowrap">Click here.</b>
      </a>
    </div>
    <div v-else class="button" @click="this.$router.go(-1)">
      abort
    </div>
    <div class="spacer"></div>
  </div>
</template>

<script lang="ts">
import Log, { LogEntry } from '@/components/Log.vue'
import { defineComponent } from 'vue'

import { Track } from '@/types'
import { SessionConfig, TrackConfig } from '@/ipfs-wrapper'
import { RecentSessionEntry } from '@/local-storage-wrapper'

export default defineComponent({
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
      try {
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
        this.session.ancestor,
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
      this.session.ancestorsAncestor = this.session.ancestor
      this.session.ancestor = cid
      this.session.dirty = false
      this.logLinks(cid)
      this.done = true
      const rse = new RecentSessionEntry(
        cid,
        this.session.title,
        sc.localTime
      )
      this.state.sessions.recent = this.storageWrapper.addRecentSession(rse, this.state.sessions.recent)
    },
    logLinks (cid: string) {
      this.log.push({ type: 'msg', s: 'jam session is now public on ipfs at:' })
      this.log.push({ type: 'copyable', s: cid })

      this.log.push({ type: 'headline', s: 'share' })
      this.log.push({ type: 'msg', s: '(click any link to copy)' })

      const path = `#/loadSession/${cid}`
      this.log.push({ type: 'msg', s: 'link for browsers that support ipfs: ' })
      this.log.push({
        type: 'copyable',
        s: `ipns://${this.ipfsWrapper.appIPNSIdentifier}/` + path
      })
      this.log.push({ type: 'msg', s: 'link for all browsers: ' })
      this.log.push({
        type: 'copyable',
        s: `https://${this.ipfsWrapper.gatewayURL}/ipns/${this.ipfsWrapper.appIPNSIdentifier}/` + path
      })
    }
  }
})

</script>

<style lang="scss">

.publishing{
  .button {
    @include clickable-surface;
    margin-top: 2em;
    margin-bottom: 2em;
  }
  .ud-affiliate {
    display: block;
    text-decoration: none;
    @include clickable-surface;
    color: #4c46f7;
    border: 0.1em solid #4c46f7;
    box-shadow: 0 0 0.5em #4c46f799;
  }
  .nowrap {
    white-space: nowrap;
  }
  .spacer {
    width: 1em;
    height: 5em;
  }
}

</style>
