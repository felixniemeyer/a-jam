<template>
  <div class="section">
    <div class="header" @click="toggle" :class="{closed}">
      {{ title }}
    </div>
    <div class="content" :class="{closed}">
      <slot v-if="!closed"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    title: String,
    initiallyClosed: {
      default: false,
      type: Boolean
    }
  },
  data () {
    return {
      closed: this.initiallyClosed
    }
  },
  methods: {
    toggle () {
      this.closed = !this.closed
    }
  }
})
</script>

<style lang="scss">

.section{
  margin: 0.5em 0.2em;
  overflow: hidden;
  border-radius: 1em;
  border: 0.2em solid #aaa;
  .header {
    background-color: #aaa;
    font-weight: bold;
    padding: 0.5em;
    display: block;
    width: 100%;
    color: #fff;
    cursor: pointer;
    user-select: none;
    &::after{
      content: " ▲"
    }
    &.closed::after {
      content: " ▼"
    }
  }
  .content {
    padding: 0.5em;
    &.closed {
      padding: 0em;
    }
  }
}
</style>
