<template>
  <div class="track-settings">
    <div v-if="base !== undefined">
      <p> this jam is based on: </p>
      <Copyable :text="base"/>
      <p class="small"> <i> {{ Date(baseDate).toLocaleString() }}</i></p>
    </div>
    <h3> rename session </h3>
    <input :value="title" ref="newSessionTitle">
    <div>
      <div class="inline-button" @click="leave">cancel</div>
      <div class="inline-button" @click="saveAndLeave">ok</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import WidthFreezer from '@/mixins/WidthFreezer'
import Keyhandler from '@/mixins/Keyhandler'

export default defineComponent({
  mixins: [WidthFreezer, Keyhandler],
  mounted () {
    this.$nextTick(() => {
      (this.$refs.newSessionTitle as HTMLInputElement).select()
    })
  },
  data () {
    const localId = parseInt(this.$route.params.localId as string)
    const session = this.state.sessions.local[localId]
    return {
      title: session.title,
      localId,
      session
    }
  },
  methods: {
    handleKeydown ($event: KeyboardEvent) {
      if ($event.key === 'Escape') {
        this.leave()
      }
      if ($event.key === 'Enter') {
        this.saveAndLeave()
      }
    },
    saveAndLeave () {
      this.session.title = (this.$refs.newSessionTitle as HTMLInputElement).value
      this.session.dirty = false
      this.leave()
    },
    leave () {
      this.$router.go(-1)
    }
  }
})
</script>

<style lang="scss">

.track-settings{
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(100% - 1em);
  transform: translate(-50%, -50%);
  input {
    padding: 1em;
  }
  .small {
    font-size: 0.7em;
  }
  .inline-button{
    @include clickable-surface;
    display: inline-block;
  }
}

</style>
