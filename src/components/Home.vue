<template>
  <div class="home">
    <h1>ajam</h1>
  <i>asynchronous jamming</i><br/>
    <img class="logo" alt="ajam logo" src="../assets/logo.png" />
    <div v-if="ipfsState === 'initialized'">
      <div class="project new" @click="this.$emit('newProject')">new project</div>
      <h4 v-if="sessionHistory.length > 0">recent projects</h4>
      <p class="project" v-for="(rse, key) in sessionHistory" :key="key">
        {{ rse.title }} <br />
        <span class='small'>{{ rse.cid }}</span> <br/>
        <i class='date'>{{ Date(rse.timestamp).toLocaleString() }}</i>
      </p>
    </div>
    <p v-else-if="ipfsState === 'failed'" class='error'>
      failed to connect to ipfs
    </p>
    <p v-else>
      connecting to ipfs: {{ ipfsState }}
    </p>
    <div class="cornerbutton info"
      @click="this.$emit('gotoInfo')"></div>
    <!-- <div class="cornerbutton settings"></div> -->
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

import { ipfsWrapper } from '@/ipfs-wrapper'

import RecentSessionEntry from '@/datamodel/RecentSessionEntry'

@Options({
  components: {},
  emits: ['newProject', 'gotoInfo']
})
export default class Home extends Vue {
  ipfsState = ipfsWrapper.state
  sessionHistory: RecentSessionEntry[] = []
  mounted() {
    this.sessionHistory = RecentSessionEntry.getHistory()
  }
  newProject() {
    console.log('newProject')
  }
}
</script>

<style lang="scss">
.home {
  text-align: center;
  .logo {
    width: 80%;
    max-width: 512px;
  }
  h1 {
    margin-bottom: 0.1em;
  }
  .project{
    @include clickable-surface;
    &.new{
      padding: 1.5em 1em;
      margin-bottom: 2.5em;
    }
    .small {
      font-size: 0.5em;
    }
    .date {
      font-size: 0.5em;
    }
  }
  .cornerbutton{
    background-size: 50%;
    &.info {
      background-image: url("~@/assets/icons/info.svg");
      right: 1em;
      top: 1em;
    }
    &.settings {
      background-image: url("~@/assets/icons/settings.svg");
      left: 0.5em;
      top:0.5em;
  }
  }
}
</style>
