<template>
  <div class="settings">
    <h1>settings</h1>
    <div>
      <div class="inline-button" @click="exportSettings">exportSettings</div>
      <div class="inline-button" @click="importSettings">importSettings</div>
    </div>
    <Slider
      name="default recording offset in ms"
      left="more delayed"
      right="earlier"
      :factor="1000"
      :decimalPlaces="0"
      :from="initialOffset-0.100"
      :to="initialOffset+0.100"
      :value="defaultRecordingOffset"
      @dragEnd="resetInitialRecordingOffset"
      @update="updateDefaultRecordingOffset" />
    <div>
      <div class="inline-button" @click="$router.go(-1)">done</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import Slider from '@/components/Slider.vue'

export default defineComponent({
  components: {
    Slider
  },
  data () {
    return {
      persistDefaultRecordingOffsetTimeout: undefined as NodeJS.Timeout | undefined,
      initialRecordingOffset: this.state.settings.defaultRecordingOffset
    }
  },
  resetInitialRecordingOffset () {
    this.initialRecordingOffset = this.state.settings.defaultRecordingOffset
  },
  updateDefaultRecordingOffset (v: number) {
    this.state.settings.defaultRecordingOffset = v
    if (this.persistDefaultRecordingOffsetTimeout !== undefined) {
      clearTimeout(this.persistDefaultRecordingOffsetTimeout)
    }
    this.persistDefaultRecordingOffsetTimeout = setTimeout(() => {
      localStorage.setDefaultRecordingOffset(v)
    }, 500)
  }
})

</script>

<style lang="scss">
.settings{
  .inline-button{
    @include clickable-surface;
    display: inline-block;
  }
}

</style>
