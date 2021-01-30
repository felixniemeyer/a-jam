<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    schabla! (Home)
    here, all recent projects from browser cache will be listed
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

@Options({
  components: {
  }
})
export default class Home extends Vue {}
</script>
