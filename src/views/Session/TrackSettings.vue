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
      <div class="inline-button" @click="changeName">rename track</div>
    </div>
    <Slider
      name="volume"
      left="mute"
      right="200%"
      :from="0.0"
      :to="2.0"
      :value="track.volume"
      @update="v => $emit('update-volume', v)" />
    <Slider
      name="panning"
      left="left"
      right="right"
      :from="-1.0"
      :to="1.0"
      :value="track.panning"
      @update="v => $emit('update-panning', v)" />
    <Slider
      name="offset in ms (requires re-play)"
      left="delayed"
      right="earlier"
      :factor="1000"
      :decimalPlaces="0"
      :from="initialOffset-0.100"
      :to="initialOffset+0.100"
      :value="track.offset"
      @dragEnd="resetInitialOffset"
      @update="v => $emit('update-offset', v)" />
    <div>
      <div class="inline-button" @click="$emit('back')">back to session</div>
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

  data() {
    const sessionId = parseInt(this.$route.params.sessionId as string)
    const trackId = parseInt(this.$route.params.trackId as string)
    return {
      trackId,
      initialOffset: this.state.sessions[trackId],
      confirmRemove: false
    }
  },
  mounted () {
    (this.$refs.name as HTMLInputElement).select()
  },
  methods: {
    submitOnEnter ($event: KeyboardEvent) {
      if ($event.key === 'Enter') {
        this.changeName()
      }
    },
    remove () {
      if (this.confirmRemove) {
        this.$emit('remove')
      } else {
        this.confirmRemove = true
      }
    },
    resetInitialOffset () {
      this.initialOffset = this.track.offset
    },
    changeName () {
      this.$emit('change-name', (this.$refs.name as HTMLInputElement).value)
    },
    editTrack (index: number) {
      this.editTrackIndex = index
    },
    changeTrackName (name: string | undefined) {
      if (this.editTrackIndex !== null) {
        let somethingChanged = false
        const track = this.tracks[this.editTrackIndex]
        if (name !== undefined) {
          track.name = name
          somethingChanged = true
        }
        this.editTrackIndex = null
        if (somethingChanged) {
          this.dirty = true
        }
      }
    },
    removeTrack () {
      if (this.editTrackIndex !== null) {
        const trackToBeDeleted = this.tracks[this.editTrackIndex]
        this.editTrackIndex = null
        this.tracks = this.tracks.filter(track => track !== trackToBeDeleted)
        this.maxTrackDuration = this.checkForHigherTrackDuration()
      }
    },
    updateTrackVolume (v: number) {
      if (this.editTrackIndex !== null) {
        const track = this.tracks[this.editTrackIndex]
        track.volume = v
        if (track.gain !== undefined) {
          track.gain.gain.value = v
        }
      }
    },
    updateTrackPanning (v: number) {
      if (this.editTrackIndex !== null) {
        const track = this.tracks[this.editTrackIndex]
        track.panning = v
        if (track.panner !== undefined) {
          track.panner.pan.value = v
        }
      }
    },
    updateTrackOffset (v: number) {
      if (this.editTrackIndex !== null) {
        const track = this.tracks[this.editTrackIndex]
        track.offset = v
        track.effectiveDuration = track.audioBuffer.duration - v
      }
    }
  }
}
</script>

<style lang="scss">
.track-settings {
  padding-top: 3em;
  .inline-button{
    @include clickable-surface;
    display: inline-block;
    &.danger {
      background-color: $warn;
      color: #fff;
    }
  }
  input {
    padding: 1em;
  }
}
</style>
