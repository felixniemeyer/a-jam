import { config } from '@/config'
import SparkMD5 from 'spark-md5'

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

export function postSessionConfig(sessionConfig: SessionConfig) : Promise<string> {
  return new Promise((resolve, reject) => {
    let jsonString = JSON.stringify(sessionConfig)
    let hash = SparkMD5.hash(jsonString)
    let blob = new Blob([jsonString], { type: "application/json" })
    let fd = new FormData();
    fd.append('session', blob)
    //TBD: post session
    fetch(
      config.serverUrl + 'session/' + hash,
      {
        method:"POST",
        body: fd
      }
    )
    .then(() => { resolve(hash) })
    .catch((reason) => { reject("could not POST session: " + reason) })
  })
}

export function postRecording(recording: Blob) : Promise<string> {
  return new Promise((resolve, reject) => {
    let fr = new FileReader()
    fr.readAsArrayBuffer(recording)
    fr.onloadend = () => {
      if(fr.result instanceof ArrayBuffer) {
        let hash = SparkMD5.ArrayBuffer.hash(fr.result)
        let fd = new FormData();
        fd.append('recording', recording)
        fetch(
          config.serverUrl + 'recording/' + hash,
          {
            method:"POST",
            body: fd
          }
        ).then(() => { resolve(hash) })
        .catch((reason) => { reject("could not POST recording: " + reason) })
      } else {
        reject("failed to read recording as array buffer")
      }
    }
  })
}

export async function loadSessionConfig(sessionHash: string) : Promise<SessionConfig> {
  let url = config.serverUrl + 'session/' + sessionHash
  const response = await fetch(url, { method: "GET" })
  return await response.json() as SessionConfig
}

export function loadRecording(recordingHash: string) : Promise<ArrayBuffer> {
  return new Promise(async (resolve, reject) => {
    let url = config.serverUrl + 'recording/' + recordingHash
    const response = await fetch(url, { method: "GET" })
    const blob = await response.blob()
    let fr = new FileReader()
    fr.readAsArrayBuffer(blob)
    fr.onloadend = () => {
      const ab = fr.result
      if( ab instanceof ArrayBuffer) {
        resolve(ab)
      } else {
        reject(Error('failed to convert blob to arraybuffer'))
      }
    }
  })
}

