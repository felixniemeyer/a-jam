<template>
  <div class="ipfs-errors">
    <p class="error" v-for="(errorMsg, key) in ipfsWrapper.errorLog.value" :key="key">
      {{ errorMsg }}
    </p>
  </div>
  <router-view></router-view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data () {
    return {
      showIpfsInfo: false,
      ipfsId: ''
    }
  }
})
</script>

<style lang="scss">
/* {
  outline: 1px solid pink;
} /**/

.ipfs-info {
  z-index: 400;
  position: fixed;
  bottom: 9em;
  right: 1em;
  background-color: #080;
  color: #fff;
  opacity: 0.5;
  width: 20em;
  text-align: right;
  word-wrap: break-word;
}

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
  color: #fff ;
}

.ipfs-errors {
  background-color: rgb(128 + 64, 9, 9);
  position: fixed;
  top: 2em;
  left: 50%;
  transform: translate(-50%, 0);
}

</style>
