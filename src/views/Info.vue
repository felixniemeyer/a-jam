<template>
  <div class='cornerbutton back' @click="$router.go(-1)">
  </div>
  <div class='container'>
    <h1>a-jam</h1>
    <p>This app enables you to record musical ideas and share them with your friends so that they can add their ideas. It's like a jam session but...
    </p><p><i>asynchronous</i>. </p>
    <p class='ipfs-info'>This app uses <a href="https://ipfs.io/">IPFS</a> to store audio files and jam sessions.</p>
    <p class='local-storage'>Settings and project history are stored in the browser local storage. They may be lost, when you clear your browser data</p>
    <p class='author'>
      created by felix paul niemeyer <br/>
      <a href="https://github.com/felixniemeyer">github.com/felixniemeyer</a>
    </p>
    eth address
    <Copyable text="0xc077b94DdA5358074F519C38b7237b17167a2394"/>
    (click to copy)
    <p>There are affiliate links to unstoppable domains in this web app.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Copyable from '@/components/Copyable.vue'

export default defineComponent({
  components: {
    Copyable
  }
})
</script>

<style lang="scss">
.container {
  p {
    margin: 1em 2em;
  }
  .ipfs-info{
    color: rgb(18, 92, 134)
  }
  .local-storage{
    color: $danger;
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
