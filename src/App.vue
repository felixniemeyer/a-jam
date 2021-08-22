<template>
  <div v-if="ipfsWrapper.errorLog.value.length > 0" class="ipfs-errors">
    <h4>
      ipfs errors
    </h4>
    <ul>
      <li v-for="(errorMsg, key) in ipfsWrapper.errorLog.value" :key="key">
        {{ errorMsg }}
      </li>
    </ul>
    <p>
      If you keep getting these errors, check your ipfs settings
    </p>
    <div class="dismiss" @click="ipfsWrapper.errorLog.value = []">
      dismiss
    </div>
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

.ipfs-errors {
  background-color: rgb(128 + 64, 9, 9);
  min-width: 50%;
  position: fixed;
  top: 2em;
  left: 50%;
  transform: translate(-50%, 0);
  border-radius: 0.5em;
  box-shadow: 0 0 3em #000;
  ul {
    text-align: left;
  }
  p {
    margin: 1em;
  }
  .dismiss {
    @include clickable-surface;
  }
}

</style>
