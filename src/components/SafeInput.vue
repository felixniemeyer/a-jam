<template>
  <input
    @focus="fixPageWidth"
    />
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  setup() {
  },
  unmounted() {
    this.releasePageWidthFix()
  },
  methods: {
    fixPageWidth(){
      document.body.style.setProperty('width', `${document.body.clientWidth}px`)
    },
    releasePageWidthFix(){
      document.body.style.removeProperty('width')
    }
  }
})
</script>

<style lang="sass">

</style>
