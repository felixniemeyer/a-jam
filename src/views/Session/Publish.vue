<template>
  <div class="publishing">
    <h1> {{ resultCid !== undefined ? "session published!" : "publishing session..." }} </h1>
    <Section title="log" :initiallyClosed="true">
      <Log
        :entries="log"/>
    </Section>
    <p v-for="(error, i) in errors" :key="i" class="error">{{ error }}</p>
    <div v-if="resultCid !== undefined">
      <h4> share </h4>
      <p> link for browsers that support ipns: </p>
      <Copyable :text="ipnsLink"/>
      <p> link for all browsers (public ipfs gateway): </p>
      <Copyable :text="gatewayLink"/>
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
import { defineComponent } from 'vue'

import Log, { LogEntry } from '@/components/Log.vue'
import Section from '@/components/Section.vue'
import Copyable from '@/components/Copyable.vue'

import { Track } from '@/types'
import { SessionConfig, TrackConfig } from '@/ipfs-wrapper'
import { RecentSessionEntry } from '@/local-storage-wrapper'

export default defineComponent({
  data () {
    const localId = Number(this.$route.params.localId as string)
    return {
      log: [] as LogEntry[],
      errors: [] as string[],
      resultCid: undefined as string | undefined,
      localId,
      session: this.state.sessions.local[localId]
    }
  },
  components: {
    Copyable,
    Log,
    Section
  },
  mounted () {
    this.publish()
  },
  computed: {
    loadSessionPath (): string {
      return `#/loadSession/${this.resultCid}`
    },
    ipnsLink (): string {
      return `ipns://${this.ipfsWrapper.appIPNSIdentifier}/${this.loadSessionPath}`
    },
    gatewayLink (): string {
      return `https://${this.ipfsWrapper.gatewayHost}/ipns/${this.ipfsWrapper.appIPNSIdentifier}/${this.loadSessionPath}`
    }
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
          this.log.push({ type: 'msg', s: `publishing recording ${track.name}...` })
          promises.push(this.publishRecording(track))
        } else {
          this.log.push({ type: 'msg', s: `recording ${track.name} already public by:` })
          this.log.push({ type: 'copyable', s: track.recording.cid })
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
        const cid = await this.ipfsWrapper.ipfsAdd(recording.audioBlob)
        this.log.push({ type: 'msg', s: `track ${track.name} is now public on ipfs by:` })
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
            track.offset,
            track.muted
          ))
        }
      })
      const cid = await this.ipfsWrapper.saveSessionConfig(sc)
      this.session.ancestorsAncestor = this.session.ancestor
      this.session.ancestor = cid
      this.session.dirty = false
      this.resultCid = cid
      this.log.push({ type: 'msg', s: 'jam session is now public on ipfs at:' })
      this.log.push({ type: 'copyable', s: cid })
      const rse = new RecentSessionEntry(
        cid,
        this.session.title,
        sc.localTime
      )
      this.state.sessions.recent = this.storageWrapper.addRecentSession(rse, this.state.sessions.recent)
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
    color: #2fe9ff;
    border: 0.1em solid darken(#2fe9ff,20%);
  }
  .nowrap {
    white-space: nowrap;
  }
  .spacer {
    width: 1em;
    height: 5em;
  }
  p {
    margin-right: 1em;
    margin-left: 1em;
  }
}

</style>
