<template>
  <div class="track-settings">
    <div v-if="track.cid !== undefined">
      <p> this track refers to this audio file: </p>
      <Copyable :text="track.cid"/>
    </div>
    <h3>rename track</h3>
    <input :value="track.name" ref="name" @keyup="submitOnEnter">
    <div class="inline-button" @click="changeName">rename</div>
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
      @update="v => $emit('update-offset', v)" />
    <div>
      <div class="inline-button" @click="$emit('back')">back</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import Track from '@/datamodel/Track'

import Slider from '@/components/Slider.vue'
import Copyable from '@/components/Copyable.vue'

@Options({
  components: {
    Slider,
    Copyable
  },
  emits: ['back', 'change-name', 'update-volume', 'update-panning', 'update-offset']
})
export default class TrackSettings extends Vue {
  @Prop(Track) track!: Track
  initialOffset: number = this.track.offset

  mounted () {
    (this.$refs.name as HTMLInputElement).select()
  }

  submitOnEnter ($event: KeyboardEvent) {
    if ($event.key === 'Enter') {
      this.changeName()
    }
  }

  changeName () {
    this.$emit('change-name', (this.$refs.name as HTMLInputElement).value)
  }
}
</script>

<style lang="scss">
.track-settings {
  position: absolute;
  width: 100%;
  top: 50%;
  transform: translate(0, -50%);
  .inline-button{
    @include clickable-surface;
    display: inline-block;
  }
  input {
    padding: 1em;
  }
}
</style>
