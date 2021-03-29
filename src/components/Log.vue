<template>
  <div class="log">
    <div v-for="(entry, index) in entries" :key="index">
      <p class="msg" v-if="entry.type === 'msg'">
        {{ entry.s }}
      </p>
      <div v-else>
        <Copyable
          :text="entry.s"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import Copyable from '@/components/Copyable.vue'

export interface LogEntry {
  type: 'msg' | 'copyable'
  s: string
}

export default defineComponent({
  components: {
    Copyable
  },
  props: {
    entries: {
      type: Array as PropType<LogEntry[]>
    }
  }
})
</script>

<style lang="scss">
.log {
  font-family: monospace;
  .msg {
    margin: 1em 1em 0 1em;
  }
}
</style>
