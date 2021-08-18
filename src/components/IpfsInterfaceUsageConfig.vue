<template>
  <h4>usage</h4>
  <div class="ipfsInterfaceUsageConfig">
    <div>
      <input
        type="checkbox"
        :id="`enable${id}`"
        v-model="usage.enabled"
        @change="toggle"/>
      <label :for="`enable${id}`">
        Enable this ipfs interface.
      </label>
    </div>
    <div>
      <input
        type="number"
        :id="`retrievalPrio${id}`"
        @change="change"
        v-model="usage.useForRetrievalPriority"/>
      <label :for="`retrievalPrio${id}`">
        Set this interface's priority for content retrieval from ipfs. The interface with the highest priority will be used for content retrieval.
      </label>
    </div>
    <div>
      <input
        type="checkbox"
        :id="`pinning${id}`"
        @change="change"
        v-model="usage.useForPinning"/>
      <label :for="`pinning${id}`">
        Use this ipfs interface for pinning.
      </label>
    </div>
    <div>
      <input
        type="checkbox"
        :id="`pinForeign${id}`"
        @change="change"
        v-model="usage.pinForeignSessions"/>
      <label :for="`pinForeign${id}`">
        Pin sessions when loading jam sessions in order to improve availability.
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: ['disable', 'enable', 'change'],
  props: {
    usage: {
      type: Object,
      required: true
    },
    id: {
      type: String,
      required: true
    }
  },
  methods: {
    toggle () {
      if (this.usage.enabled) {
        this.$emit('enable')
      } else {
        this.$emit('disable')
      }
      this.change()
    },
    change () {
      this.$emit('change')
    }
  }
})
</script>

<style lang="scss">

.ipfsInterfaceUsageConfig {
  text-align: left;
}

</style>
