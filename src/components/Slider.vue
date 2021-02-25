<template>
  <div class="slider">
    {{name}}: {{value.toFixed(decimalPlaces)}}
    <div class="bar" ref="bar">
      <div class="dot"
        :style="{left: `${(this.value - this.from) / (this.to - this.from) * 100}%`}"
        @mousedown.prevent="startDrag"
        @touchstart.prevent="startDrag"
        @mouseup.prevent="endDrag"
        @touchend.prevent="endTouch"
        @touchcancel.prevent="endTouch">
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Options({
  components: {},
  emits: ['update']
})
export default class Log extends Vue {
  @Prop() name!: string
  @Prop() from!: number
  @Prop() to!: number
  @Prop() value!: number
  @Prop() decimalPlaces = 2

  dragging = false
  dragOffset = 0
  x0 = 0
  width = 1

  mounted() {
    document.addEventListener('mouseup', this.endDrag)
    document.addEventListener('mouseleave', this.endDrag)
    document.addEventListener('mousemove', this.drag)

    document.addEventListener('touchend', this.endTouch)
    document.addEventListener('touchcancel', this.endTouch)
    document.addEventListener('touchmove', this.drag)
  }

  startDrag(e: MouseEvent | TouchEvent) {
    const bound = (this.$refs.bar as HTMLDivElement).getBoundingClientRect()
    this.x0 = bound.left
    this.width = bound.right - bound.left
    this.dragOffset = 0
    const v = this.getV(e)
    this.dragging = true
    this.dragOffset = (this.value - v) / (this.to - this.from)
  }

  endDrag(e: MouseEvent | TouchEvent) {
    this.drag(e)
    this.dragging = false
  }

  endTouch() {
    this.dragging = false
  }

  drag(e: MouseEvent | TouchEvent) {
    if (this.dragging) {
      const v = this.getV(e)
      this.$emit('update', v)
    }
  }

  getV(e: MouseEvent | TouchEvent) {
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
  }

  beforeUnmount() {
    console.log('destroying Slider')
    document.removeEventListener('mouseup', this.endDrag)
    document.removeEventListener('mouseleave', this.endDrag)
    document.removeEventListener('mousemove', this.drag)

    document.removeEventListener('touchend', this.endDrag)
    document.removeEventListener('touchcancel', this.endDrag)
    document.removeEventListener('touchmove', this.drag)
  }
}
</script>

<style lang="scss">
$dotsize: 3em;

.slider {
  .bar{
    position: relative;
    width: calc(96% - #{$dotsize});
    height: 0.4em;
    background: linear-gradient(180deg, #888, #ccc 80%, #aaa);
    margin: ($dotsize / 2) auto ($dotsize * 3 / 2) 2%;
    border-radius: 0.2em;
    left: 5%;
    .dot {
      box-shadow: 0 0 0.5em #0007;
      position: absolute;
      height: $dotsize;
      width: $dotsize;
      top: 50%;
      transform: translate(-50%, -50%);
      border-radius: $dotsize / 2;
      background-color: rgb(132, 205, 223);
      box-sizing: border-box;
      border: 0.4em solid rgb(9, 112, 138);
    }
  }
}
</style>
