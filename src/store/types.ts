export interface Session {
  title: string
  publication: Publication | undefined
  previousCid: string | undefined
  trackIds: number[]
}

export interface Publication {
  cid: string
  date: number
}

export interface Track {
  name: string
  volume: number
  panning: number // -1 left, 1 right
  offset: number
  effectiveDuration: number
  recordingId: RecordingId
}

export type cid = string
export type localId = number
export type RecordingId = cid | localId

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
