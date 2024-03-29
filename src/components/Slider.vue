<template>
  <div class="slider">
    {{name}}: {{(value*factor).toFixed(decimalPlaces)}}{{unit}}
    <div class="bar" ref="bar">
      <div class="left">{{left}}</div>
      <div class="right">{{right}}</div>
      <div class="dot"
        :style="{left: `${(this.value - this.from) / (this.to - this.from) * 100}%`}"
        @mousedown.prevent="startDrag"
        @touchstart.prevent="startDrag">
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: ['update', 'drag-end'],
  props: {
    name: String,
    from: {
      type: Number,
      required: true
    },
    to: {
      type: Number,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    left: {
      type: String,
      default: 'low'
    },
    right: {
      type: String,
      default: 'high'
    },
    decimalPlaces: {
      type: Number,
      default: 2
    },
    factor: {
      type: Number,
      default: 1
    },
    unit: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      dragging: false,
      dragOffset: 0,
      x0: 0,
      width: 1
    }
  },
  mounted () {
    document.addEventListener('mouseup', this.endMouse)
    document.addEventListener('mouseleave', this.endMouse)
    document.addEventListener('mousemove', this.drag)

    document.addEventListener('touchend', this.endTouch)
    document.addEventListener('touchcancel', this.endTouch)
    document.addEventListener('touchmove', this.drag)
  },
  methods: {
    startDrag (e: MouseEvent | TouchEvent) {
      const bound = (this.$refs.bar as HTMLDivElement).getBoundingClientRect()
      this.x0 = bound.left
      this.width = bound.right - bound.left
      this.dragOffset = 0
      const v = this.getV(e)
      this.dragging = true
      this.dragOffset = (this.value - v) / (this.to - this.from)
    },
    endMouse (e: MouseEvent | TouchEvent) {
      this.drag(e)
      this.endDrag()
    },
    endTouch () {
      this.endDrag()
    },
    endDrag () {
      if (this.dragging) {
        this.dragging = false
        this.$emit('drag-end')
      }
    },
    drag (e: MouseEvent | TouchEvent) {
      if (this.dragging) {
        const v = this.getV(e)
        this.$emit('update', v)
      }
    },
    getV (e: MouseEvent | TouchEvent) {
      let x = 0
      if (e instanceof MouseEvent) {
        x = e.x
      } else if (e instanceof TouchEvent) {
        x = e.touches[0].pageX
      }
      let r = (x - this.x0) / this.width
      r += this.dragOffset
      r = Math.min(1, Math.max(0, r))
      return this.from + (this.to - this.from) * r
    },
    beforeUnmount () {
      document.removeEventListener('mouseup', this.endDrag)
      document.removeEventListener('mouseleave', this.endDrag)
      document.removeEventListener('mousemove', this.drag)

      document.removeEventListener('touchend', this.endDrag)
      document.removeEventListener('touchcancel', this.endDrag)
      document.removeEventListener('touchmove', this.drag)
    }
  }
})
</script>

<style lang="scss">
$dotsize: 3em;

.slider {
  background-color: #282828;
  border: 0.1em solid #444;
  margin: 0.3em 1em;
  border-radius: 0.2em;
  padding: 0.9em 0;
  .bar {
    position: relative;
    width: calc(100% - #{$dotsize});
    height: 0.35em;
    background: linear-gradient(180deg, darken($turquoise, 30%), #bbb);
    margin-top: $dotsize * 0.7 ;
    margin-bottom: $dotsize * 0.3;
    border-radius: 0.2em;
    left: $dotsize * 0.5;
    .dot {
      box-shadow: 0 0 0.5em #0007;
      position: absolute;
      height: $dotsize;
      width: $dotsize;
      top: 50%;
      transform: translate(-50%, -50%);
      border-radius: $dotsize * 0.5;
      background-color: darken($turquoise, 10%);
      box-sizing: border-box;
      border: 0.4em solid darken($turquoise, 30%);
    }
    .right, .left{
      position: absolute;
      bottom: 0.7em;
      color: #999;
    }
    .left {
      left: 0.5em;
    }
    .right {
      right: 0.5em;
    }
  }
}
</style>
