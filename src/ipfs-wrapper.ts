import { Ref, ref } from 'vue'
import ipfs from 'ipfs'

class IPFSWrapper {
  state: Ref<string> = ref('uninitialized')
  node: ipfs.IPFS | undefined = undefined
  initialize() {
    return new Promise((resolve, reject) => {
      if (this.node === undefined && this.state.value !== 'initializing') {
        this.state.value = 'initializing'
        // create it using a delegated ipfs server running on davids pi
        ipfs.create().then(
          node => {
            this.node = node
            this.state.value = 'initialized'
            resolve(node)
          },
          err => {
            this.state.value = 'failed'
            reject(Error('could not initialize ipfs connection: ' + err))
          }
        )
      }
    })
  }
}

console.log('hi there!')

export default new IPFSWrapper()
