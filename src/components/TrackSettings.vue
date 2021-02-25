<template>
  <div class="track-settings">
    <h3>rename track</h3>
    <input :value="track.name" ref="name" @keyup="submitOnEnter">
    <div>
      <div class="inline-button" @click="$emit('back')">back</div>
      <div class="inline-button" @click="changeName">ok</div>
    </div>
    <Slider
      name="volume"
      :from="0.0"
      :to="2.0"
      :value="track.volume"
      @update="v => $emit('update-volume', v)" />
    <Slider
      name="panning"
      :from="-1.0"
      :to="1.0"
      :value="track.panning"
      @update="v => $emit('update-panning', v)" />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import Track from '@/datamodel/Track'

import Slider from '@/components/Slider.vue'

@Options({
  components: {
    Slider
  },
  emits: ['back', 'change-name', 'update-volume', 'update-panning']
})
export default class TrackSettings extends Vue {
  @Prop(Track) track!: Track

  mounted() {
    (this.$refs.name as HTMLInputElement).select()
  }

  submitOnEnter($event: KeyboardEvent) {
    if ($event.key === 'Enter') {
      this.changeName()
    }
  }

  changeName() {
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
