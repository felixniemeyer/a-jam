<template>
  <div class="log">
    <div v-for="(entry, index) in entries" :key="index">
      <h3 class="headline" v-if="entry.type === 'headline'"> {{ entry.s }} </h3>
      <Copyable v-else-if="entry.type === 'copyable'" :text="entry.s"/>
      <p class="msg" v-else> {{ entry.s }} </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import Copyable from '@/components/Copyable.vue'

export interface LogEntry {
  type: 'msg' | 'copyable' | 'headline';
  s: string;
}

export default defineComponent({
  components: {
    Copyable
  },
  props: {
    entries: {
      type: Array as PropType<LogEntry[]>
    }
  },
  watch: {
    entries: {
      handler (oldval, newval) { // eslint-disable-line
        setTimeout(() => {
          window.scrollTo(0, document.body.scrollHeight)
        }, 0)
      },
      deep: true
    }
  }
})
</script>

<style lang="scss">
.log {
  .msg {
    margin: 1em 1em 0 1em;
  }
  .headline {
    margin-top: 2em;
  }
}
</style>
