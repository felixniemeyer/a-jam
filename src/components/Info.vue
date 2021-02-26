<template>
  <div class='cornerbutton back' @click="this.$emit('goHome')">
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
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import Copyable from '@/components/Copyable.vue'

@Options({
  components: {
    Copyable
  },
  emits: ['goHome']
})
export default class Info extends Vue {
}
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
    color: $warn; 
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
