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
  <div v-if="showIpfsInfo" class="ipfs-info" @click="checkIpfsId">
    ipfs id: {{ipfsId}}
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data () {
    return {
      showIpfsInfo: true,
      ipfsId: ''
    }
  },
  mounted () {
    this.checkIpfsId()
  },
  methods: {
    checkIpfsId () {
      this.ipfsWrapper.getIpfsNodeId().then(
        id => {
          if (this.ipfsId !== id) {
            this.ipfsId = id
          }
        }
      ).catch(() => {
        this.ipfsId = 'none (ipfs not connected. click to refresh)'
      })
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
  color: rgb(128 + 64, 9, 9);
}

</style>
