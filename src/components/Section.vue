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

<style lang="scss" scoped>

.section{
  box-shadow: 0 0 0.5em #0002;
  margin: 0.5em 0.5em;
  overflow: hidden;
  border-radius: 0.5em;
  border: 0.14em solid darken($grey, 40%);
  .header {
    background-color: darken($grey, 40%);
    font-weight: bold;
    padding: 0.5em;
    margin:0;
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
    padding: 0em;
    background-color: rgba(84,91,111,0.05);
  }
  h4{
    margin: 0.5em;
  }
}
</style>
