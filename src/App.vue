<template>
  <div id="nav">
    <Home/>
    <Session/>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import Home from '@/components/Home.vue'
import Session from '@/components/Session.vue'

import ipfsWrapper from './ipfs-wrapper'

@Options({
  components: {
    Home,
    Session
  }
})
export default class App extends Vue {
  beforeCreate() {
    console.log('setup is executed')
    ipfsWrapper.initialize()
    console.log(ipfsWrapper)
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
