<template>
  <h4>api endpoint</h4>
  <div class="ipfsInterfaceUsageConfig">
    <div>
      <input
        type="checkbox"
        :id="`enable${id}`"
        v-model="usage.enabled"
        @change="persistIpfsSettings"/>
      <label :for="`enable${id}`">
        Enable this ipfs interface.
      </label>
    </div>
    <div>
      <input
        type="number"
        :id="`retrievalPrio${id}`"
        v-model="usage.useForRetrievalPriority"
        @change="persistIpfsSettings"/>
      <label :for="`retrievalPrio${id}`">
        Set this interface's priority for content retrieval from ipfs. The interface with the highest priority will be used for content retrieval.
      </label>
    </div>
    <div>
      <input
        type="checkbox"
        :id="`pinning${id}`"
        v-model="usage.useForPinning"
        @change="notifyIpfsSettingsChange"/>
      <label :for="`pinning${id}`">Use this ipfs interface for pinning.</label>
    </div>
    <div>
      <input
        type="checkbox"
        :id="`pinForeign${id}`"
        v-model="usage.pinForeignSessions"
        @change="persistIpfsSettings"/>
      <label :for="`pinForeign${id}`">
        Pin sessions when loading jam sessions in order to improve availability.
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IpfsInterfaceUsage } from '@/ipfs-wrapper'

export default defineComponent({
  props: {
    usage: {
      type: Object,
      required: true
    },
    id: {
      type: String,
      required: true
    }
  }
})
</script>

<style lang="scss">

.ipfsInterfaceUsageConfig {
  text-align: left;
}

</style>
