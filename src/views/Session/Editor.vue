<template>
  <div class="session">
    <a ref="hiddenDownload" class="hiddenDownload"/>
    <div class="cornerbutton back" @click="$router.go(-1)"></div>
    <div class="title" @click="openSettings()">
      <div class="text">
        {{ session.title }}
      </div>
      <span class="edit"></span>
    </div>
    <div class="cornerbutton publish" @click="publish"></div>
    <div class="trackArea">
      <div class="trackList">
        <TrackLi
          v-for="(track, key) in session.tracks"
          :key="key"
          :cid="track.recording.cid"
          :name="track.name"
          :relativeDuration="track.effectiveDuration / maxTrackDuration"
          @editTrack="$router.push(`/session/${this.localId}/track/${key}`)"
          />
        <div
          v-if="recording"
          class="recording-placeholder"
          :style="{width: `calc(3em + ${playProgress} * (100% - 3.4em)`}">
        </div>
        <div class='spacer'/>
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
      <div class="download button"
        @click="renderAndDownload">exp</div>
      <span class="shortcut-hint play">
        (space)
      </span>
      <div
        class="play button"
        :class="{ playing }"
        @click="togglePlay"
      ></div>
      <div
        class="record button"
        :class="{ recording }"
        @click="toggleRecord"
      ></div>
      <span class="shortcut-hint record">
        (r)
      </span>
      <div class="mic button"
        @click="chooseMic">mic</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import TrackLi from '@/components/TrackLi.vue'
import { Track } from '@/types'

import { debug } from '@/tools'

import toWav from 'audiobuffer-to-wav'

export default defineComponent({
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
      stopTimeout: undefined as NodeJS.Timeout | undefined,
      recording: false
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
  mounted () {
    document.addEventListener('keydown', this.handleKeydown)
  },
  beforeUnmount () {
    this.stopAllPlaybacks()
    if (this.mediaRecorder !== undefined && this.mediaRecorder?.state !== 'inactive') {
      this.mediaRecorder!.stop() // eslint-disable-line
    }
    document.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
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
        this.$router.go(-1)
      }
    },
    async ensureAcIsRunning () {
      if (this.ac.state !== 'running') {
        return this.ac.resume()
      }
    },
    async togglePlay () {
      if (this.playing) {
        this.stopAllPlaybacks()
      } else {
        if (!this.recording) {
          await this.ensureAcIsRunning()
          this.playAllTracks()
          this.stopTimeout = setTimeout(
            this.stopAllPlaybacks.bind(this),
            this.maxTrackDuration * 1000 + this.state.settings.playbackDelay
          )
          this.playing = true
        }
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
      link.setAttribute('download', this.session.title)
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
      gain.gain.value = track.volume
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
        if (this.mediaRecorder !== undefined && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop()
        }
        this.stopAllPlaybacks()
        this.recording = false
      } else {
        await this.ensureAcIsRunning()
        this.stopAllPlaybacks()
        this.recordingChunks = []
        this.playAllTracks()
        this.mediaRecorder?.start() // eslint-disable-line
        this.recording = true
        this.session.dirty = true
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
        const audio = new Blob(this.recordingChunks, {
          type: 'audio/ogg; codecs=opus' // possible source of bugs: unsure whether this is correct on all platforms
        })
        debug('audio blob', audio)
        this.createTrack(audio)
      }
    },
    async initUserMedia () {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        debug('micDeviceId', this.state.settings.micDeviceId)
        const constraints: MediaStreamConstraints = {
          audio: {
            deviceId: this.state.settings.micDeviceId,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          },
          video: false // wäre eigentlich geil, das auch zu ermöglichen => V4 ;)
        }
        return await navigator.mediaDevices.getUserMedia(constraints) // todo mediaDevices.enumerateDevices and let user choose his preferred mic (super for mobile devices)
      } else {
        throw Error('getUserMedia not supported on your browser!')
      }
    },
    createTrack (audioBlob: Blob) {
      const fileReader = new FileReader()
      fileReader.onloadend = () => {
        const arrayBuffer = fileReader.result
        if (arrayBuffer instanceof ArrayBuffer) {
          this.ac.decodeAudioData(arrayBuffer).then(
            (audioBuffer) => {
              this.session.tracks.push(new Track(this.state.settings.defaultRecordingOffset, {
                cid: undefined,
                audioBlob,
                audioBuffer
              }))
            },
            (err) => {
              console.error('failed to decode audio data:', err)
            }
          )
        } else {
          console.error('arrayBuffer is not an ArrayBuffer')
        }
      }
      fileReader.readAsArrayBuffer(audioBlob)
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
      opacity: 0.33;
      background-image: url("~@/assets/icons/edit.svg");
    }
  }
  .cornerbutton.publish {
    background-image: url("~@/assets/icons/publish.svg");
    right: 1em;
    top: 1em;
  }

  .trackArea {
    position: absolute;
    background: linear-gradient(178deg, #ddd, #fff, #eee);
    text-align: left;
    left: 0;
    top: 5em;
    height: calc(100% - 10em);
    width: 100%;
    .trackList{
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      .recording-placeholder {
        height: 1em;
        margin: 1em 0.2em;
        background-color: #c00;
        border-radius: 0.5em;
      }
      .spacer {
        height: 2em;
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
      bottom: 0.2em;
      background-color: #fffb;
      color: #777;
      padding: 0.2em;
    }
    .from-time {
      left: 0.2em;
    }
    .to-time {
      right: 0.2em;
    }
  }

  .controls {
    position: fixed;
    bottom: 0em;
    height: 5em;
    overflow-y: hidden;
    width: 100%;
    margin:0;
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
      cursor: pointer;
      &.record {
        background-image: url("~@/assets/icons/record.svg");
        cursor: pointer;
        &.recording {
          background-image: url("~@/assets/icons/stop-record.svg");
          background-color: #c00;
        }
      }
      &.play {
        background-image: url("~@/assets/icons/play.svg");
        background-size: 80%;
        cursor: pointer;
        &.playing {
          background-image: url("~@/assets/icons/stop-play.svg");
        }
      }
      &.download,
      &.mic {
        line-height: 4em;
      }
      vertical-align: middle;
    }
    .shortcut-hint {
      display: inline-block;
      width: 4em;
      margin: 0.5em;
      color: #777;
      vertical-align: middle;
      &.play {
        text-align: right;
      }
      &.record {
        text-align: left;
      }
    }
  }
}
</style>
