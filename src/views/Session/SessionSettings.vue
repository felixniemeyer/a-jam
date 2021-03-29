<template>
  <div class="renaming">
    <div v-if="base !== undefined">
      <p> this jam is based on: </p>
      <Copyable :text="base"/>
      <p class="small"> <i> {{ Date(baseDate).toLocaleString() }}</i></p>
    </div>
    <h3> rename session </h3>
    <input :value="title" ref="newSessionTitle" @keyup="checkForEnterKey " >
    <div>
      <div class="inline-button" @click="leave">cancel</div>
      <div class="inline-button" @click="saveAndLeave">ok</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import WidthFreezer from '@/mixins/WidthFreezer'

export default defineComponent({
  mixins: [WidthFreezer], 
  mounted() {
    this.$nextTick(() => {
      (this.$refs.newSessionTitle as HTMLInputElement).select()
    })
  }, 
  data() {
    const localId = parseInt(this.$route.params.localId as string) 
    const session = this.state.sessions.local[localId]
    return {
      localId, 
      session, 
    }
  }, 
  methods: {
    saveAndLeave() {
      this.session.title = (this.$refs.newSessionTitle as HTMLInputElement).value
      this.session.dirty = false
      this.leave()
    }, 
    leave() {
      this.$router.go(-1)
    }, 
    checkForEnterKey($event: KeyboardEvent) {
      if($event.key === 'Enter'){
        this.saveAndLeave()
      }
    }
  }
})
</script>

<style lang="sass">

</style>
