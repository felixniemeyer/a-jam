<template>
    <Session
      v-if="page === 'session'"
      :sessionToLoad="sessionToLoad"
      :defaultRecordingOffset="defaultRecordingOffset"
      @go-home="goHome()"/>
    <Info
      v-else-if="page === 'info'"
      @go-home="goHome()"/>
    <Settings
      v-else-if="page === 'settings'"
      :defaultRecordingOffset="defaultRecordingOffset"
      @goHome="goHome()"
      @updateDefaultRecordingOffset="updateDefaultRecordingOffset"/>
    <Home
      v-else
      @gotoInfo="page='info'"
      @loadSession="loadSession"
      @gotoSettings="page='settings'"
      @newProject="createNewProject()"/>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

import Home from '@/components/Home.vue'
import Session from '@/components/Session.vue'
import Info from '@/components/Info.vue'
import Settings from '@/components/Settings.vue'

import { ipfsWrapper } from '@/ipfs-wrapper'

class GetParams {
  loadSession: string | undefined
  loadSessionOrigin: string | undefined
  newSession = false

  constructor () {
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
          case 'loadSessionOrigin':
            this.loadSessionOrigin = tmp[1]
            break
          case 'newSession':
            this.newSession = true
            break
        }
      })
  }
}

@Options({
  components: {
    Home,
    Session,
    Info,
    Settings
  }
})
export default class App extends Vue {
  page = 'home'
  getParams: GetParams = new GetParams()
  sessionToLoad: string | undefined
  defaultRecordingOffset = 0.060
  persistDefaultRecordingOffsetTimeout: NodeJS.Timeout | undefined

  mounted () {
    ipfsWrapper.initialize().then(
      () => {
        this.handleGetParams()
      },
      err => {
        console.error('failed to initialize ipfs', err)
      }
    )
    this.loadSettings()
  }

  loadSettings () {
    if ('defaultRecordingOffset' in localStorage) {
      this.defaultRecordingOffset = Number(localStorage.getItem('defaultRecordingOffset'))
    }
  }

  updateDefaultRecordingOffset (v: number) {
    this.defaultRecordingOffset = v
    if (this.persistDefaultRecordingOffsetTimeout !== undefined) {
      clearTimeout(this.persistDefaultRecordingOffsetTimeout)
    }
    this.persistDefaultRecordingOffsetTimeout = setTimeout(() => {
      localStorage.setItem('defaultRecordingOffset', v.toString())
    }, 500)
  }

  handleGetParams () {
    if (this.getParams.loadSession !== undefined) {
      this.loadSession(this.getParams.loadSession)
    }
  }

  loadSession (cid: string) {
    this.sessionToLoad = cid
    this.page = 'session'
  }

  createNewProject () {
    this.page = 'session'
  }

  goHome () {
    this.page = 'home'
    this.sessionToLoad = undefined
  }
}
</script>

<style lang="scss">
/* {
  outline: 1px solid pink;
} /**/
body {
  position: absolute;
  width: 100%;
  height: 100%;
  margin: 0;
  max-width: 60vh;
  left: 50%;
  transform: translate(-50%, 0);
  overflow-x: hidden;
}
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
