<template>
  <div class="home">
    <h1>a-jam</h1>
    <i>asynchronous jamming</i><br/>
    <img class="logo" alt="ajam logo" src="../assets/logo.png" />
    <div class="sessions">
      <div class="sessionButton new" @click="createNewSession">create new session</div>
      <h4 v-if="Object.keys(state.sessions.local).length > 0">open sessions</h4>
      <div class="sessionButton" v-for="(ls, key) in state.sessions.local" :key="key" @click="openSession(key)">
        {{ key }}: {{ ls.title }}
        <div class="close" @click="closeSession(key)"> X </div>
      </div>
      <h4 v-if="state.sessions.recent.length > 0">recent sessions</h4>
      <div class="sessionButton" v-for="rse in state.sessions.recent" :key="rse.cid" @click="loadSession(rse.cid)">
        {{ rse.title }} <br />
        <span class='small'>{{ rse.cid }}</span> <br/>
        <i class='date'>{{ Date(rse.timestamp).toLocaleString() }}</i>
      </div>
    </div>
    <router-link tag="div" to="/info" class="cornerbutton info"></router-link>
    <router-link tag="div" to="/settings" class="cornerbutton settings"></router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { LocalSession } from '@/types'

export default defineComponent({
  methods: {
    createNewSession () {
      const localSessionId = this.state.sessions.nextLocalSessionId++
      this.state.sessions.local[localSessionId] = new LocalSession()
      this.$router.push(`/session/${localSessionId}/edit`)
    },
    openSession (localId: number) {
      if (localId in this.state.sessions.local) {
        this.$router.push(`/session/${localId}/edit`)
      }
    },
    closeSession (localId: number) {
      delete this.state.sessions.local[localId]
    },
    loadSession (cid: string) {
      this.$router.push({
        path: '/loadSession',
        query: {
          cid
        }
      })
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
  .sessionButton{
    position: relative;
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
    .close {
      position: absolute;
      top: 50%;
      right: 1em;
      transform: translate(0, -50%);
      width: 2em;
      height: 2em;
      line-height: 2em;
      border-radius: 0.3em;
      background-color: $danger;
      font-weight: bold;
      color: #fff;
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
