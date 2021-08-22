<template>
  <div class="tooltip" @click="closed=!closed">
    <div class="icon" :class="{hidden: !closed}" >
    </div>
    <span v-if="!closed">{{text}}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    text: String,
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

.tooltip {
  cursor: pointer;
  vertical-align: top;
  display: inline-block;
  background-color: lighten($blue, 0%);
  border-radius: 0.5em;
  .icon {
    display: inline-block;
    background-color: lighten($blue, 20%);
    border-radius: 0.75em;
    vertical-align: middle;
    overflow: hidden;
    background-image: url("~@/assets/icons/white/info.svg");
    background-size: 80%;
    background-position: center;
    background-repeat: no-repeat;
    width: 1.5em;
    height: 1.5em;
    &.hidden {
      display: none;
    }
  }
  span {
    display: inline-block;
    margin: 0.5em;
  }
}
</style>
