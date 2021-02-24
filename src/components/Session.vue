<template>
  <div v-if="askForAC"
    class="dialogue">
    <h1>start audio context</h1>
    <p>ajam needs an AudioContext for handling audio data and for sound playback. </p>
    <div class="button"
      @click="acceptAudioContext">
      click here to enable AudioContext
    </div>
  </div>
  <div v-else-if="showLeavePromt"
    class="dialogue">
    <h1>save your changes</h1>
    <p>you have made changes to the session.</p>
    <p>if you leave they will be lost. </p>
    <p>publish the session to persist changes </p>
    <div class="inline-button"
      @click="confirmLeave">
      still leave
    </div>
    <div class="inline-button"
      @click="showLeavePromt = false">
      stay
    </div>
    <div class="inline-button"
      @click="showLeavePromt = false; publish()">
      publish session
    </div>
  </div>
  <div v-else-if="loading"
    class="loading">
    <h1> loading... </h1>
    <Log
      :entries="loadingLog"/>
    <p v-if="loadingError !== null" class="error">{{ loadingError }}</p>
    <div class="button" @click="$emit('goHome')">
      {{ loadingError === null ? 'abort' : 'ok' }}
    </div>
  </div>
  <div v-else-if="publishing !== 'no'"
    class="publishing">
    <h1> publishing... </h1>
    <Log
      :entries="publishingLog"/>
    <div v-if="publishing === 'done'">
      <p
        v-if="publishingError !== null"
        class="error">
        {{ publishingError }}
      </p>
      <div class="button" @click="confirmPublishResults()">
        return to session
      </div>
    </div>
  </div>
  <div v-else-if="renaming" key='renaming-page'
    class="renaming">
    <div v-if="base !== undefined">
      <p> this jam is based on: </p>
      <Copyable :text="base"/>
      <p class="small"> <i> {{ Date(baseDate).toLocaleString() }}</i></p>
    </div>
    <h3> rename session </h3>
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
    <div class="cornerbutton back" @click="leaveSession()"></div>
    <div class="title" @click="renameSession()">
      <div class="text">
        {{ title }}
      </div>
      <span class="edit"></span>
    </div>
    <div class="cornerbutton publish" @click="publish()"></div>
    <div ref="tracksref" class="tracks">
      <TrackC
        v-for="(track, key) in tracks"
        :key="key"
        :cid="track.cid"
        :name="track.name"
        :relativeDuration="track.effectiveDuration / maxTrackDuration"
        @editTrack="editTrack(key)"
        />
      <div
        v-if="recording"
        class="recording-placeholder"
        :style="{width: `calc(3em + ${playtime / maxTrackDuration} * (100% - 3.4em)`}">
      </div>
      <div class='spacer'/>
    </div>
    <div class='time'
      :style="{visibility: playing || recording ? 'visible' : 'hidden', left: `calc(3.15em + ${Math.min(1, playtime / maxTrackDuration)} * (${tracksCssSize} - 3.5em))`}">
    </div>
    <div class="from-time">{{ formatTime(playtime) }}</div>
    <div class="to-time">{{ formatTime(maxTrackDuration)}}</div>
    <div class="controls">
      <span class="shortcut-hint play">
        (space)
      </span>
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
      <span class="shortcut-hint record">
        (r)
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import TrackC from '@/components/Track.vue'
import TrackSettings from '@/components/TrackSettings.vue'
import Log, { LogEntry } from '@/components/Log.vue'
import Copyable from '@/components/Copyable.vue'

import { ipfsWrapper, SessionConfig, TrackConfig } from '@/ipfs-wrapper'
import ac from '@/audio-context'

import Track from '@/datamodel/Track'
import RecentSessionEntry from '@/datamodel/RecentSessionEntry'

@Options({
  components: {
    TrackC,
    TrackSettings,
    Log,
    Copyable
  },
  emits: ['goHome']
})
export default class Session extends Vue {
  @Prop() sessionToLoad: string | undefined

  dirty = false
  showLeavePromt = false
  publishing = 'no'
  publishingError: null | string = null
  publishingLog: LogEntry[] = []
  loading = false
  loadingLog: LogEntry[] = []
  loadingError: string | null = null
  renaming = false
  editTrackIndex: number | null = null
  title = 'new session'
  playing = false
  playtime = 0
  recording = false
  tracks: Track[] = []
  nextLocalTrackId = 0
  maxTrackDuration = 10
  recordingChunks: Blob[] = []
  recordingStopTime = 0
  recordingStartTime = 0
  base: string | undefined
  baseDate: number | undefined
  mediaRecorder: MediaRecorder | undefined
  stopTimeout: NodeJS.Timeout | undefined
  playtimeInterval: NodeJS.Timeout | undefined
  ac: AudioContext = ac
  acceptAudioContext: CallableFunction = () => {} // eslint-disable-line
  askForAC = false
  tracksCssSize = "100%"

  beforeCreate() {
    if (this.sessionToLoad !== undefined) {
      this.loading = true
    }
  }

  mounted() {
    if (this.sessionToLoad !== undefined) {
      this.loadSession(this.sessionToLoad)
    }
    this.initUserMedia()
    document.addEventListener('keydown', this.handleKeydown)
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
    this.maxTrackDuration = this.checkForHigherTrackDuration(track.effectiveDuration)
    this.tracks.push(track)
  }

  checkForHigherTrackDuration(max = 0) {
    this.tracks.forEach(track => { // have to go through all, because the playtimeInterval may habe pushed this.maxDuration too far
      if (track.effectiveDuration > max) {
        max = track.effectiveDuration
      }
    })
    return max
  }

  leaveSession() {
    if (this.dirty) {
      this.suggestToPublish()
    } else {
      this.confirmLeave()
    }
  }

  suggestToPublish() {
    this.showLeavePromt = true
  }

  confirmLeave() {
    this.$emit('goHome')
    this.stopAllSources()
    this.showLeavePromt = false
  }

  formatTime(seconds: number) {
    const s = (seconds % 60).toFixed(1)
    const m = Math.floor(seconds / 60)
    return `${m.toString().padStart(2, '0')}:${s.padStart(4, '0')}`
  }

  showingSession() {
    return ! ( 
      this.askForAC || 
      this.showLeavePromt ||
      this.loading ||
      this.publishing !== 'no' ||
      this.renaming ||
      this.editTrackIndex !== null
    )
  }

  handleKeydown($event: KeyboardEvent) {
    if(this.showingSession()) {
      if ($event.key === ' ') {
        this.togglePlay()
      }
      if ($event.key === 'r') {
        this.toggleRecord()
      }
      if ($event.key === 'Escape') {
        this.leaveSession()
      }
    }
    if($event.key === 'Escape') {
      if(this.showLeavePromt) {
        this.showLeavePromt = false
      }
      if(this.renaming) {
        this.renaming = false
      }
      if(this.editTrackIndex !== null) {
        this.editTrackIndex = null
      }
    }
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
    this.tracksCssSize = (this.$refs.tracksref as HTMLDivElement).clientWidth.toString() + "px"
    this.playtime = 0
    this.playtimeInterval = setInterval(
      () => {
        this.playtime = this.ac.currentTime - now
        if (this.recording && this.playtime > this.maxTrackDuration) {
          this.maxTrackDuration = this.playtime
        }
      }, 1000 / 24
    )
    return now
  }

  stopAllSources() {
    if (this.playtimeInterval !== undefined) {
      clearInterval(this.playtimeInterval)
      this.playtimeInterval = undefined
    }
    if (this.stopTimeout !== undefined) {
      clearTimeout(this.stopTimeout)
      this.stopTimeout = undefined
    }
    this.tracks.forEach(track => {
      if (track.source !== undefined) {
        track.source.stop()
      }
    })
    this.playing = false
    this.playtime = 0
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
        this.dirty = true
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

  pLogCopyable(cid: string) {
    this.publishingLog.push(
      new LogEntry(
        'copyable',
        cid
      )
    )
  }

  publish() {
    if (ipfsWrapper.state.value === 'initialized') {
      this.publishing = 'ongoing'
      this.publishingError = null
      this.publishingLog = []
      const scrollDown = () => {
        setTimeout(() => {
          window.scrollTo(0, document.body.scrollHeight)
        }, 100)
      }
      this.publishTracks().then(
        () => {
          let getIpfsNodeIdPromise = ipfsWrapper.getIpfsNodeId()
          let publishTracksPromise = this.publishSession()
          Promise.all([getIpfsNodeIdPromise, publishTracksPromise]).then(
            values => {
              const ipfsNodeId = values[0]
              const cid = values[1]
              this.base = cid
              RecentSessionEntry.append(new RecentSessionEntry(true, cid, this.title))
              this.logLinks(cid, ipfsNodeId)
              this.publishing = 'done'
              this.dirty = false
              scrollDown()
            },
            err => {
              this.publishingError = String(err)
              this.publishing = 'done'
              scrollDown()
              return err
            }
          )
        }, 
        err => err
      )
    }
  }

  logLinks(cid: string, ipfsNodeId: string){
    const params = [
      `loadSession=${cid}`,
      `loadSessionOrigin=${ipfsNodeId}`
    ]
    const paramString = params.join('&')
    this.pLog('jam session is now public on ipfs at:')
    this.pLogCopyable(cid)
    this.pLog('link for browsers that support ipfs: ')
    this.pLogCopyable(`ipns://${ipfsWrapper.appIPNSIdentifier}/?${paramString}`)
    this.pLog('link for all browsers: ')
    this.pLogCopyable(`https://${ipfsWrapper.gatewayURL}/ipns/${ipfsWrapper.appIPNSIdentifier}/?${paramString}`)
    this.pLog('click to copy')
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
          promises.push(this.publishTrack(track))
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

  publishTrack(track: Track) {
    return new Promise<void>((resolve, reject) => {
      if (track.audioBlob !== undefined) {
        ipfsWrapper.saveTrackAudio(track.audioBlob).then(
          cid => {
            this.pLog(`track ${track.localId} is now public on ipfs at:`)
            this.pLogCopyable(cid)
            track.cid = cid
            delete track.localId
            resolve()
          },
          reject
        )
      } else {
        reject(Error("couldn't save track audio: audioBlob undefined"))
      }
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
    this.renaming = true
    this.$nextTick(() => {
      (this.$refs.newSessionTitle as HTMLInputElement).select()
    })
  }

  updateName() {
    this.title = (this.$refs.newSessionTitle as HTMLInputElement).value
    this.renaming = false
    this.dirty = true
  }

  editTrack(index: number) {
    this.editTrackIndex = index
  }

  updateTrack(name: string | undefined) {
    if (this.editTrackIndex !== null) {
      let somethingChanged = false
      const track = this.tracks[this.editTrackIndex]
      if (name !== undefined) {
        track.name = name
        somethingChanged = true
      }
      this.editTrackIndex = null
      if (somethingChanged) {
        this.dirty = true
      }
    }
  }
  
  /*
  updateTrackVolume(name: number) {
  }
  updateTrackPanning(name: number) {
  }*/

  loadSession(cid: string) {
    this.loadingLog.push(new LogEntry(
      'msg', 'loading session with cid:'
    ))
    this.loadingLog.push(new LogEntry(
      'copyable', cid
    ))
    this.checkAudioContext().then(
      () => {
        ipfsWrapper.loadSessionConfig(cid).then(
          sc => {
            this.base = cid
            this.baseDate = sc.localTime
            this.title = sc.title
            this.loadTracks(sc.tracks).then(
              () => {
                RecentSessionEntry.append(new RecentSessionEntry(false, cid, sc.title))
                this.loading = false
              },
              err => {
                this.loadingError = err
              }
            )
          }
        )
      },
      () => {
        this.loadingError = 'Audio Context wasn\'t allowed to start.'
      }
    )
  }

  loadTracks(trackConfigs: TrackConfig[]) {
    return new Promise<void>((resolve, reject) => {
      const promises: Promise<void>[] = []
      let i = 0
      trackConfigs.forEach(ts => {
        this.loadingLog.push(new LogEntry(
          'msg', `loading track ${ts.name} with cid:`
        ))
        this.loadingLog.push(new LogEntry(
          'copyable', ts.cid
        ))
        const createTrack = (index: number, resolve: CallableFunction) => {
          return (audioBuffer: AudioBuffer) => {
            const track = new Track(undefined, audioBuffer)
            track.cid = ts.cid
            track.name = ts.name
            track.offset = ts.offset
            track.volume = ts.volume
            track.panning = ts.panning
            track.effectiveDuration = track.audioBuffer.duration - track.offset
            this.tracks[index] = track
            resolve()
          }
        }
        promises.push(new Promise<void>((resolve, reject) => {
          ipfsWrapper.loadTrackAudio(ts.cid).then(
            createTrack(i++, resolve),
            reject
          )
        }))
      })
      Promise.all(promises).then(
        () => {
          this.maxTrackDuration = this.checkForHigherTrackDuration(0)
          resolve()
        },
        reject
      )
    })
  }

  checkAudioContext() {
    return new Promise<void>((resolve, reject) => { // eslint-disable-line
      if (this.ac.state === 'suspended') {
        this.askForAC = true
        this.acceptAudioContext = () => {
          this.askForAC = false
          this.ac.resume()
          resolve()
        }
      } else {
        resolve()
      }
    })
  }
  
  beforeDestroy() {
    this.stopAllSources()
    document.removeEventListener('keydown', this.handleKeydown)
  }
}
</script>

<style lang="scss">
/* {
  outline: 1px solid green;
} /** */
.publishing, .loading, .dialogue{
  .button {
    @include clickable-surface;
  }
  .inline-button{
    @include clickable-surface;
    display: inline-block;
  }
}
.renaming {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(100% - 1em);
  transform: translate(-50%, -50%);
  input {
    padding: 1em;
  }
  .small {
    font-size: 0.7em;
  }
  .inline-button{
    @include clickable-surface;
    display: inline-block;
  }
}
.session {
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
    position: fixed;
    z-index: 50;
    top:5em;
    height: calc(100% - 10em);
    background: linear-gradient(90deg, rgba(255, 85, 85, 0), rgb(255, 85, 85) 49%, #fff 50%, #fff0);
    left: 3em;
    width: 0.3em;
    opacity: 0.75;
  }
  .from-time, .to-time {
    position: fixed;
    z-index: 51;
    bottom: 5.2em;
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
