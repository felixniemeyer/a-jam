import { Ref, ref } from 'vue'
import ipfs, { multiaddr } from 'ipfs'
import Multiaddr from 'multiaddr'
import { BaseName } from 'multibase'

import ac from '@/audio-context'

const NO_CONNECTION_ERROR = Error('ipfs not connected')
// a ipfs node I'm running to support ipfs function
const HEBELPI_ID = '12D3KooWQotQBp2zSqyJ1C5pjeAvrrd5kkeaxHzhCjHFXMsKYLRi'

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
    public origin: string | undefined,
    public localTime: number,
    public tracks: TrackConfig[]
  ) {}

  addTrack (tc: TrackConfig) {
    this.tracks.push(tc)
  }
}

class IPFSWrapper {
  state: Ref<string> = ref('uninitialized')
  node: ipfs.IPFS | undefined = undefined
  baseName: BaseName = 'base32'
  gatewayURL = 'gateway.ipfs.io'
  appIPNSIdentifier = 'k51qzi5uqu5dgggo67rgyka2qo75vrsylw2idc3j6f570kthbikc8yuzyavflf'
  initialize () {
    return new Promise((resolve, reject) => {
      if (this.node === undefined && this.state.value !== 'initializing') {
        this.state.value = 'initializing'
        const settings = {
        }
        ipfs.create(settings).then(
          node => {
            this.node = node
            this.connectToNodeById(HEBELPI_ID)
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

  connectToNodeById (nodeId: string) {
    if (this.node !== undefined) {
      // transport /p2p/ is not supported by a js ipfs node, so skip that for now...
      // this.connectToNode(multiaddr(`/p2p/${nodeId}`))
    }
  }

  connectToNode (nodeAddr: Multiaddr) {
    if (this.node !== undefined) {
      this.node.swarm.connect(nodeAddr).then(
        () => {
          console.log("successfully connected to ", nodeAddr.toString())
        },
        err => {
          if(err instanceof AggregateError){
            console.log("AGGFR")
            err.errors.forEach(err => console.error(err))
          } else {
            console.error("could not connect to node", nodeAddr.toString(), "because", err)
            for(let key of err) {
              console.log(key)
            }
          }
        }
      )
    }
  }

  getIpfsNodeId () {
    return new Promise<string>((resolve, reject) => {
      if (this.node === undefined) {
        reject(NO_CONNECTION_ERROR)
      } else {
        return this.node.id().then(identity => { resolve(identity.id) })
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

  loadTrackAudio (cid: string) {
    return new Promise<AudioBuffer>((resolve, reject) => {
      if (this.node !== undefined) {
        (async node => {
          const data = node.cat(cid)
          const chunks = []
          for await (const chunk of data) {
            chunks.push(chunk)
          }
          const audio = new Blob(chunks, { type: 'audio/ogg; codecs=opus' })
          const fileReader = new FileReader()
          fileReader.onloadend = () => {
            const arrayBuffer = fileReader.result
            if (arrayBuffer instanceof ArrayBuffer) {
              ac.decodeAudioData(arrayBuffer).then(
                audioBuffer => { resolve(audioBuffer) }
              )
            } else {
              reject(Error('track audio data from ipfs could not be read into an ArrayBuffer'))
            }
          }
          fileReader.readAsArrayBuffer(audio)
        })(this.node)
      } else {
        reject(NO_CONNECTION_ERROR)
      }
    })
  }
}

export const ipfsWrapper = new IPFSWrapper()
