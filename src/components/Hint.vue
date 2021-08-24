<template>
  <div class="hint">
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
      default: true,
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

<style lang="scss" scoped>

.hint{
  margin: 0.5em 1em;
  border-radius: 1em;
  overflow: hidden;
  text-align: center;
  .header{
    background-color: #555;
    padding: 0.5em;
    display: block;
    cursor: pointer;
    user-select: none;
    &::before{
      content: "▲ "
    }
    &.closed::before{
      content: "▼ "
    }
  }
  .content {
    background-color: #222;
    padding: 0.5em;
    &.closed {
      padding: 0em;
    }
  }
  h4{
    margin: 0.5em;
  }
}
</style>
