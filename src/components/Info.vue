<template>
  <div class='cornerbutton back' @click="this.$emit('goHome')">
  </div>
  <div class='container'>
    <h1>ajam</h1>
    <p class='ipfs-info'>this app uses <a href="https://ipfs.io/">IPFS</a> to store audio files and jam sessions.</p>
    <p class='local-storage'>settings and project history are stored in the browser local storage. They may be lost, when you clear your browser data</p>
    <p class='author'>
      created by felix paul niemeyer <br/>
      github: https://github.com/felixniemeyer<br/>
      <button class="copy" @click="copyEthAddress()">copy eth addr</button><br/>
      <input ref="ethAddress" class="address" value="0xc077b94DdA5358074F519C38b7237b17167a2394">
    </p>
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
  copyEthAddress() {
    (this.$refs.ethAddress as HTMLInputElement).select()
    document.execCommand('copy')
  }
}
</script>

<style lang="scss">
.container {
  position: absolute;
  top: 33%;
  left: 50%;
  width: 100%;
  transform: translate(-50%, -50%);
  p {
    margin: 1em 2em;
  }
  .ipfs-info{
    color: rgb(26, 46, 102)
  }
  .local-storage{
    color: rgb(26, 102, 67)
  }
  .author{
    .address{
      font-size: 0.7em;
      height: 1em;
      border: none;
      vertical-align: middle;
    }
  }
}

</style>
