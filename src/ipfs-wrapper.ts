import { Ref, ref } from 'vue'
import ipfs from 'ipfs'
import IpfsHttpClient from 'ipfs-http-client'
import { debug } from './tools'
import { PinataApiIpfsInterface, PinataApiSettings } from './pinata-ipfs-interface'

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

  addTrack (tc: TrackConfig) : void {
    this.tracks.push(tc)
  }
}

export interface IpfsInterface {
  pin(cid: string): void;
  loadSessionConfig(cid: string): Promise<SessionConfig>;
  loadRecording(cid: string): Promise<ArrayBuffer>;
  add(blob: Blob | string) : Promise<string>;
}

class IpfsApiInterface {
  constructor(private ipfs: ipfs.IPFS) {}
  pin(cid: string) {
    return this.ipfs.pin.add(cid)
  }
  async add(blob: Blob | string) : Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.ipfs.add(blob).then(
      results => {
        resolve(results.cid.toV1().toString())
      },
      err => { reject(err) }
      )
    })
  }
  async loadSessionConfig(cid: string): Promise<SessionConfig> {
    const data = this.ipfs.cat(cid)
    const decoder = new TextDecoder()
    const messageParts = []
    for await (const chunk of data) {
      messageParts.push(decoder.decode(chunk, { stream: true }))
    }
    const sc = JSON.parse(messageParts.join())
    return sc as SessionConfig
  }
  async loadRecording(cid: string): Promise<ArrayBuffer> {
    const data = this.ipfs.cat(cid)
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

class BrowserIpfsNodeInterface implements IpfsInterface {
  state: 'initializing' | 'running' | 'failed' | 'stopped' = 'initializing';
  browserNode: undefined | ipfs.IPFS;
  initDone: (() => void)[] = [];
  initFailed: (() => void)[] = [];

  constructor(onError: (err: string) => void) {
    debug('spinning up browser node')
    ipfs.create().then(
      node => {
        this.browserNode = node
        this.notifyAll(this.initDone)
      },
      err => {
        onError(err)
        this.notifyAll(this.initFailed)
      }
    )
  }
  notifyAll(a: (() => void)[]) {
    a.forEach(f => { f() })
    this.initDone = [];
    this.initFailed = [];
  }

  async pin(cid: string): Promise<void> {
    (await this.getApiInterface()).add(cid);
  }
  async loadSessionConfig(cid: string): Promise<SessionConfig> {
    return (await this.getApiInterface()).loadSessionConfig(cid);
  }
  async loadRecording(cid: string): Promise<ArrayBuffer> {
    return (await this.getApiInterface()).loadRecording(cid);
  }
  async add(blob: Blob | string) : Promise<string> {
    return (await this.getApiInterface()).add(blob);
  }

  async getApiInterface() : Promise<IpfsApiInterface> {
    if(this.browserNode !== undefined) {
      return new IpfsApiInterface(this.browserNode)
    } else if (this.state == 'initializing') {
      await new Promise<void>((resolve, reject) => {
        this.initDone.push(resolve)
        this.initFailed.push(reject)
      })
      if(this.browserNode !== undefined) {
        return new IpfsApiInterface(this.browserNode)
      } else {
        throw Error("browser node still undefined after waiting")
      }
    } else {
      throw Error("browser node already in state ")
    }
  }

  async shutdown() {
    debug('shutting down browser node')
    if (this.browserNode !== undefined) {
      await this.browserNode.stop()
    }
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

  pinata: {
    usage: IpfsInterfaceUsage,
    apiSettings: PinataApiSettings
  }

  constructor () {
    this.browserNode = {
      usage: {
        enabled: false,
        useForPinning: true,
        useForRetrievalPriority: 0,
        pinOnRetrieve: true
      }
    }
    this.publicNode = {
      usage: {
        enabled: true,
        useForPinning: true,
        useForRetrievalPriority: 1,
        pinOnRetrieve: false
      }
    }
    this.configuredNode = {
      usage: {
        enabled: false,
        useForPinning: true,
        useForRetrievalPriority: 2,
        pinOnRetrieve: true
      },
      endpoint: {
        host: '127.0.0.1',
        port: 5001,
        protocol: 'http'
      }
    }
    this.pinata = {
      usage: {
        enabled: false,
        useForPinning: true,
        useForRetrievalPriority: 1,
        pinOnRetrieve: true
      },
      apiSettings: {
        apiKey: "",
        secret: "",
        gatewayUrl: "https://gateway.pinata.cloud",
        apiBaseUrl: "https://api.pinata.cloud"
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
    publicNode: ipfs.IPFS;
    configuredNode: ipfs.IPFS | undefined;
  }

  browserNode: BrowserIpfsNodeInterface | undefined;

  pinataInterface: PinataApiIpfsInterface | undefined;

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
        host: 'mprnc.dynv6.net',
        port,
        protocol
      }) as ipfs.IPFS,
      configuredNode: undefined,
    }
    this.resetConfigurableNode()
    if (this.ipfsSettings.browserNode.usage.enabled) {
      this.spinUpBrowserNode()
    }
    if (this.ipfsSettings.pinata.usage.enabled) {
      this.pinataInterface = new PinataApiIpfsInterface(
        ipfsSettings.pinata.apiSettings
      )
    }
  }

  resetConfigurableNode () : void {
    debug(
      'resetting configurable node endpoint',
      JSON.stringify(this.ipfsSettings.configuredNode.endpoint)
    )
    this.nodes.configuredNode = this.configureHttpClient(this.ipfsSettings.configuredNode.endpoint)
  }

  refreshPinata () : void {
    debug(
      'resetting pinata ipfs interface'
    )
    if (this.ipfsSettings.pinata.usage.enabled) {
      this.pinataInterface = new PinataApiIpfsInterface(
        this.ipfsSettings.pinata.apiSettings
      )
    } else {
      delete this.pinataInterface;
    }
  }

  configureHttpClient (nodeApiEndpoint: IpfsNodeApiEndpoint): ipfs.IPFS {
    return IpfsHttpClient.create({
      host: nodeApiEndpoint.host,
      port: nodeApiEndpoint.port,
      protocol: nodeApiEndpoint.protocol
    }) as unknown as ipfs.IPFS
  }

  forEachNode (f: ((node: IpfsInterface, usage: IpfsInterfaceUsage) => void)) : void {
    if (this.browserNode !== undefined) {
      f(this.browserNode as IpfsInterface,
        this.ipfsSettings.browserNode.usage)
    }
    if (this.nodes.configuredNode !== undefined) {
      f(new IpfsApiInterface(this.nodes.configuredNode),
        this.ipfsSettings.configuredNode.usage)
    }
    f(this.pinataInterface as IpfsInterface, this.ipfsSettings.pinata.usage)
    f(new IpfsApiInterface(this.nodes.publicNode),
      this.ipfsSettings.publicNode.usage)
  }

  ipfsAdd (blob: Blob | string) : Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let count = 0
      let successes = 0
      let errors = 0
      this.forEachNode((node, usage) => {
        if (usage.enabled && usage.useForPinning) {
          count += 1
          node.add(blob).then(
            cid => {
              if (successes === 0) {
                resolve(cid)
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

  saveSessionConfig (sc: SessionConfig) : Promise<string> {
    return this.ipfsAdd(JSON.stringify(sc))
  }

  getNodeForRetrieval (): IpfsInterface | undefined {
    let winner: IpfsInterface | undefined
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

  async loadSessionConfig (cid: string) : Promise<SessionConfig> {
    setTimeout(() => { this.pinOnRetrieve(cid) })
    const node = this.getNodeForRetrieval()
    if (node !== undefined) {
      return node.loadSessionConfig(cid)
    } else {
      throw NO_CONNECTION_ERROR
    }
  }

  async loadRecording (cid: string) : Promise<ArrayBuffer> {
    setTimeout(() => { this.pinOnRetrieve(cid) })
    const node = this.getNodeForRetrieval()
    if (node === undefined) {
      throw (NO_CONNECTION_ERROR)
    } else {
      return node.loadRecording(cid)
    }
  }

  pinOnRetrieve (cid: string) : void {
    this.forEachNode((node, usage) => {
      if (usage.enabled &&
          usage.pinOnRetrieve) {
        node.pin(cid)
      }
    })
  }

  shutdownBrowserNode() : void {
    if ( this.browserNode !== undefined) {
      this.browserNode.shutdown()
    }
  }

  spinUpBrowserNode() : void {
    this.shutdownBrowserNode()
    this.browserNode = new BrowserIpfsNodeInterface(err => {
      this.errorLog.value.push('could not spin up browser ipfs node: ' + err)
    });
  }
}
