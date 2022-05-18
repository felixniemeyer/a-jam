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

$texareaBgc: #282828;
.copyable{
  position: relative;
  margin: 0.33em auto;
  width: 80%;
  .text{
    overflow: hidden;
    color: $pink;
    background-color: $texareaBgc;
    border: 0.3em solid $texareaBgc;
    padding: 0.5em;
    border-radius: 0.9em;
    box-sizing: border-box;
    height: 3em;
    width: 100%;
    box-sizing: border-box;
    &:focus {
      outline: none;
    }
  }
  .copy-hint, .action{
    font-family: default;
    position: absolute;
    right: 0em;
    bottom: 0.5em;
    padding: 0.6em 0.8em;
    border-radius: 1em;
    color: #fff;
  }
  .copy-hint {
    background-color: $blue;
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
    background-color: desaturate($brown, 20%);
  }
}
</style>
