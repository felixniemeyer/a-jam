<template>
  <div v-if="askForAC"
    class="dialogue">
    <h1>start audio context</h1>
    <p>ajam needs an AudioContext for handling audio data and for sound playback. </p>
    <div class="button"
      @click="$emit('clicked')">
      click here to enable AudioContext
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  emits: ['clicked']
})
</script>

<style lang="sass">

</style>
