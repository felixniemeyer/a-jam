export class Session {
  title: string = 'New Session'
  tracks: Track[] = []
  previousCid: string | undefined
}

export class LocalSession extends Session {
  dirty = false

  copyToPublic(cid: string, date: number) : PublicSession {
    const publication = new PublicSession(cid, date)
    publication.title = this.title
    publication.tracks = this.tracks.map(track => track.clone())
    publication.previousCid = this.previousCid
    return publication 
  }
}

export class PublicSession extends Session {
  constructor(
    public cid: string, // TODO: are these fields here correctly initialized despite non-empty constructor 
    public date: number
  ) {
    super() 
  }
  
  copyToLocal() : LocalSession {
    const derivative = new LocalSession()
    derivative.title = this.title
    derivative.tracks = this.tracks.map(track => track.clone())
    derivative.previousCid = this.previousCid
    return derivative
  }
}

export interface Process {
  log: LogEntry[]
  errors: string[]
  done: boolean
}

export interface Publication {
  cid: string
  date: number
}

export class Track {
  name: string = 'New Track'
  volume: number = 1
  panning: number = 0 // -1 left, 1 right
  effectiveDuration: number
  playback: undefined | Playback

  constructor(
    public offset: number,
    public recording: Recording
  ) {
    this.effectiveDuration = this.recording.audioBuffer.duration - this.offset
  }
  
  clone() : Track {
    const clone = new Track(
      this.offset, 
      this.recording
    ) 
    clone.name = this.name
    clone.volume = this.volume
    clone.panning = this.panning
    return clone
  }
}

export interface Recording {
  cid: string | undefined
  audioBlob: Blob | undefined
  audioBuffer: AudioBuffer
}
 
export interface Playback {
  source: AudioBufferSourceNode
  panner: StereoPannerNode
  gain: GainNode
}

export interface LogEntry {
  type: 'msg' | 'copyable'
  s: string
}
