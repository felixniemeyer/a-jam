<template>
  <div class="publishing">
    <h1> publishing... </h1>
    <Log
      :entries="publishingLog"/>
    <div v-if="publishing === 'done'">
      <p
        v-if="publishingError !== null"
        class="error">
        {{ publishingError }}
      </p>
      <a href="https://unstoppabledomains.com/r/ac3b8968ad7245e" target="_blank" class="ud-affiliate">
        Want a blockchain domain so that users can easily find your music on the decentralized web? <b>Click here.</b> (affiliate link)
      </a>
      <div class="button" @click="confirmPublishResults()">
        return to session
      </div>
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
