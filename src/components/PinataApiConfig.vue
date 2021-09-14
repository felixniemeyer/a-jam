<template>
  <h4>api key</h4>
  <div class="pinataApiConfig">
    <div class='field'>
      <input v-model="settings.apiKey" @change="$emit('change')">
      api key
    </div>
    <div class='field'>
      <input v-model="settings.secret" @change="$emit('change')">
      secret
    </div>
    <div class='field'>
      <input v-model="settings.gatewayUrl" disabled @change="$emit('change')">
      gateway url
    </div>
    <div class='field'>
      <input v-model="settings.apiBaseUrl" disabled @change="$emit('change')">
      api base url
    </div>
    <Hint title="Get a pinata API key with 1GB free storage">
      <p class="code">
        You can create a pinata account with 1GB of free storage on the
        <a href="https://www.pinata.cloud/">website</a>.
        When you have an account, create a new API key and configure the credentials in these settings here. Make sure to tick pinByHash, pinFileToIPFS and pinJSONToIPFS when creating the api key.
      </p>
    </Hint>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import Hint from '@/components/Hint.vue'

export default defineComponent({
  components: {
    Hint
  },
  emits: ['change'],
  props: {
    settings: {
      type: Object,
      required: true
    }
  }
})
</script>

<style lang="scss">
.pinataApiConfig{
  text-align: left;
  .field {
  }
}
</style>
