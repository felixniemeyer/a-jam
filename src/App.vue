<template>
  <!--div id="nav">
    <router-link to="/">Home</router-link> |
  </div-->
  <router-view v-if="ipfsWrapper.state.value === 'initialized'"></router-view>
  <p v-if="ipfsWrapper.state === 'failed'" class='error'>
    failed to connect to ipfs
  </p>
  <p v-else-if="ipfsWrapper.state === 'initializing'">
    connecting to ipfs: {{ ipfsWrapper.state }}
  </p>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
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
