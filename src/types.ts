export class Session {
  title = 'New Session'
  tracks: Track[] = []
  previousCid: string | undefined
}

export class LocalSession extends Session {
  dirty = false
}

export class PublicSession extends Session {
  constructor (
    public cid: string, // TODO: are these fields here correctly initialized despite non-empty constructor
    public date: number
  ) {
    super()
  }
}

export interface Publication {
  cid: string;
  date: number;
}

export class Track {
  name = 'New Track'
  volume = 1
  panning = 0 // -1 left, 1 right
  effectiveDuration: number
  playback: undefined | Playback

  constructor (
    public offset: number,
    public recording: Recording
  ) {
    this.effectiveDuration = this.recording.audioBuffer.duration - this.offset
  }

  clone (): Track {
    const clone = new Track(
      this.offset,
      this.recording
    )
    clone.name = this.name
    clone.volume = this.volume
    clone.panning = this.panning
    return clone
  }

  static fromRecording (rec: Recording, name: string) {
    const track = new Track(
      0,
      rec
    )
    track.name = name
    track.volume = 1
    track.panning = 0
    return track
  }
}

export interface Recording {
  cid: string | undefined;
  audioBlob: Blob | undefined;
  audioBuffer: AudioBuffer;
}

export interface Playback {
  source: AudioBufferSourceNode;
  panner: StereoPannerNode;
  gain: GainNode;
}
