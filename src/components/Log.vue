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
import { Options, Vue } from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import Copyable from '@/components/Copyable.vue'

class LogEntry {
  constructor(
    public type: 'msg' | 'copyable',
    public s: string
  ) {
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight)
    }, 100)
  }
}

@Options({
  components: {
    Copyable
  }
})
default class Log extends Vue {
  @Prop() entries: LogEntry[] = []
}

export { Log as default, LogEntry }

</script>

<style lang="scss">
.log {
  font-family: monospace;
  .msg {
    margin: 1em 1em 0 1em;
  }
}
</style>
