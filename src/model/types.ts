export interface Session {
  title: string
  date: number
  trackIds: number[]

  clone(Session: Session) : Session
}

export interface Track {
  name: string
  volume: number
  panning: number // -1 left, 1 right
  offset: number
  effectiveDuration: number
  recordingId: number
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

export interface RecentSessionEntry {
  createdByMe: boolean,
  cid: string,
  title: string,
  timestamp: number
}
