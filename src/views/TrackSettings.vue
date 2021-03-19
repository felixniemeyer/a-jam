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

import Track from '@/datamodel/Track'
import Slider from '@/components/Slider.vue'
import Copyable from '@/components/Copyable.vue'
import { useStore } from '@/store'

export default defineComponent({
  components: {
    Slider,
    Copyable
  },

  data() {
    const store = useStore()
    const trackId = parseInt(this.$route.params.track_id as string)
    return {
      trackId,
      initialOffset: store.state.tracks[trackId],
      confirmRemove: false
    }
  },
  mounted () {
    (this.$refs.name as HTMLInputElement).select()
  }

  submitOnEnter ($event: KeyboardEvent) {
    if ($event.key === 'Enter') {
      this.changeName()
    }
  }

  remove () {
    if (this.confirmRemove) {
      this.$emit('remove')
    } else {
      this.confirmRemove = true
    }
  }

  resetInitialOffset () {
    this.initialOffset = this.track.offset
  }

  changeName () {
    this.$emit('change-name', (this.$refs.name as HTMLInputElement).value)
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
