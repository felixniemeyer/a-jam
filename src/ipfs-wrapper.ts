import { Ref, ref } from 'vue'
import ipfs from 'ipfs'
import { BaseName } from 'multibase'

const NO_CONNECTION_ERROR = Error('ipfs not connected')

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
  gatewayURL = 'ipfs.io'
  appIPNSIdentifier = 'tbd'
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
        reject(NO_CONNECTION_ERROR)
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
        reject(NO_CONNECTION_ERROR)
      }
    })
  }

  loadSessionConfig(cid: string) {
    return new Promise<SessionConfig>(async (resolve, reject) => {
      if (this.node !== undefined) {
        const data = this.node.cat(cid)
        const decoder = new TextDecoder()
        const messageParts = []
        for await (const chunk of data) {
          messageParts.push(decoder.decode(chunk, { stream: true }))
        }
        const sc = JSON.parse(messageParts.join())
        resolve(sc as SessionConfig)
      } else {
        reject(NO_CONNECTION_ERROR)
      }
    })
  }

  loadTrackAudio(cid: string) {
    return new Promise<AudioBuffer>(async (resolve, reject) => {
      if (this.node !== undefined) {
        const ac = new AudioContext()
        const data = this.node.cat(cid)
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
      } else {
        reject(NO_CONNECTION_ERROR)
      }
    })
  }
}

console.log('hi there!')

export const ipfsWrapper = new IPFSWrapper()
