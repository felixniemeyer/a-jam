<template>
  <h4>endpoint</h4>
  <div class="ipfsApiEndpointConfig">
    <div>
      <input v-model="endpoint.host" @change="$emit('change')">
      node api host
    </div>
    <div>
      <input type="number" v-model="endpoint.port" @change="$emit('change')">
      node api port
    </div>
    <div>
      <input v-model="endpoint.protocol" @change="$emit('change')">
      node api protocol
    </div>
    <Hint title="Configure ipfs node for CORS">
      <p>
        Set HTTPHeaders like for example:
      </p>
      <p class="code">
        API.HTTPHeaders.Access-Control-Allow-Origin:
        [
        "k51qzi5uqu5dgggo67rgyka2qo75vrsylw2idc3j6f570kthbikc8yuzyavflf.ipns.localhost"
        ].
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
    endpoint: {
      type: Object,
      required: true
    }
  }
})
</script>

<style lang="scss">
.ipfsApiEndpointConfig{
  text-align: left;
}
</style>
