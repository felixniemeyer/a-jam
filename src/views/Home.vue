<template>
  <div class="home">
    <h1>a-jam</h1>
    <i>asynchronous jamming</i><br/>
    <img class="logo" alt="ajam logo" src="../assets/logo.png" />
    <div>
      <div class="project new" @click="createSession">new project</div>
      <h4 v-if="sessionHistory.length > 0">recent projects</h4>
      <p class="project" v-for="rse in sessionHistory" :key="rse.cid" @click="loadSession(rse.cid)">
        {{ rse.title }} <br />
        <span class='small'>{{ rse.cid }}</span> <br/>
        <i class='date'>{{ Date(rse.timestamp).toLocaleString() }}</i>
      </p>
    </div>
    <router-link tag="div" to="/info" class="cornerbutton info"></router-link>
    <router-link tag="div" to="/settings" class="cornerbutton settings"></router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { useStore } from '@/store'

const store = useStore()

export default defineComponent({
  methods: {
    loadSession(cid: string) {
      this.$router.push('loadSession')
      store.dispatch('loadSession', cid).then(
        localId => this.$router.replace(`session/${localId}`)
      )
    },
    createSession() {
      store.dispatch('createSession').then(
        localId => {
          this.$router.push(`session/${localId}`)
        }
      )
    }
  }
})
</script>

<style lang="scss">
.home {
  text-align: center;
  .logo {
    width: 80%;
    max-width: 512px;
  }
  h1 {
    margin-bottom: 0.1em;
  }
  .project{
    @include clickable-surface;
    &.new{
      padding: 1.5em 1em;
      margin-bottom: 2.5em;
    }
    .small {
      font-size: 0.5em;
    }
    .date {
      font-size: 0.5em;
    }
  }
  .cornerbutton{
    background-size: 50%;
    &.info {
      background-image: url("~@/assets/icons/info.svg");
      right: 1em;
      top: 1em;
    }
    &.settings {
      background-image: url("~@/assets/icons/settings.svg");
      left: 1em;
      top: 1em;
  }
  }
}
</style>
