<template>
  <div class="copyable">
    <textarea class="text" :value="text" readonly @click="copyCid"></textarea>
    <div v-if="action !== undefined" class="action" @click="$emit('click')"> {{action}} </div>
    <div class="copy-hint" :class="{visible}">copied to clipboard!</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    text: String,
    action: String
  },
  emits: ['click'],
  data () {
    return {
      visible: false
    }
  },
  methods: {
    copyCid (event: Event) {
      if (event.target instanceof HTMLTextAreaElement) {
        event.target.select()
        document.execCommand('copy')
        this.visible = true
        setTimeout(() => {
          this.visible = false
        }, 1000)
      }
    }
  }
})
</script>

<style lang="scss">
.copyable{
  position: relative;
  margin: 0.33em auto;
  width: 80%;
  .text{
    color: #333;
    border: none;
    background-color: #ddd;
    padding: 0.5em;
    border-radius: 0.3em;
    box-sizing: border-box;
    height: 2em;
    width: 100%;
  }
  .copy-hint, .action{
    position: absolute;
    right: 0em;
    bottom: 0.5em;
    padding: 0.6em 0.8em;
    border-radius: 1em;
    color: #fff;
  }
  .copy-hint {
    background-color: #1e5daf;
    transition: opacity ease-in-out 4s;
    pointer-events: none;
    opacity: 0;
    &.visible{
      opacity: 1;
    transition: opacity ease-in-out 0.1s;
    }
  }
  .action {
    @include clickable-box-shadow();
    cursor: pointer;
    background-color: rgb(161, 101, 66);
  }
}
</style>
