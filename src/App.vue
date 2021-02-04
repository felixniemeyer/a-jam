<template>
    <Session
      v-if="page === 'session'"
      @go-home="goHome()"/>
    <Info
      v-else-if="page === 'info'"
      @go-home="goHome()"/>
    <Home
      v-else
      @goto-info="page='info'"
      @new-project="createNewProject()"/>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

import Home from '@/components/Home.vue'
import Session from '@/components/Session.vue'
import Info from '@/components/Info.vue'

import { ipfsWrapper } from '@/ipfs-wrapper'

@Options({
  components: {
    Home,
    Session,
    Info
  }
})
export default class App extends Vue {
  page = 'home'
  beforeCreate() {
    ipfsWrapper.initialize().then(() => {
      this.handleGetParams()
    })
    console.log(ipfsWrapper)
  }

  handleGetParams() {
    // load, if a specific project cid is specified
    this.page = 'session'
  }

  // loadProject(cid) {
  // }
  createNewProject() {
    console.log('creating new project')
    this.page = 'session'
  }

  goHome() {
    this.page = 'home'
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
