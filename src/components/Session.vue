<template>
  <div class="about">
    <h1>This is an about page</h1>
    ipfs status: {{ipfsState}}
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

import ipfsWrapper from '@/ipfs-wrapper'

@Options({
  components: {
  }
})
export default class Home extends Vue {
  ipfsState = ipfsWrapper.state
}
</script>
