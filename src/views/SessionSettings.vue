<template>
  <div class="renaming">
    <div v-if="base !== undefined">
      <p> this jam is based on: </p>
      <Copyable :text="base"/>
      <p class="small"> <i> {{ Date(baseDate).toLocaleString() }}</i></p>
    </div>
    <h3> rename session </h3>
    <input :value="title" ref="newSessionTitle" @keyup="$event.key === 'Enter' ? updateName() : {}" >
    <div>
      <div class="inline-button" @click="renaming=false">cancel</div>
      <div class="inline-button" @click="updateName">ok</div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  setup() {

  },
})
</script>

<style lang="sass">

</style>
