<template>
  <router-view></router-view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data () {
    return {
      showIpfsInfo: false,
    }
  }
})
</script>

<style lang="scss">
* {
  outline: 1px solid pink;
}
</style>
