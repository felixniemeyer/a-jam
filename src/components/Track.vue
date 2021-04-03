<template>
  <div class="track" :style="{ width: `calc(3em + ${relativeDuration} * (100% - 3.4em)`, backgroundColor: color}" @click="$emit('editTrack')">
    <div class="name">
      <span class="edit"></span>
      <div class="text" :style="{ backgroundColor: color + '88'}">
        {{ name }}<span v-if="this.cid == undefined" class="small"> (unpublished)</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ColorHash from 'color-hash'

export default defineComponent({
  emits: ['editTrack'],
  props: {
    cid: {
      type: String,
      required: false
    },
    relativeDuration: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  computed: {
    color (): string {
      if (this.cid) {
        const ch = new ColorHash({ lightness: 0.4 })
        return ch.hex(this.cid)
      } else {
        return '#999999'
      }
    }
  }
})
</script>

<style lang="scss">
.track {
  position: relative;
  color: #eee;
  margin: 0.2em;
  border-radius: 0.5em;
  width: 50px;
  .name {
    .text {
      position: absolute;
      white-space: nowrap;
      top: 50%;
      left: 3em;
      padding: 0.25em 0.45em 0.25em 0;
      border-radius: 0 0.5em 0.5em 0 ;
      transform: translate(0, -50%);
      .small{
        font-size: 0.5em;
      }
    }
    .edit {
      @include centered-background-image;
      vertical-align: middle;
      display: inline-block;
      width: 2em;
      height: 2em;
      margin: 0.5em;
      opacity: 0.5;
      background-image: url("~@/assets/icons/white/edit.svg");
    }
  }
}
</style>
