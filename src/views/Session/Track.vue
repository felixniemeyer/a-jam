<template>
  <div class="track-settings">
    <div v-if="track.cid !== undefined">
      <p> this track refers to this audio file: </p>
      <Copyable :text="track.cid"/>
    </div>
    <div>
      <div class="danger inline-button" tabindex="0" @click="remove" @blur="confirmRemove = false">
        {{confirmRemove ? "confirm remove track" : "remove track"}}
      </div>
    </div>
    <input :value="track.name" ref="name" @keyup="submitOnEnter">
    <div>
      <div class="inline-button" @click="rename">rename track</div>
    </div>
    <Slider
      name="volume"
      left="mute"
      right="200%"
      :from="0.0"
      :to="2.0"
      :value="track.volume"
      @update="updateVolume" />
    <Slider
      name="panning"
      left="left"
      right="right"
      :from="-1.0"
      :to="1.0"
      :value="track.panning"
      @update="updatePanning" />
    <Slider
      name="offset in ms (requires re-play)"
      left="delayed"
      right="earlier"
      :factor="1000"
      :decimalPlaces="0"
      :from="offsetOrigin-0.100"
      :to="offsetOrigin+0.100"
      :value="track.offset"
      @dragEnd="resetInitialOffset"
      @update="updateOffset" />
    <div>
      <div class="inline-button" @click="leave">back to session</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import Slider from '@/components/Slider.vue'
import Copyable from '@/components/Copyable.vue'

export default defineComponent({
  components: {
    Slider,
    Copyable
  },

  data () {
    const sessionId = parseInt(this.$route.params.localId as string)
    const session = this.state.sessions.local[sessionId]
    const trackKey = parseInt(this.$route.params.key as string)
    const track = session.tracks[trackKey]
    return {
      trackKey,
      session,
      track,
      confirmRemove: false,
      offsetOrigin: track.offset
    }
  },
  mounted () {
    (this.$refs.name as HTMLInputElement).select()
  },
  methods: {
    submitOnEnter ($event: KeyboardEvent) {
      if ($event.key === 'Enter') {
        this.rename()
      }
    },
    remove () {
      if (this.confirmRemove) {
        this.track.playback?.source.stop() // eslint-disable-line
        this.session.tracks.splice(this.trackKey, 1)
        this.leave()
      } else {
        this.confirmRemove = true
      }
    },
    leave () {
      this.$router.go(-1)
    },
    rename () {
      this.track.name = (this.$refs.name as HTMLInputElement).value
    },
    updateVolume (v: number) {
      this.track.volume = v
      if (this.track.playback) {
        this.track.playback.gain.gain.value = v
      }
    },
    updatePanning (v: number) {
      this.track.panning = v
      if (this.track.playback) {
        this.track.playback.panner.pan.value = v
      }
    },
    resetInitialOffset () {
      this.offsetOrigin = this.track.offset
    },
    updateOffset (v: number) {
      this.track.offset = v
      this.track.effectiveDuration = this.track.recording.audioBuffer.duration - v
    }
  }
})
</script>

<style lang="scss">
.track-settings {
  padding-top: 3em;
  .inline-button{
    @include clickable-surface;
    display: inline-block;
    &.danger {
      background-color: $danger;
      color: #fff;
    }
  }
  input {
    padding: 1em;
  }
}
</style>
