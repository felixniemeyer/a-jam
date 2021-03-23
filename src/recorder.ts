import { ref, Ref } from "vue"

export interface RecorderState {
  recording: Ref<boolean>
}

export class Recorder {
  recordingChunks: Blob[] = []
  mediaRecorder: MediaRecorder | undefined
  stopTimeout: NodeJS.Timeout | undefined
  playtimeInterval: NodeJS.Timeout | undefined // replace with requestAnimationFrame to avoid lags
  playbackDelay = 0.005
  state: RecorderState = {
    recording: ref(false) 
  } 
  
  onRecordingFinished: undefined | ((audio: Blob) => void)
  
  async initUserMedia () {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      return await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: false,
        noiseSuppression: false
      }})
    } else {
      throw Error('getUserMedia not supported on your browser!')
    }
  }  

  async init() {
    const stream = await this.initUserMedia()
    this.mediaRecorder = new MediaRecorder(stream)
    this.mediaRecorder.ondataavailable = (e) => {
      this.recordingChunks.push(e.data)
    }
    return 
  }
  
  initialized() {
    return this.mediaRecorder !== undefined
  }
     
  async record() {
    if(this.state.recording.value === true) {
      throw Error("Can not start recording: Already recording!")
    } else if(this.mediaRecorder === undefined) {
      throw Error("Can not start recording: MediaRecorder undefined (recorder not initialized?)")
    } else {
      this.state.recording.value = true
      this.recordingChunks = []
      const result = new Promise((resolve, reject) => {
        this.mediaRecorder!.onstop = () => {
          this.state.recording.value = false
          try {
            resolve(new Blob(this.recordingChunks, {
              type: 'audio/ogg; codecs=opus'
            }))
          } catch(e) {
            reject(e)
          }
        }
      })
      return () => {
        this.mediaRecorder!.start()
        return result
      }
    }
  }
  
  stop() {
    this.mediaRecorder?.stop()
  }
}    
  