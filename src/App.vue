<template>
  <div id="nav">
    <router-link to="/">Home</router-link> |
    <router-link to="/session">Session</router-link> |
    <router-link to="/info">Info</router-link> |
    <router-link to="/settings">Settings</router-link>
  </div>
  <p v-if="ipfsState === 'failed'" class='error'>
    failed to connect to ipfs
  </p>
  <p v-else-if="ipfsState === 'initializing'">
    connecting to ipfs: {{ ipfsState }}
  </p>
  <router-view></router-view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { ipfsWrapper } from '@/ipfs-wrapper'


export default defineComponent({
  computed: {
    ipfsState() {
      return ipfsWrapper.state
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
