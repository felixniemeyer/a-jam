<template>
  <div class="slider">
    <div class="namevalue">
      {{name}}: {{value}}
    </div>
    <div class="bar">
      <div class="dot"
        @click="startdrag">
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { Prop } from 'vue-property-decorator'


@Options({
  components: {}, 
  emits: ['change']
})
export default class Log extends Vue {
  @Prop() name!: string
  @Prop() from!: number
  @Prop() to!: number 
  @Prop() value!: number 
}
</script>

<style lang="scss">
$dotsize: 3em; 

.slider {
  text-align: left;
  .namevalue{
    margin-left: calc(#{$dotsize} / 2);
  }
  .bar{
    position: relative;
    width: calc(96% - #{$dotsize}); 
    height: 0.4em; 
    box-sizing: border-box;
    background: linear-gradient(180deg, #555, #666, #bbb);
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
      background-color: rgb(9, 112, 138);
    }
  }
}
</style>
