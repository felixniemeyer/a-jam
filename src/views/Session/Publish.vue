<template>
  <div class="publishing">
    <h1> {{ resultHash !== undefined ? "session published!" : "publishing session..." }} </h1>
    <Section title="log" :initiallyClosed="true">
      <Log
        :entries="log"/>
    </Section>
    <p v-for="(error, i) in errors" :key="i" class="error">{{ error }}</p>
    <div v-if="resultHash !== undefined">
      <p> Share the following link. Click to copy.</p>
      <Copyable :text="sharingLink"/>
      <hr>
      <a class='sharelink' :href="'share-via-mail.html?' + sharingLink" target='_blank'>Share via mail</a>
      <hr>
      <div class="button" @click="$router.go(-1)">
        return to session
      </div>

    </div>
    <div v-else class="button" @click="$router.go(-1)">
      {{ errors.length > 0 ? "return" : "abort" }}
    </div>
    <div class="spacer"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import Log, { LogEntry } from '@/components/Log.vue'
import Section from '@/components/Section.vue'
import Copyable from '@/components/Copyable.vue'

import { postSessionConfig, postRecording, SessionConfig, TrackConfig } from '@/server-wrapper'

import { Track } from '@/types'
import { RecentSessionEntry } from '@/local-storage-wrapper'


export default defineComponent({
  data () {
    const localId = Number(this.$route.params.localId as string)
    return {
      log: [] as LogEntry[],
      errors: [] as string[],
      resultHash: undefined as string | undefined,
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
      return `#/loadSession/${this.resultHash}`
    },
    sharingLink(): string {
      let url = window.location.protocol
      url += "//" + window.location.host + '/'
      url += this.loadSessionPath
      return url
    }
  },
  methods: {
    async publish () {
      // try {
        await this.publishRecordings()
        await this.publishSession()
      //} catch (e: any) {
      //  this.errors.push()
      //}
    },
    async publishRecordings () {
      const promises: Promise<void>[] = []
      this.session.tracks.forEach(track => {
        if (track.recording.hash === undefined) {
          this.log.push({ type: 'msg', s: `publishing recording ${track.name}...` })
          promises.push(this.publishRecording(track))
        } else {
          this.log.push({ type: 'msg', s: `recording ${track.name} already public by:` })
          this.log.push({ type: 'copyable', s: track.recording.hash })
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
        const hash = await postRecording(recording.audioBlob)
        this.log.push({ type: 'msg', s: `track ${track.name} is uploaded` })
        this.log.push({ type: 'copyable', s: hash })
        recording.hash = hash
        this.state.recordings[hash] = track.recording
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
        if (track.recording.hash !== undefined) {
          sc.addTrack(new TrackConfig(
            track.recording.hash,
            track.name,
            track.volume,
            track.panning,
            track.offset,
            track.muted
          ))
        }
      })
      const hash = await postSessionConfig(sc)
      this.session.ancestorsAncestor = this.session.ancestor
      this.session.ancestor = hash
      this.session.dirty = false
      this.resultHash = hash
      this.log.push({ type: 'msg', s: 'jam session is uploaded' })
      this.log.push({ type: 'copyable', s: hash })
      const rse = new RecentSessionEntry(
        hash,
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
  .sharelink{
    display: inline-block;
    color: #fff;
    text-decoration: none;
    @include clickable-surface;
    margin: 0.2rem;
    &:visited {
      color: #fff;
    }
  }

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
