<template>
  <div class="cid-view">
    <textarea class="cid" :value="cid" readonly @click="copyCid"></textarea>
    <div class="copy-hint" :class="{visible}">copied to clipboard!</div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Options({
  components: {
  }
})
export default class CID extends Vue {
  @Prop(String) cid!: string
  visible = false
  copyCid(event: Event) {
    console.log('heyyy')
    if (event.target instanceof HTMLTextAreaElement) {
      console.log('it is!')
      event.target.select()
      document.execCommand('copy')
      this.visible = true
      setTimeout(() => {
        this.visible = false
      }, 1000)
    }
  }
}
</script>

<style lang="scss">
.cid-view{
  position: relative;
  margin: 0.33em auto;
  width: 80%;
  .cid{
    color: #333;
    border: none;
    background-color: #ddd;
    padding: 0.5em;
    border-radius: 0.3em;
    box-sizing: border-box;
    width: 100%;
  }
  .copy-hint{
    position: absolute;
    right: 1em;
    top: 0.5em;
    padding: 0.6em 0.8em;
    border-radius: 1em;
    background-color: #1e5daf;
    color: #fff;
    transition: opacity ease-in-out 4s;
    pointer-events: none;
    opacity: 0;
    &.visible{
      opacity: 1;
    transition: opacity ease-in-out 0.1s;
    }
  }
}
</style>
