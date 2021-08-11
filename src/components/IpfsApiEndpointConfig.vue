<template>
  <h4>usage</h4>
  <div class="ipfsApiEndpointConfig">
    <div>
      node api host:
      <input v-model="endpoint.host" @change="persistIpfsSettings">
    </div>
    <div>
      node api port:
      <input type="number" v-model="endpoint.port" @change="persistIpfsSettings">
    </div>
    <div>
      node api protocol: {{ endpoint.protocol }}
    </div>
    <p>
      Hint: The target ipfs node needs to be configured to allow CORS.
      Set HTTPHeaders like for example:
    </p>
    <p class="code">
      API.HTTPHeaders.Access-Control-Allow-Origin:
      [
      "k51qzi5uqu5dgggo67rgyka2qo75vrsylw2idc3j6f570kthbikc8yuzyavflf.ipns.localhost"
      ].
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
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
