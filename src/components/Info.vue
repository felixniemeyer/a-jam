<template>
  <div class='cornerbutton back' @click="this.$emit('goHome')">
  </div>
  <div class='container'>
    <h1>ajam</h1>
    <i>about</i> <br/>
    author: felix paul niemeyer <br/>
    github: ... <br/>
    eth: ... <br/>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

@Options({
  components: {
  },
  emits: ['goHome']
})
export default class Info extends Vue {
}
</script>

<style lang="scss">
.container {
  position: absolute;
  top: 33%;
  left: 50%;
  width: 100%;
  transform: translate(-50%, -50%);
}

</style>
