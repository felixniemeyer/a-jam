<template>
  <div class="track" :style="{ width: `calc(3em + ${relativeDuration} * (100% - 3.4em)`}">
    <div class="name">
      <span class="edit"></span>
      <div class="text">
        {{ name }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import ColorHash from 'color-hash'

@Options({
  components: {},
  emits: ['goHome']
})
export default class Track extends Vue {
  @Prop(String) cid: string | undefined
  @Prop({ default: 1 }) relativeDuration!: number

  name = 'new track';
  get color() {
    if (this.cid) {
      const ch = new ColorHash({ lightness: 0.4 })
      return ch.hex(this.name)
    } else {
      return '#555'
    }
  }
}
</script>

<style lang="scss">
.track {
  position: relative;
  background-color: #234;
  color: #eee;
  margin: 0.2em;
  border-radius: 0.5em;
  width: 50px;
  .name {
    .text {
      background-color: #2348;
      position: absolute;
      white-space: nowrap;
      top: 50%;
      left: 3em;
      padding: 0.25em 0.45em 0.25em 0;
      border-radius: 0 0.5em 0.5em 0 ;
      transform: translate(0, -50%);
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
