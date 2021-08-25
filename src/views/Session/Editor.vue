<template>
  <div class="session">
    <a ref="hiddenDownload" class="hiddenDownload"/>
    <div class="cornerbutton back" @click="goHome"></div>
    <div class="title" @click="openSettings()">
      <div class="text">
        {{ session.title }}
      </div>
      <span class="edit"></span>
    </div>
    <div class="cornerbutton publish" @click="publish"></div>
    <div class="trackArea">
      <div ref="trackList" class="trackList">
        <TrackLi
          v-for="(track, key) in session.tracks"
          :key="key"
          :cid="track.recording.cid"
          :name="track.name"
          :muted="track.muted"
          :relativeDuration="track.effectiveDuration / maxTrackDuration"
          @toggleMute="toggleTrackMute(track)"
          @editTrack="$router.push(`/session/${this.localId}/track/${key}`)"
          />
        <div v-if="session.tracks.length === 0 && !recording && recordingProcessed" class="hint">
          <p>
          There are no tracks yet.
          </p>
          Start with:
          <div>
            - recording a track, <br/>
            - uploading a local file or <br/>
            - importing one by cid.
          </div>
        </div>
        <div
          v-if="recording || !recordingProcessed"
          class="recordBar"
          :style="{width: `calc(3em + ${playProgress} * (100% - 3.4em)`}">
        </div>
        <div
          :class="{hidden: recording}"
          class="importers">
          import recording...
          <div class="button" @click="importRecordingByCid">by cid</div>
          <div class="button" @click="importRecordingFromFile">from file</div>
        </div>
      </div>
      <div class="hoverstuff">
        <div class='time'
          :style="{visibility: playing || recording ? 'visible' : 'hidden', left: `calc(3.15em + ${playProgress} * (100% - 3.5em))`}">
        </div>
        <div class="from-time">{{ formatTime(playtime) }}</div>
        <div class="to-time">{{ formatTime(maxTrackDuration)}}</div>
      </div>
    </div>

    <div class="controls">
      <span class="shortcut-hint record">
        <div class="recloop" :class="{on: recloop}" @click="toggleRecloop"></div>
        (r)
      </span>
      <div
        class="record button"
        :class="{ recording }"
        @click="toggleRecord"
      ></div>
      <div
        class="play button"
        :class="{ playing }"
        @click="togglePlay"
      ></div>
      <span class="shortcut-hint play">
        (space)
      </span>
      <div class="export"
        @click="renderAndDownload">
      </div>
    </div>

    <div v-if="resolveCalibrationPrompt !== undefined" class="calibrationPromt">
      <h4>calibration</h4>
      <div>
      Great, you are about to record your second track on this device. <br/>
      In order for the two tracks to be synchronized well, you should first calibrate the recording offset.<br/>
      </div>
      <div>
      Find a quiet environment and start the automatic calibration.
      It only takes a couple of bleeps and seconds ~(o_o)~
      </div>
      <div class="button" @click="goCalibrate">
        go calibrating
      </div>
      <div class="button" @click="dismissCalibrationPrompt">
        dismiss
      </div>
      <div class="button" @click="skipCalibrationPrompt">
        remind me later
      </div>
      <div>
        You can always find the automatic calibration in the app settings.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import TrackLi from '@/components/TrackLi.vue'
import { Track } from '@/types'

import { debug } from '@/tools'

import toWav from 'audiobuffer-to-wav'
import Keyhandler from '@/mixins/Keyhandler'

export default defineComponent({
  mixins: [Keyhandler],
  components: {
    TrackLi
  },
  data () {
    const localId = parseInt(this.$route.params.localId as string) // TODO it would be safer to reset these in beforeRouteUpdate
    const session = this.state.sessions.local[localId]
    return {
      localId,
      session,
      // playback
      playing: false,
      playtime: 0,
      playbackStartTime: 0,
      // recording
      recordingChunks: [] as Blob[],
      mediaRecorder: undefined as MediaRecorder | undefined,
      stopTimeout: undefined as number | undefined,
      recording: false,
      skipRecording: false,
      recordingProcessed: true,
      recloop: false,
      recloopDuration: 0,
      quitRecloop: true,
      resolveCalibrationPrompt: undefined as undefined | ((value: unknown) => void)
    }
  },
  computed: {
    playProgress (): number {
      const p = this.playtime
      const d = this.maxTrackDuration
      return Math.min(1, p / d)
    },
    maxTrackDuration (): number {
      let maxDuration = 0
      this.session.tracks.forEach(track => {
        if (track.effectiveDuration > maxDuration) {
          maxDuration = track.effectiveDuration
        }
      })
      if (maxDuration === 0) {
        maxDuration = 10
      }
      if (this.recording && this.playtime > maxDuration) {
        maxDuration = this.playtime
      }
      return maxDuration
    }
  },
  beforeUnmount () {
    this.stopAllPlaybacks()
    if (this.mediaRecorder !== undefined && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }
  },
  methods: {
    toggleTrackMute (track: Track) {
      track.muted = !track.muted
      if (track.playback !== undefined) {
        if (track.muted) {
          track.playback.gain.gain.value = 0
        } else {
          track.playback.gain.gain.value = track.volume
        }
      }
    },
    publish () {
      debug(this.$route.path)
      this.$router.push({
        name: 'SessionPublish',
        params: {
          localId: this.localId
        }
      })
    },
    openSettings () {
      this.$router.push({
        name: 'SessionSettings',
        params: {
          localId: this.localId
        }
      })
    },
    importRecordingFromFile () {
      this.$router.push({
        name: 'FromFileImporter',
        params: {
          localId: this.localId
        }
      })
    },
    importRecordingByCid () {
      this.$router.push({
        name: 'ByCidImporter',
        params: {
          localId: this.localId
        }
      })
    },
    formatTime (seconds: number) {
      const s = (seconds % 60).toFixed(1)
      const m = Math.floor(seconds / 60)
      return `${m.toString().padStart(2, '0')}:${s.padStart(4, '0')}`
    },
    handleKeydown ($event: KeyboardEvent) {
      if ($event.key === ' ') {
        this.togglePlay()
      }
      if ($event.key === 'r') {
        this.toggleRecord()
      }
      if ($event.key === 'Escape') {
        if (this.recording) {
          this.cancelRecording()
        } else if (this.playing) {
          this.togglePlay()
        } else {
          this.goHome()
        }
      }
    },
    goHome () {
      this.$router.replace({ name: 'Home' })
    },
    async ensureAcIsRunning () {
      if (this.ac.state !== 'running') {
        return this.ac.resume()
      }
    },
    async togglePlay () {
      if (!this.recording) {
        if (this.playing) {
          this.stopAllPlaybacks()
        } else {
          await this.ensureAcIsRunning()
          this.playAllTracks()
          this.stopTimeout = window.setTimeout(
            this.stopAllPlaybacks.bind(this),
            this.maxTrackDuration * 1000 + this.state.settings.playbackDelay
          )
          this.playing = true
        }
      } else {
        this.toggleRecord()
      }
    },
    async renderAndDownload () {
      const renderStartTime = 0.5
      const oac = new OfflineAudioContext(2, (this.maxTrackDuration + renderStartTime) * 44100, 44100)
      this.session.tracks.forEach(track => {
        const playback = this.createPlayback(track, oac)
        if (track.offset > 0) {
          playback.source.start(renderStartTime, track.offset)
        } else {
          playback.source.start(renderStartTime - track.offset)
        }
        debug('started playback for offline ac')
      })
      const renderedBuffer = await oac.startRendering()
      const wav = toWav(renderedBuffer)
      const blob = new Blob([wav], { type: 'audio/wav' })

      const link = this.$refs.hiddenDownload as HTMLLinkElement
      link.setAttribute('href', URL.createObjectURL(blob))
      link.setAttribute('download', this.session.title + '.wav')
      link.click()
    },
    playAllTracks () {
      this.stopAllPlaybacks()
      this.session.tracks.forEach(track => {
        track.playback = this.createPlayback(track, this.ac)
      })
      this.playbackStartTime = this.ac.currentTime + this.state.settings.playbackDelay
      debug(this.playbackStartTime)
      this.session.tracks.forEach(track => {
        if (track.playback !== undefined) {
          if (track.offset > 0) {
            track.playback.source.start(this.playbackStartTime, track.offset)
          } else {
            track.playback.source.start(this.playbackStartTime - track.offset)
          }
        }
      })
      this.playtime = 0
      this.playing = true
      this.updatePlaytime()
    },
    createPlayback (track: Track, ac: AudioContext | OfflineAudioContext) {
      const source = ac.createBufferSource()
      source.buffer = track.recording.audioBuffer
      const panner = ac.createStereoPanner()
      panner.pan.value = track.panning
      const gain = ac.createGain()
      gain.gain.value = track.muted ? 0 : track.volume
      source
        .connect(gain)
        .connect(panner)
        .connect(ac.destination)
      return {
        source,
        panner,
        gain
      }
    },
    updatePlaytime () {
      if (this.playing) {
        this.playtime = this.ac.currentTime - this.playbackStartTime
        requestAnimationFrame(this.updatePlaytime.bind(this))
      }
    },
    stopAllPlaybacks () {
      if (this.stopTimeout !== undefined) {
        clearTimeout(this.stopTimeout)
        this.stopTimeout = undefined
      }
      this.session.tracks.forEach(track => {
        track.playback?.source.stop() // eslint-disable-line
        delete track.playback
      })
      this.playing = false
      this.playtime = 0
    },
    async toggleRecord () {
      if (this.mediaRecorder === undefined) {
        await this.initMediaRecorder()
      }
      if (this.recording) {
        this.quitRecloop = true
        this.stopRecording()
      } else {
        if (this.state.settings.initialCalibration === false && this.session.tracks.length > 0) {
          if (await this.promptForCalibration() === 0) {
            return
          }
        }
        if (!this.playing) {
          await this.ensureAcIsRunning()
          this.stopAllPlaybacks()
          this.recordingChunks = []
          this.playAllTracks()
          this.mediaRecorder?.start() // eslint-disable-line
          this.recording = true
          this.recordingProcessed = false
          this.session.dirty = true
          if (this.recloop) {
            this.quitRecloop = false
            window.setTimeout(this.stopRecording.bind(this), this.recloopDuration * 1000)
          }
        }
      }
    },
    stopRecording () {
      if (this.mediaRecorder !== undefined && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop()
      }
      this.stopAllPlaybacks()
      this.recording = false
    },
    toggleRecloop () {
      this.recloop = !this.recloop
      if (this.recloop) {
        this.recloopDuration = this.maxTrackDuration
      }
    },
    cancelRecording () {
      if (this.recording) {
        this.skipRecording = true
        this.quitRecloop = true
        this.stopRecording()
      }
    },
    async initMediaRecorder () {
      debug('initializing media recorder')
      const stream = await this.initUserMedia()
      this.mediaRecorder = new MediaRecorder(stream)
      this.mediaRecorder.ondataavailable = event => {
        this.recordingChunks.push(event.data)
        debug('added recording chunk')
      }
      this.mediaRecorder.onstop = async () => {
        if (this.skipRecording) {
          this.skipRecording = false
          this.recordingProcessed = true
        } else {
          const audio = new Blob(this.recordingChunks, {
            type: 'audio/ogg; codecs=opus'
          })
          debug('audio blob', audio)
          const track = await this.createTrack(audio)
          this.recordingProcessed = true
          const trackListDiv = this.$refs.trackList as HTMLDivElement
          trackListDiv.scrollTop = trackListDiv.scrollHeight
          if (this.recloop && !this.quitRecloop) {
            track.muted = true
            this.toggleRecord()
          }
        }
      }
    },
    async initUserMedia () {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        debug('micDeviceId', this.state.settings.micDeviceId)
        let deviceId
        if (this.state.settings.micDeviceId) {
          deviceId = { exact: this.state.settings.micDeviceId }
        }
        const constraints: MediaStreamConstraints = {
          audio: {
            deviceId: deviceId,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          },
          video: false // wäre eigentlich geil, das auch zu ermöglichen => V4 ;)
        }
        return await navigator.mediaDevices.getUserMedia(constraints)
      } else {
        throw Error('getUserMedia not supported on your browser!')
      }
    },
    createTrack (audioBlob: Blob) {
      return new Promise<Track>((resolve, reject) => {
        const fileReader = new FileReader()
        fileReader.onloadend = () => {
          const arrayBuffer = fileReader.result
          if (arrayBuffer instanceof ArrayBuffer) {
            this.ac.decodeAudioData(arrayBuffer).then(
              (audioBuffer) => {
                debug(audioBuffer)
                const track = new Track(this.state.settings.defaultRecordingOffset, {
                  cid: undefined,
                  audioBlob,
                  audioBuffer
                })
                this.session.tracks.push(track)
                resolve(track)
              },
              (err) => {
                reject(new Error(`failed to decode audio data: ${err}`))
              }
            )
          } else {
            reject(new Error('arrayBuffer is not an ArrayBuffer'))
          }
        }
        fileReader.readAsArrayBuffer(audioBlob)
      })
    },
    promptForCalibration () {
      return new Promise((resolve, reject) => {
        this.resolveCalibrationPrompt = resolve
        window.setTimeout(reject, 20000)
      })
    },
    goCalibrate () {
      this.$router.push('/offsetCalibration')
      if (this.resolveCalibrationPrompt !== undefined) {
        this.resolveCalibrationPrompt(0)
      }
    },
    dismissCalibrationPrompt () {
      this.storageWrapper.setInitialCalibration(true)
      this.state.settings.initialCalibration = true
      this.skipCalibrationPrompt()
    },
    skipCalibrationPrompt () {
      if (this.resolveCalibrationPrompt !== undefined) {
        this.resolveCalibrationPrompt(1)
        this.resolveCalibrationPrompt = undefined
      }
    }
  }
})

</script>

<style lang="scss">
.session {
  .hiddenDownload {
    position: fixed;
    width: 1px;
    height: 1px;
    top: 0;
    left: 0;
  }
  width: 100%;
  height: 100%;
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
      opacity: 0.9;
      background-image: url("~@/assets/icons/white/edit.svg");
      cursor: pointer;
    }
  }
  .cornerbutton.publish {
    background-image: url("~@/assets/icons/white/publish.svg");
    right: 1em;
    top: 1em;
  }

  .trackArea {
    position: absolute;
    background-color: #444;
    background-image: url('~@/assets/logo-watermark-small.png');
    background-position: center;
    background-repeat: repeat;
    text-align: left;
    left: 0;
    top: 5em;
    height: calc(100% - 10em);
    width: 100%;
    .trackList{
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      .recordBar {
        height: 1em;
        margin: 1em 0.2em;
        background-color: #c00;
        border-radius: 0.5em;
      }
      .hint {
        text-align: center;
        color: #999;
        margin: 1em 1em 0.5em 1em;
        div {
          display: inline-block;
          text-align: left;
          vertical-align: top;
        }
      }
      .importers {
        height: 4em;
        width: 100%;
        text-align: center;
        .button {
          cursor: pointer;
          padding: 0.5em;
          margin: 0.5em;
          display: inline-block;
          background-color: darken($brown, 15%);
          border-radius: 0.5em;
          &:hover {
            background-color: darken($brown, 0%);
          }
        }
        transition: opacity ease-in-out 0.2s;
        opacity: 1;
        &.hidden {
          opacity: 0;
          transition: opacity ease-in-out 0s;
        }
      }
    }
    .time {
      position: absolute;
      z-index: 50;
      top:0em;
      height: calc(100%);
      background: linear-gradient(90deg, rgba(255, 85, 85, 0), rgb(255, 85, 85) 49%, #fff 50%, #fff0);
      left: 3em;
      width: 0.3em;
      opacity: 0.75;
    }
    .from-time, .to-time {
      position: absolute;
      z-index: 51;
      bottom: 0.5em;
      background-color: #333;
      color: #999;
      padding: 0.2em;
    }
    .from-time {
      left: 0.5em;
    }
    .to-time {
      right: 0.5em;
    }
  }

  .controls {
    position: fixed;
    bottom: 0em;
    height: 5em;
    overflow-y: hidden;
    width: 100%;
    margin:0;

    $buttonBgc: #555;
    $recBgc: #c00;

    .button, .export, .recloop{
      cursor: pointer;
      background-repeat: no-repeat;
      background-position: center;
      user-select: none;
      box-sizing: border-box;
    }

    .recloop, .export {
      position: absolute;
      width: 3rem;
      height: 3rem;
      border-radius: 0.5rem;
    }
    .recloop {
      left: -1em;
      top: 50%;
      transform: translate(0, -50%);
      border: 0.2em solid $recBgc;
      background-color: $buttonBgc;
      background-size: 80%;
      background-image: url("~@/assets/icons/white/recloop.svg");
      &:hover {
        background-color: lighten($buttonBgc, 20%);
      }
      &.on {
        background-color: $recBgc;
      }
    }
    .export {
      right: 1em;
      top: 1rem;
      background-color: darken($brown, 15%);
      background-size: 80%;
      background-image: url("~@/assets/icons/white/download.svg");
      &:hover {
        background-color: darken($brown, 0%);
      }
    }

    .button {
      display: inline-block;
      background-color: $buttonBgc;
      &:hover {
        background-color: lighten($buttonBgc, 20%);
      }
      height: 4em;
      width: 4em;
      margin: 0.5em;
      background-size: 100%;
      border-radius: 2em;
      &.record {
        border: 0.2em solid $recBgc;
        background-image: url("~@/assets/icons/record.svg");
        cursor: pointer;
        &.recording {
          background-image: url("~@/assets/icons/white/stop-record.svg");
          background-color: $recBgc;
          border:none;
        }
      }
      &.play {
        background-image: url("~@/assets/icons/white/play.svg");
        background-size: 80%;
        border: 0.2em solid #999;
        cursor: pointer;
        &.playing {
          background-image: url("~@/assets/icons/white/stop-play.svg");
          background-color: #999;
        }
      }
      vertical-align: middle;
    }
    .shortcut-hint {
      position: relative;
      display: inline-block;
      width: 4em;
      margin: 0.3em;
      padding: 0;
      color: #999;
      vertical-align: middle;
      &.play {
        text-align: left;
      }
      &.record {
        text-align: right;
      }
    }
  }
  .calibrationPromt {
    position:fixed;
    max-height: 100%;
    div {
      margin: 0.5rem 0.3rem;
    }
    top: 50%;
    transform: translate(0, -50%);
    background-color: $brown;
    box-shadow: 0 0 5rem #000;
    z-index: 99;
    margin: 0rem 2em;
    border-radius: 1em;
    .button {
      @include clickable-surface;
      margin: 0.3rem;
      display: inline-block;
    }
  }
}
</style>
