<template>
    <Session
      v-if="page === 'session'"
      :sessionToLoad="sessionToLoad"
      @go-home="goHome()"/>
    <Info
      v-else-if="page === 'info'"
      @go-home="goHome()"/>
    <Home
      v-else
      @goto-info="page='info'"
      @load-Session="loadSession"
      @new-project="createNewProject()"/>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

import Home from '@/components/Home.vue'
import Session from '@/components/Session.vue'
import Info from '@/components/Info.vue'

import { ipfsWrapper } from '@/ipfs-wrapper'

class GetParams {
  loadSession: string | undefined
  newSession = false
  constructor() {
    let tmp = []
    location.search
      .substr(1)
      .split('&')
      .forEach(item => {
        tmp = item.split('=')
        switch (tmp[0]) {
          case 'loadSession':
            this.loadSession = tmp[1]
            break
          case 'newSession':
            this.newSession = true
        }
      })
  }
}

@Options({
  components: {
    Home,
    Session,
    Info
  }
})
export default class App extends Vue {
  page = 'home'
  getParams: GetParams = new GetParams()
  sessionToLoad: string | undefined
  beforeCreate() {
  }

  mounted() {
    ipfsWrapper.initialize().then(
      () => {
        this.handleGetParams()
      },
      err => {
        console.error('failed to initialize ipfs', err)
      }
    )
  }

  handleGetParams() {
    if (this.getParams.loadSession !== undefined) {
      this.loadSession(this.getParams.loadSession)
    }
  }

  loadSession(cid: string) {
    console.log('loading', cid)
    this.sessionToLoad = cid
    this.page = 'session'
  }

  createNewProject() {
    console.log('creating new project')
    this.page = 'session'
  }

  goHome() {
    this.page = 'home'
    this.sessionToLoad = undefined
  }
}
</script>

<style lang="scss">
#app {
  font-family: sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.error {
  color: rgb(128, 9, 9);
}

</style>
