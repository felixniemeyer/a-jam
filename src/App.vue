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

</style>
