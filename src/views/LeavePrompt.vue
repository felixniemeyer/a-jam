<template>
  <div v-if="showLeavePromt"
    class="dialogue">
    <h1>save your changes</h1>
    <p>you have made changes to this session.</p>
    <p>if you close the editor they will be lost. </p>
    <p>publish the session to persist changes </p>
    <div class="inline-button"
      @click="confirmLeave">
      still close
    </div>
    <div class="inline-button"
      @click="showLeavePromt = false">
      stay
    </div>
    <div class="inline-button"
      @click="showLeavePromt = false; publish()">
      publish session
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  setup() {

  },
})
</script>

<style lang="sass">

</style>
