
export default class Track {
  localId: number | undefined = undefined
  cid: string | undefined = undefined
  name = 'new recording'
  audioBlob: Blob | undefined
  audioBuffer: AudioBuffer
  volume = 1.0
  panning = 0.0
  offset = 0.0
  effectiveDuration = 0
  source: AudioBufferSourceNode | undefined
  panner: StereoPannerNode | undefined
  gain: GainNode | undefined

  constructor (blob: Blob | undefined, buffer: AudioBuffer) {
    this.audioBlob = blob
    this.audioBuffer = buffer
  }
}
