<template>
  <h4>usage</h4>
  <div class="ipfsInterfaceUsageConfig">
    <table>
      <tr>
        <td>
          <input
            type="checkbox"
            v-model="usage.enabled"
            @change="toggle"/>
        </td>
        <td>
          Enable this ipfs interface.
        </td>
      </tr>
      <tr>
        <td>
          <input
            type="checkbox"
            @change="change"
            v-model="usage.useForPinning"/>
        </td>
        <td>
          Use this ipfs interface for pinning.
        </td>
      </tr>
      <tr>
        <td>
          <input
            type="checkbox"
            :id="`pinOnRetrieve${id}`"
            @change="change"
            v-model="usage.pinOnRetrieve"/>
        </td>
        <td>
          Pin sessions when loading jam sessions in order to improve availability.
        </td>
      </tr>
    </table>
    <input
      type="number"
      :id="`retrievalPrio${id}`"
      @change="change"
      v-model="usage.useForRetrievalPriority"/>
      Retrieval priority.
      <Tooltip text="The interface with the highest priority will be used for content retrieval."/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import Tooltip from '@/components/Tooltip.vue'

export default defineComponent({
  components: {
    Tooltip
  },
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
