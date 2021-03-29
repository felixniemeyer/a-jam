<template>
  <div id="nav">
    <router-link to="/">Home</router-link> |
    <router-link to="/session">Session</router-link> |
    <router-link to="/info">Info</router-link> |
    <router-link to="/settings">Settings</router-link>
  </div>
  <router-view v-if="ipfsState === 'initialized'"></router-view>
  <p v-if="ipfsWrapper.state === 'failed'" class='error'>
    failed to connect to ipfs
  </p>
  <p v-else-if="ipfsWrapper.state === 'initializing'">
    connecting to ipfs: {{ ipfsState }}
  </p>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { LocalSession } from '@/types'
import { storageWrapper } from '@/local-storage-wrapper'

import AudioContextPrompt from '@/components/AudioContextPrompt.vue'

export default defineComponent({
  components: {
    AudioContextPrompt
  },
  beforeCreate() {
  },
  data() {
    return {
    }
  },
  mounted() {
    this.state.sessions.recent = storageWrapper.getRecentSessions()
    this.state.settings = storageWrapper.getSettings()
  },
  methods: {
    createNewSession() {
      const localSessionId = this.state.sessions.nextLocalSessionId++
      this.state.sessions.local[localSessionId] = new LocalSession()
      this.$router.replace(`session/${localSessionId}`)
    },
  },
  provide() {
    return {
      state: this.state
    }
  }
})
</script>

<style lang="scss">
/* {
  outline: 1px solid pink;
} /**/
body {
  position: absolute;
  width: 100%;
  height: 100%;
  margin: 0;
  max-width: 60vh;
  left: 50%;
  transform: translate(-50%, 0);
  overflow-x: hidden;
}
#app {
  font-family: sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.error {
  color: rgb(128, 9, 9);
}

</style>
