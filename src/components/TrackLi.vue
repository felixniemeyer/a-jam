<template>
  <div class="track-li">
    <div class="track-bar" :style="{ width: `calc(3em + ${relativeDuration} * (100% - 3.4em)`, backgroundColor: color}" @click="$emit('editTrack')">
      <div class="name">
        <span class="edit"></span>
        <div class="text" :style="{ backgroundColor: color + '88'}">
          {{ name }}<span v-if="cid == undefined" class="small"> (unpublished)</span>
        </div>
      </div>
    </div>
    <div class="track-controls">
      <div class="mute" :class="{muted}" @click.stop="$emit('toggleMute')">M</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ColorHash from 'color-hash'

export default defineComponent({
  emits: ['editTrack', 'toggleMute'],
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
    },
    muted: {
      type: Boolean,
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
.track-li {
  position: relative;
  color: red;
  .track-bar {
    position: relative;
    color: #eee;
    margin: 0.2em;
    border-radius: 0.5em;
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
        cursor: pointer;
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
  .track-controls {
    position: absolute;
    right: 0.5em;
    top: 50%;
    transform: translate(0, -50%);
    .mute {
      user-select: none;
      display: inline-block;
      background-color: #555;
      box-shadow: 0 0 0.5em #0007;
      line-height: 2em;
      text-align: center;
      font-weight: bold;
      width: 2em;
      height: 2em;
      border-radius: 0.5em;
      color: #fff;
      cursor: pointer;
      transition: background-color 0.3s;
      &:hover {
        box-shadow: 0 0 0.2em #0005;
      }
      &.muted {
        background-color: #e52;
        box-shadow: 0 0 0.5em #e727;
      }
    }
  }
}
</style>
