import { Ref, ref } from 'vue'
import ipfs from 'ipfs'

class IPFSWrapper {
  state: Ref<string> = ref('uninitialized')
  node: ipfs.IPFS | undefined = undefined
  initialize() {
    if (this.node === undefined && this.state.value !== 'initializing') {
      this.state.value = 'initializing'
      ipfs.create().then(
        node => {
          this.node = node
          this.state.value = 'initialized'
        },
        err => {
          console.error('could not start ipfs node:', err)
          this.state.value = 'failed'
        }
      )
    }
  }
}

console.log('hi there!')

export default new IPFSWrapper()
