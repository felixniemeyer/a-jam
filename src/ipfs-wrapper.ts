import { Ref, ref } from 'vue'
import ipfs from 'ipfs'
import ipfsClient from 'ipfs-http-client'
import { BaseName } from 'multibase'
import { debug } from './tools'

const NO_CONNECTION_ERROR = Error('ipfs not connected')

export class TrackConfig {
  constructor (
    public cid: string,
    public name: string,
    public volume: number,
    public panning: number,
    public offset: number,
    public muted: boolean
  ) {}
}

export class SessionConfig {
  constructor (
    public title: string,
    public ancestor: string | undefined, // cid of the session this one builds upon
    public localTime: number,
    public tracks: TrackConfig[]
  ) {}

  addTrack (tc: TrackConfig) {
    this.tracks.push(tc)
  }
}
export class IpfsSettings {
  browserNode: {
    usage: IpfsInterfaceUsage;
  }

  publicNode: {
    usage: IpfsInterfaceUsage;
  }

  configuredNode: {
    usage: IpfsInterfaceUsage;
    endpoint: IpfsNodeApiEndpoint;
  }

  constructor () {
    this.browserNode = {
      usage: {
        enabled: true,
        useForPinning: true,
        useForRetrievalPriority: 0, // interface with highest number gets chosen
        pinOnRetrieve: true
      }
    }
    this.publicNode = {
      usage: {
        enabled: true,
        useForPinning: true,
        useForRetrievalPriority: 1, // interface with highest number gets chosen
        pinOnRetrieve: false
      }
    }
    this.configuredNode = {
      usage: {
        enabled: false,
        useForPinning: true,
        useForRetrievalPriority: 2, // interface with highest number gets chosen
        pinOnRetrieve: true
      },
      endpoint: {
        host: '127.0.0.1',
        port: 5001,
        protocol: 'http'
      }
    }
  }
}

export interface IpfsInterfaceUsage {
  enabled: boolean;
  useForPinning: boolean;
  useForRetrievalPriority: number; // interface with highest number gets chosen
  pinOnRetrieve: boolean;
}

export interface IpfsNodeApiEndpoint {
  host: string;
  port: number;
  protocol: string;
}

export class IPFSWrapper {
  errorLog: Ref<string[]> = ref([])

  // various ways to the ipfs network
  nodes: {
    browserNode: ipfs.IPFS | undefined;
    publicNode: ipfs.IPFS;
    configuredNode: ipfs.IPFS | undefined;
  }

  // pinataPinningService: k ==> use axios - if configured

  baseName: BaseName = 'base32'
  gatewayHost = 'ipfs.io'
  appIPNSIdentifier = 'k51qzi5uqu5dgggo67rgyka2qo75vrsylw2idc3j6f570kthbikc8yuzyavflf'
  ipfsSettings: IpfsSettings

  constructor (ipfsSettings: IpfsSettings) {
    this.ipfsSettings = ipfsSettings
    const protocol = location.protocol.slice(0, -1)
    let port = 15151
    if (protocol === 'https') {
      port = 15152
    }
    this.nodes = {
      publicNode: this.configureHttpClient({
        host: 'nathanael.in',
        port,
        protocol
      }) as ipfs.IPFS,
      configuredNode: undefined,
      browserNode: undefined
    }
    this.resetConfigurableNode()
    if (this.ipfsSettings.browserNode.usage.enabled === true) {
      this.spinUpBrowserNode()
    }
  }

  resetConfigurableNode () {
    debug(
      'resetting configurable node endpoint',
      JSON.stringify(this.ipfsSettings.configuredNode.endpoint)
    )
    this.nodes.configuredNode = this.configureHttpClient(this.ipfsSettings.configuredNode.endpoint)
  }

  async shutdownBrowserNode () {
    debug('shutting down browser node')
    if (this.nodes.browserNode !== undefined) {
      await this.nodes.browserNode.stop()
    }
  }

  spinUpBrowserNode () {
    debug('spinning up browser node')
    ipfs.create().then(
      node => {
        debug(node)
        this.nodes.browserNode = node
      },
      err => {
        this.errorLog.value.push('could not spin up browser ipfs node: ' + err)
      }
    )
  }

  configureHttpClient (nodeApiEndpoint: IpfsNodeApiEndpoint): ipfs.IPFS {
    return ipfsClient({
      host: nodeApiEndpoint.host,
      port: nodeApiEndpoint.port,
      protocol: nodeApiEndpoint.protocol
    }) as unknown as ipfs.IPFS
  }

  monitorPeers (node: ipfs.IPFS) {
    setInterval(() => {
      console.log('peers:')
      node.swarm.peers({}).then(peers => {
        console.log(peers)
      })
    }, 10000)
  }

  forEachNode (f: ((node: ipfs.IPFS, usage: IpfsInterfaceUsage) => void)) {
    if (this.nodes.browserNode !== undefined) {
      f(this.nodes.browserNode,
        this.ipfsSettings.browserNode.usage)
    }
    if (this.nodes.configuredNode !== undefined) {
      f(this.nodes.configuredNode,
        this.ipfsSettings.configuredNode.usage)
    }
    f(this.nodes.publicNode,
      this.ipfsSettings.publicNode.usage)
  }

  ipfsAdd (blob: Blob | string) {
    return new Promise<string>((resolve, reject) => {
      let count = 0
      let successes = 0
      let errors = 0
      this.forEachNode((node, usage) => {
        if (usage.enabled && usage.useForPinning) {
          count += 1
          node.add(blob).then(
            results => {
              if (successes === 0) {
                resolve(results.cid.toV1().toString(this.baseName))
              }
              successes += 1
            },
            err => {
              errors += 1
              this.errorLog.value.push(`Failed to ipfs add: ${err}`)
              if (errors === count) {
                reject(new Error('All ipfs interfaces failed to add this file. See details at the ipfsWrapper error log.'))
              }
            }
          )
        }
      })
      if (count === 0) {
        reject(new Error('No ipfs interface is configured for pinning'))
      }
    })
  }

  saveSessionConfig (sc: SessionConfig) {
    return this.ipfsAdd(JSON.stringify(sc))
  }

  getNodeForRetrieval (): ipfs.IPFS | undefined {
    let winner: ipfs.IPFS | undefined
    let prio = -1
    this.forEachNode((node, usage) => {
      if (usage.enabled) {
        if (usage.useForRetrievalPriority > prio) {
          winner = node
          prio = usage.useForRetrievalPriority
        }
      }
    })
    return winner
  }

  async loadSessionConfig (cid: string) {
    setTimeout(() => { this.pinOnRetrieve(cid) })
    const node = this.getNodeForRetrieval()
    if (node !== undefined) {
      const data = node.cat(cid)
      const decoder = new TextDecoder()
      const messageParts = []
      for await (const chunk of data) {
        messageParts.push(decoder.decode(chunk, { stream: true }))
      }
      const sc = JSON.parse(messageParts.join())
      return sc as SessionConfig
    } else {
      throw NO_CONNECTION_ERROR
    }
  }

  async loadRecording (cid: string) {
    setTimeout(() => { this.pinOnRetrieve(cid) })
    const node = this.getNodeForRetrieval()
    if (node === undefined) {
      throw (NO_CONNECTION_ERROR)
    } else {
      const data = node.cat(cid)
      const chunks = []
      for await (const chunk of data) {
        chunks.push(chunk)
      }
      const audio = new Blob(chunks, { type: 'audio/ogg; codecs=opus' })
      return await new Promise<ArrayBuffer>((resolve, reject) => {
        const fileReader = new FileReader()
        fileReader.onloadend = () => {
          const arrayBuffer = fileReader.result
          if (arrayBuffer instanceof ArrayBuffer) {
            resolve(arrayBuffer)
          } else {
            reject(Error('track audio data from ipfs could not be read into an ArrayBuffer'))
          }
        }
        fileReader.readAsArrayBuffer(audio)
      })
    }
  }

  pinOnRetrieve (cid: string) {
    this.forEachNode((node, usage) => {
      if (usage.enabled &&
          usage.pinOnRetrieve) {
        node.pin.add(cid)
      }
    })
  }
}
