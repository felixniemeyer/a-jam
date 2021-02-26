<template>
  <div class="settings">
    <h1>settings</h1>
    <Slider
      name="default recording offset in ms"
      left="more delayed"
      right="earlier"
      :factor="1000"
      :decimalPlaces="0"
      :from="initialOffset-0.100"
      :to="initialOffset+0.100"
      :value="defaultRecordingOffset"
      @dragEnd="resetInitialOffset"
      @update="v => $emit('update-default-recording-offset', v)" />
    <div>
      <div class="inline-button" @click="$emit('go-home')">done</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import Copyable from '@/components/Copyable.vue'
import Slider from '@/components/Slider.vue'

@Options({
  components: {
    Copyable,
    Slider
  },
  emits: ['go-home', 'update-default-recording-offset']
})
export default class Info extends Vue {
  @Prop() defaultRecordingOffset!: number
  initialOffset: number = this.defaultRecordingOffset

  resetInitialOffset () {
    this.initialOffset = this.defaultRecordingOffset
  }
}
</script>

<style lang="scss">
.settings{
  .inline-button{
    @include clickable-surface;
    display: inline-block;
  }
}

</style>
