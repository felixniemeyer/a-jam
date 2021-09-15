<template>
  <div class="session-settings">
    <h2> session settings </h2>
    <Section v-if="session.ancestor !== undefined" title="session ipfs info" :initiallyClosed="true">
      <div>
        <p> this session is derived from: </p>
        <Copyable
          :text="session.ancestor"
          action="derive another session"
          @click="loadSession(session.ancestor)"/>
      </div>
      <div v-if="session.ancestorsAncestor !== undefined">
        <p> it's ancestor is: </p>
        <div class="loadable">
          <Copyable
            :text="session.ancestorsAncestor"
            action="load ancestor session"
            @click="loadSession(session.ancestorsAncestor)"/>
        </div>
      </div>
    </Section>
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

import Copyable from '@/components/Copyable.vue'
import Section from '@/components/Section.vue'

export default defineComponent({
  components: {
    Copyable,
    Section
  },
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
    },
    loadSession (cid: string) {
      this.$router.push('/loadSession/' + cid)
    }
  }
})
</script>

<style lang="scss">

.session-settings{
  .small {
    font-size: 0.7em;
  }
  .inline-button{
    @include clickable-surface;
    display: inline-block;
  }
}

</style>
