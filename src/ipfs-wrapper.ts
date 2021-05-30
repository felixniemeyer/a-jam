import { Ref, ref } from 'vue'
import ipfs from 'ipfs'
import { BaseName } from 'multibase'
import PeerId from 'peer-id'
import Multiaddr from 'multiaddr'

const NO_CONNECTION_ERROR = Error('ipfs not connected')

export class TrackConfig {
  constructor (
    public cid: string,
    public name: string,
    public volume: number,
    public panning: number,
    public offset: number
  ) {}
}

export class SessionConfig {
  constructor (
    public title: string,
    public origin: string | undefined, // cid of the session this one builds upon
    public localTime: number,
    public tracks: TrackConfig[]
  ) {}

  addTrack (tc: TrackConfig) {
    this.tracks.push(tc)
  }
}

export class IPFSWrapper {
  state: Ref<string> = ref('uninitialized')
  node: ipfs.IPFS | undefined = undefined
  baseName: BaseName = 'base32'
  gatewayURL = 'gateway.ipfs.io'
  appIPNSIdentifier = 'k51qzi5uqu5dgggo67rgyka2qo75vrsylw2idc3j6f570kthbikc8yuzyavflf'

  constructor (public ac: AudioContext) {}

  initialize () {
    return new Promise((resolve, reject) => {
      if (this.node === undefined && this.state.value !== 'initializing') {
        this.state.value = 'initializing'
        const options = {
          config: {
            Bootstrap: ['/dns4/nathanael.in/tcp/443/ws'],
            Addresses: {},
            Discovery: {
              MDNS: {},
              webRTCStar: {}
            }
          }
        }
        ipfs.create().then(
          node => {
            setInterval(() => {
              console.log('peers:')
              node.swarm.peers({}).then(peers => {
                console.log(peers)
              })
            }, 5000)
            console.log('ipfs node', node)
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

  getIpfsNodeId () {
    return new Promise<string>((resolve, reject) => {
      if (this.node === undefined) {
        reject(NO_CONNECTION_ERROR)
      } else {
        return this.node.id().then(identity => {
          console.log(identity)
          resolve(identity.id)
        })
      }
    })
  }

  saveTrackAudio (blob: Blob) {
    return new Promise<string>((resolve, reject) => {
      if (this.node !== undefined) {
        this.node.add(blob).then(
          results => {
            resolve(results.cid.toV1().toString(this.baseName))
          },
          reject
        )
      } else {
        reject(NO_CONNECTION_ERROR)
      }
    })
  }

  saveSessionConfig (sc: SessionConfig) {
    return new Promise<string>((resolve, reject) => {
      if (this.node !== undefined) {
        this.node.add(JSON.stringify(sc)).then(
          results => {
            resolve(results.cid.toV1().toString(this.baseName))
          },
          reject
        )
      } else {
        reject(NO_CONNECTION_ERROR)
      }
    })
  }

  loadSessionConfig (cid: string) {
    return new Promise<SessionConfig>((resolve, reject) => {
      if (this.node !== undefined) {
        (async node => {
          const data = node.cat(cid)
          const decoder = new TextDecoder()
          const messageParts = []
          for await (const chunk of data) {
            messageParts.push(decoder.decode(chunk, { stream: true }))
          }
          const sc = JSON.parse(messageParts.join())
          resolve(sc as SessionConfig)
        })(this.node)
      } else {
        reject(NO_CONNECTION_ERROR)
      }
    })
  }

  async loadRecording (cid: string) {
    if (this.node === undefined) {
      throw (NO_CONNECTION_ERROR)
    } else {
      const data = this.node.cat(cid)
      const chunks = []
      for await (const chunk of data) {
        chunks.push(chunk)
      }
      const audio = new Blob(chunks, { type: 'audio/ogg; codecs=opus' })
      return await new Promise<AudioBuffer>((resolve, reject) => {
        const fileReader = new FileReader()
        fileReader.onloadend = () => {
          const arrayBuffer = fileReader.result
          if (arrayBuffer instanceof ArrayBuffer) {
            this.ac.decodeAudioData(arrayBuffer).then(
              audioBuffer => { resolve(audioBuffer) }
            )
          } else {
            reject(Error('track audio data from ipfs could not be read into an ArrayBuffer'))
          }
        }
        fileReader.readAsArrayBuffer(audio)
      })
    }
  }
}
