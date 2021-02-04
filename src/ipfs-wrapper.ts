import { Ref, ref } from 'vue'
import ipfs from 'ipfs'
import { BaseName } from 'multibase'

export class TrackConfig {
  constructor(
    public cid: string,
    public name: string,
    public volume: number,
    public panning: number,
    public offset: number
  ) {}
}

export class SessionConfig {
  constructor(
    public title: string,
    public origin: string | undefined,
    public localTime: number,
    public tracks: TrackConfig[]
  ) {}

  addTrack(tc: TrackConfig) {
    this.tracks.push(tc)
  }
}

class IPFSWrapper {
  state: Ref<string> = ref('uninitialized')
  node: ipfs.IPFS | undefined = undefined
  baseName: BaseName = 'base32'
  initialize() {
    return new Promise((resolve, reject) => {
      if (this.node === undefined && this.state.value !== 'initializing') {
        this.state.value = 'initializing'
        // create it using a delegated ipfs server running on davids pi
        const settings = {
          offline: true // TODO: remove for production
        }
        ipfs.create(settings).then(
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

  saveTrackAudio(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
      if (this.node !== undefined) {
        this.node.add(blob).then(
          results => {
            resolve(results.cid.toV1().toString(this.baseName))
          },
          reject
        )
      } else {
        reject(Error('ipfs undefined'))
      }
    })
  }

  saveSessionConfig(sc: SessionConfig) {
    return new Promise<string>((resolve, reject) => {
      if (this.node !== undefined) {
        this.node.add(JSON.stringify(sc)).then(
          results => {
            console.log(results)
            resolve(results.cid.toV1().toString(this.baseName))
          },
          reject
        )
      } else {
        reject(Error('ipfs undefined'))
      }
    })
  }
}

console.log('hi there!')

export const ipfsWrapper = new IPFSWrapper()
