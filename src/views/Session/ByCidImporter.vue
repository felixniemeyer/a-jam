<template>
  <div class="byCidImporter">
    <h1> import recording by CID </h1>
    <input ref="cidInput" placeholder="ipfs cid..."/>
    <p v-if="this.error" class="error"> {{error}} </p>
    <div>
      <div class="button" @click="goBack">
        cancel
      </div>
      <div class="button" @click="importRecording">
        import
      </div>
      <div class="spacer"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import WidthFreezer from '@/mixins/WidthFreezer'
import { Track } from '@/types'
import Keyhandler from '@/mixins/Keyhandler'

export default defineComponent({
  mixins: [WidthFreezer, Keyhandler],
  data () {
    return {
      localId: Number(this.$route.params.localId),
      error: undefined as undefined | string
    }
  },
  mounted () {
    (this.$refs.cidInput as HTMLInputElement).focus()
  },
  methods: {
    goBack () {
      this.$router.go(-1)
    },
    handleKeydown ($event: KeyboardEvent) {
      if ($event.key === 'Escape') {
        this.goBack()
      }
      if ($event.key === 'Enter') {
        this.importRecording()
      }
    },
    async importRecording () {
      const inputEl = this.$refs.cidInput as HTMLInputElement
      const cid = inputEl.value

      // TODO load track from cid
      let recording = this.state.recordings[cid]
      if (recording === undefined) {
        let audioBuffer: AudioBuffer
        try {
          console.log('right before loading:')
          const arrayBuffer = await this.ipfsWrapper.loadRecording(cid)
          audioBuffer = await this.ac.decodeAudioData(arrayBuffer)
          console.log('why uncaught')
        } catch (e) {
          this.error = `Could not get recording from ipfs. ${e}`
          return
        }
        recording = this.state.recordings[cid] = {
          cid,
          audioBuffer,
          audioBlob: undefined
        }
      }
      const track = Track.fromRecording(
        recording,
        `cid ${cid.slice(0, 4)}...${cid.slice(-4)} (imported)`
      )
      this.state.sessions.local[this.localId].tracks.push(track)

      this.goBack()
    }
  }
})

</script>

<style lang="scss">

.byCidImporter{
  .button {
    @include clickable-surface;
    display: inline-block;
  }
  .spacer {
    width: 1em;
    height: 5em;
  }
  input {
    padding: 1em;
  }
}

</style>
