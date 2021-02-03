<template>
  <div class="session">
    <div class="cornerbutton back" @click="promtSave()"></div>
    <div class="title">
      <div class="text">
        session title
      </div>
      <span class="edit"></span>
    </div>
    <div class="cornerbutton publish"></div>
    <div class="tracks">
      <TrackC
        v-for="(track, index) in tracks"
        :key="track.cid === undefined ? track.localId : track.cid"
        :cid="track.cid"
        :relativeDuration="track.effectiveDuration / maxTrackDuration"
        />
    </div>
    <div class="controls">
      <div
        class="play button"
        v-bind:class="{ playing }"
        @click="this.ac.resume().then(togglePlay.bind(this))"
      ></div>
      <div
        class="record button"
        v-bind:class="{ recording }"
        @click="this.ac.resume().then(toggleRecord.bind(this))"
      ></div>
    </div>
  </div>
</template>

<script lang="ts">
import { reactive } from 'vue'
import { Options, Vue } from 'vue-class-component'

import TrackC from '@/components/Track.vue'

class Track {
  localId: number | undefined = undefined
  cid: number | undefined = undefined
  name = 'new recording'
  audioBlob: Blob
  audioBuffer: AudioBuffer
  volume = 1.0
  offset = 0.0
  effectiveDuration = 0
  constructor(blob: Blob, buffer: AudioBuffer) {
    this.audioBlob = blob
    this.audioBuffer = buffer
  }
}

@Options({
  components: {
    TrackC
  },
  emits: ['goHome']
})
export default class Session extends Vue {
  dirty = false
  playing = false
  recording = false
  sessionTitle = 'new session'
  tracks: Track[] = []
  nextLocalTrackId = 0
  maxTrackDuration = 0
  recordingChunks: Blob[] = []
  recordingStopTime = 0
  recordingStartTime = 0
  mediaRecorder: MediaRecorder | undefined
  stopTimeout: any
  ac: AudioContext = new AudioContext()
  firstInteraction = true
  sources: AudioBufferSourceNode[] = []
  mounted() {
    this.initUserMedia()
  }

  initUserMedia() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false
          }
        })
        .then(this.initRecorder.bind(this))
        .catch(function (err) {
          console.error('The following getUserMedia error occurred: ' + err)
        })
    } else {
      console.error('getUserMedia not supported on your browser!')
    }
  }

  initRecorder(stream: MediaStream) {
    this.mediaRecorder = new MediaRecorder(stream)
    this.mediaRecorder.ondataavailable = (e) => {
      this.recordingStopTime = this.ac.currentTime
      this.recordingChunks.push(e.data)
    }
    this.mediaRecorder.onstop = () => {
      const audio = new Blob(this.recordingChunks, {
        type: 'audio/ogg; codecs=opus'
      })
      const fileReader = new FileReader()
      fileReader.onloadend = () => {
        const arrayBuffer = fileReader.result
        if (arrayBuffer instanceof ArrayBuffer) {
          this.ac.decodeAudioData(arrayBuffer).then(
            (audioBuffer) => {
              const offset =
                this.recordingStopTime -
                (this.recordingStartTime + audioBuffer.duration)
              this.createTrack(audio, audioBuffer, offset)
            },
            (err) => {
              console.error('failed to decode audio data:', err)
            }
          )
        } else {
          console.error('arrayBuffer is not an ArrayBuffer')
        }
      }
      fileReader.readAsArrayBuffer(audio)
    }
  }

  createTrack(audioBlob: Blob, audioBuffer: AudioBuffer, offset: number) {
    const track = new Track(
      audioBlob,
      audioBuffer
    )
    track.localId = this.nextLocalTrackId++
    track.offset = offset
    track.effectiveDuration = audioBuffer.duration - offset
    if (track.effectiveDuration > this.maxTrackDuration) {
      this.maxTrackDuration = track.effectiveDuration
    }
    this.tracks.push(reactive(track))
  }

  // loadTrack()

  promtSave() {
    if (this.dirty) {
      // check whether person wants to save. warn: "unpublished changes will be lost!"
    }
    this.$emit('goHome')
  }

  togglePlay() {
    if (this.playing) {
      this.stopAllSources()
    } else {
      if (!this.recording) {
        this.playAll()
        this.playing = true
      }
    }
  }

  playAll() {
    this.stopAllSources()
    const now = this.ac.currentTime
    this.tracks.forEach(track => {
      const source = this.ac.createBufferSource()
      source.buffer = track.audioBuffer
      source.connect(this.ac.destination)
      if (track.offset < 0) {
        source.start(now - track.offset)
      } else {
        source.start(now, track.offset)
      }
      this.sources.push(source)
    })
    this.stopTimeout = setTimeout(
      () => { this.playing = false },
      this.maxTrackDuration * 1000 + 100
    )
    return now
  }

  stopAllSources() {
    clearTimeout(this.stopTimeout)
    this.sources.forEach(source => {
      source.stop()
    })
    this.sources = []
    this.playing = false
  }

  toggleRecord() {
    if (this.mediaRecorder !== undefined) {
      if (this.recording) {
        this.mediaRecorder.stop() // triggers onstop callback
        this.recording = false
      } else {
        this.stopAllSources()
        this.recordingStartTime = this.playAll()
        this.recordingChunks = []
        this.mediaRecorder.start()
        this.recording = true
      }
    } else {
      console.error('mediaRecorder undefined -> recording not possible')
    }
  }

  publish() {
    // save tracks
    // create config
    console.log('publish')
  }

  load() {
    // load
    console.log('load')
  }
}
</script>

<style lang="scss">
.session {
  .title {
    position: absolute;
    width: calc(0.9 * (100% - 8em));
    left: 50%;
    top: 2.5em;
    max-height: 5em;
    transform: translate(-50%, -50%);
    .text{
      display: inline-block;
      max-width: calc(100% - 2em);
      vertical-align: middle;
    }
    .edit{
      @include centered-background-image;
      vertical-align: bottom;
      display: inline-block;
      width: 2em;
      height: 2em;
      opacity: 0.33;
      background-image: url("~@/assets/icons/edit.svg");
    }
  }
  .cornerbutton.publish {
    background-image: url("~@/assets/icons/publish.svg");
    right: 1em;
    top: 1em;
  }

  .tracks {
    position: absolute;
    background: linear-gradient(178deg, #ddd, #fff, #eee);
    text-align: left;
    left: 0;
    top: 5em;
    height: calc(100% - 10em);
    width: 100%;
    overflow-y: scroll;
  }

  .controls {
    position: fixed;
    bottom: 0em;
    height: 5em;
    left: 50%;
    transform: translate(-50%, 0);
    .button {
      display: inline-block;
      height: 4em;
      width: 4em;
      margin: 0.5em;
      background-size: 100%;
      background-repeat: no-repeat;
      background-position: center;
      border-radius: 2em;
      box-shadow: 0 0 0.5em #0008;
    }
    .record.button {
      background-image: url("~@/assets/icons/record.svg");
      cursor: pointer;
      &.recording {
        background-image: url("~@/assets/icons/stop-record.svg");
        background-color: #c00;
      }
    }
    .play.button {
      background-image: url("~@/assets/icons/play.svg");
      background-size: 80%;
      cursor: pointer;
      &.playing {
        background-image: url("~@/assets/icons/stop-play.svg");
      }
    }
  }
}
</style>
