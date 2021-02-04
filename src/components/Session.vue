<template>
  <div v-if="publishing !== 'no'"
    class="publishing">
    <h1> publishing </h1>
    <div class="log">
      <div v-for="(entry, index) in publishingLog" :key="index">
        <p class="msg" v-if="entry.type === 'msg'">
          {{entry.s}}
        </p>
        <div v-else>
          <CID
            :cid="entry.s"/>
        </div>
      </div>
    </div>
    <div v-if="publishing === 'done'">
      <div v-if="publishingError === undefined">
      </div>
      <div v-else class="publish-erro">
      </div>
      <div class="close" @click="confirmPublishResults()">
        return to session
      </div>
    </div>
  </div>
  <div v-else-if="renaming" key='renaming-page'
    class="renaming">
    <input :value="title" ref="newSessionTitle" @keyup="$event.key === 'Enter' ? updateName() : {}" >
    <div>
      <div class="inline-button" @click="renaming=false">cancel</div>
      <div class="inline-button" @click="updateName">ok</div>
    </div>
  </div>
  <TrackSettings
    v-else-if="editTrackIndex !== null"
    :track="tracks[editTrackIndex]"
    @cancel='editTrackIndex=null'
    @save='updateTrack'/>
  <div v-else
  class="session">
    <div class="cornerbutton back" @click="promtSave()"></div>
    <div class="title" @click="renameSession()">
      <div class="text">
        {{ title }}
      </div>
      <span class="edit"></span>
    </div>
    <div class="cornerbutton publish" @click="publish()"></div>
    <div class="tracks">
      <TrackC
        v-for="(track, key) in tracks"
        :key="key"
        :cid="track.cid"
        :name="track.name"
        :relativeDuration="track.effectiveDuration / maxTrackDuration"
        @editTrack="editTrack(key)"
        />
      <div class='time' :style="{visibility: playing ? 'visible' : 'hidden', left: `calc(3em + ${playtime / maxTrackDuration} * (100% - 3.4em))`}">
      </div>
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
import TrackSettings from '@/components/TrackSettings.vue'
import CID from '@/components/CID.vue'

import { ipfsWrapper, SessionConfig, TrackConfig } from '@/ipfs-wrapper'

import Track from '@/datamodel/Track'

class LogEntry {
  constructor(
    public type: 'msg' | 'cid',
    public s: string
  ) {}
}

@Options({
  components: {
    TrackC,
    TrackSettings,
    CID
  },
  emits: ['goHome']
})
export default class Session extends Vue {
  dirty = false
  publishing = 'no'
  publishingError: undefined | string
  publishingLog: LogEntry[] = []
  renaming = false
  editTrackIndex: number | null = null
  title = 'new session'
  playing = false
  playtime = 0
  recording = false
  tracks: Track[] = reactive([])
  nextLocalTrackId = 0
  maxTrackDuration = 0
  recordingChunks: Blob[] = []
  recordingStopTime = 0
  recordingStartTime = 0
  base: string | undefined
  mediaRecorder: MediaRecorder | undefined
  stopTimeout: any
  playtimeInterval: any
  ac: AudioContext = new AudioContext()
  firstInteraction = true
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
    track.name = 'new track'
    let newMaxDuration = track.effectiveDuration
    this.tracks.forEach(track => { // have to go through all, because the playtimeInterval may habe pushed this.maxDuration too far
      if (track.effectiveDuration > newMaxDuration) {
        newMaxDuration = track.effectiveDuration
      }
    })
    this.maxTrackDuration = newMaxDuration
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
        this.stopTimeout = setTimeout(
          this.stopAllSources.bind(this),
          this.maxTrackDuration * 1000 + 100
        )
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
      track.source = source
    })
    this.playtimeInterval = setInterval(
      () => {
        this.playtime = this.ac.currentTime - now
        console.log('still checking')
        if (this.recording && this.playtime > this.maxTrackDuration) {
          this.maxTrackDuration = this.playtime
        }
      }, 1000 / 24
    )
    return now
  }

  stopAllSources() {
    clearInterval(this.playtimeInterval)
    clearTimeout(this.stopTimeout)
    this.tracks.forEach(track => {
      if (track.source !== undefined) {
        track.source.stop()
      }
    })
    this.playing = false
  }

  toggleRecord() {
    if (this.mediaRecorder !== undefined) {
      if (this.recording) {
        this.mediaRecorder.stop() // triggers onstop callback
        this.stopAllSources()
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

  pLog(msg: string) {
    this.publishingLog.push(
      new LogEntry(
        'msg',
        msg
      )
    )
  }

  pLogCid(cid: string) {
    this.publishingLog.push(
      new LogEntry(
        'cid',
        cid
      )
    )
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight)
    }, 100)
  }

  publish() {
    console.log('publish')
    if (ipfsWrapper.state.value === 'initialized') {
      this.publishing = 'ongoing'
      this.publishingError = undefined
      this.publishingLog = []
      const scrollDown = () => {
        setTimeout(() => {
          window.scrollTo(0, document.body.scrollHeight)
        }, 100)
      }
      this.publishTracks().then(
        () => this.publishSession().then(
          cid => {
            this.base = cid
            this.pLog('jam session is now public on ipfs at:')
            this.pLogCid(cid)
            this.publishing = 'done'
            scrollDown()
          },
          err => {
            this.publishingError = String(err)
            this.publishing = 'done'
            scrollDown()
          }
        )
      )
    }
  }

  confirmPublishResults() {
    this.publishing = 'no'
  }

  publishTracks() {
    return new Promise((resolve, reject) => {
      const promises: Promise<void>[] = []
      this.tracks.forEach(track => {
        if (track.cid === undefined) {
          this.pLog(`publishing track ${track.localId}...`)
          promises.push(new Promise((resolve, reject) => {
            ipfsWrapper.saveTrackAudio(track.audioBlob).then(
              cid => {
                this.pLog(`track ${track.localId} is now public on ipfs at:`)
                this.pLogCid(cid)
                track.cid = cid
                delete track.localId
                resolve()
              },
              reject
            )
          }))
        }
      })
      if (promises.length === 0) {
        this.pLog('no tracks to publish.')
      }
      Promise.all(promises).then(
        resolve,
        reject
      )
    })
  }

  publishSession() {
    const sc = new SessionConfig(
      this.title,
      this.base,
      Date.now(),
      []
    )
    this.tracks.forEach(track => {
      if (track.cid !== undefined) {
        sc.addTrack(new TrackConfig(
          track.cid,
          track.name,
          track.volume,
          track.panning,
          track.offset
        ))
      }
    })
    this.pLog('publishing session...')
    return ipfsWrapper.saveSessionConfig(sc)
  }

  renameSession() {
    this.renaming = true;
    this.$nextTick(() => {
      (this.$refs.newSessionTitle as HTMLInputElement).select()
    })
  }

  updateName() {
    this.title=(this.$refs.newSessionTitle as HTMLInputElement).value
    this.renaming=false
  }

  editTrack(index: number) {
    this.editTrackIndex = index
  }

  updateTrack(_: any, updates: Record<string, any>) {
    console.log('ye')
    if (this.editTrackIndex !== null) {
      const track = this.tracks[this.editTrackIndex]
      if ('name' in updates) {
        track.name = updates.name
      }
      this.editTrackIndex = null
    }
  }

  load() {
    // load
    console.log('load')
  }
}
</script>

<style lang="scss">
.publishing {
  .log {
    font-family: monospace;
    .msg {
      margin: 1em 1em 0 1em;
    }
    .cid {
    }
  }
  .close {
    @include clickable-surface;
  }
}
.renaming {
  position: absolute;
  width: 100%;
  top: 50%;
  transform: translate(0, -50%);
  input {
    padding: 1em;
  }
  .inline-button{
    @include clickable-surface;
    display: inline-block;
  }
}
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
    overflow-x: hidden;
    .time {
      position: absolute;
      background: linear-gradient(90deg, rgb(255, 85, 85), rgb(255, 85, 85) 49%, #fff 50%, #fff);
      z-index: 50;
      top: 0em;
      left: 3em;
      width: 0.4em;
      opacity: 0.5;
      height: 100%;
    }
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
