<template>
  <div class="session">
    <div class="cornerbutton back" @click="$router.go(-1)"></div>
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
    </div> <!-- solve this with html and css -->
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
import { defineComponent } from 'vue'

import { useStore } from '@/store'

import TrackC from '@/components/Track.vue'
import TrackSettings from '@/views/TrackSettings.vue'
import Log, { LogEntry } from '@/components/Log.vue'
import Copyable from '@/components/Copyable.vue'

import { ipfsWrapper, SessionConfig, TrackConfig } from '@/ipfs-wrapper'
import ac from '@/audio-context'

const store = useStore()

export default defineComponent({
  components: {
    TrackC,
    TrackSettings,
    Log,
    Copyable
  },
  data() {
    const store = useStore()
    const localSessionId = parseInt(this.$route.params.localSessionId as string)
    return {
      session: store.state.sessions.local[localSessionId],
      // move to vuex
      dirty: false, // let's see how to implement this concept in vuex
        // playback and recording
      playtime: 0,
    }

  },
  computed: {
    title() {
      return this.session.title
    },
    maxTrackDuration() {
      let maxDuration = 10
      this.session.tracks.forEach(track => {
        if(track.effectiveDuration > maxDuration) {
          maxDuration = track.effectiveDuration
        }
      })
      return maxDuration
    }
  },
  beforeCreate () {
  },
  beforeRouteUpdate() {
    console.log("before route update")
    if(this.$route.params.cid !== undefined) {
      this.checkAudioContext().then(
        () => {
          this.loadSession(this.$route.params.cid as string)
        },
        () => {
          this.loadingError = 'Audio Context wasn\'t allowed to start but is required even for session loading.'
        }
      )
    }
  },
  mounted () {
    this.initUserMedia()
    document.addEventListener('keydown', this.handleKeydown)
    this.updateTracksCssSize()
  },
  beforeUnmount () {
    this.stopAllSources()
    document.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
   initUserMedia () {
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

    initRecorder (stream: MediaStream) {
      this.mediaRecorder = new MediaRecorder(stream)
      this.mediaRecorder.ondataavailable = (e) => {
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
                this.createTrack(audio, audioBuffer, this.playbackDelay + this.defaultRecordingOffset)
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

    createTrack (audioBlob: Blob, audioBuffer: AudioBuffer, offset: number) {
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

    checkForHigherTrackDuration (max = 0) {
      this.tracks.forEach(track => { // have to go through all, because the playtimeInterval may habe pushed this.maxDuration too far
        if (track.effectiveDuration > max) {
          max = track.effectiveDuration
        }
      })
      return max
    }

    leaveSession () {
      if (this.dirty) {
        this.suggestToPublish()
      } else {
        this.confirmLeave()
      }
    }

    suggestToPublish () {
      this.showLeavePromt = true
    }

    confirmLeave () {
      this.$emit('goHome')
      this.stopAllSources()
      this.showLeavePromt = false
    }

    formatTime (seconds: number) {
      const s = (seconds % 60).toFixed(1)
      const m = Math.floor(seconds / 60)
      return `${m.toString().padStart(2, '0')}:${s.padStart(4, '0')}`
    }

    showingSession () {
      return !(
        this.askForAC ||
        this.showLeavePromt ||
        this.loading ||
        this.publishing !== 'no' ||
        this.renaming ||
        this.editTrackIndex !== null
      )
    }

    handleKeydown ($event: KeyboardEvent) {
      if (this.showingSession()) {
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
      if ($event.key === 'Escape') {
        if (this.showLeavePromt) {
          this.showLeavePromt = false
        }
        if (this.renaming) {
          this.renaming = false
        }
        if (this.editTrackIndex !== null) {
          this.editTrackIndex = null
        }
      }
    }

    togglePlay () {
      if (this.playing) {
        this.stopAllSources()
      } else {
        if (!this.recording) {
          this.playAll()
          this.stopTimeout = setTimeout(
            this.stopAllSources.bind(this),
            this.maxTrackDuration * 1000 + this.playbackDelay * 2
          )
          this.playing = true
        }
      }
    }

    playAll () {
      this.stopAllSources()
      this.tracks.forEach(track => {
        track.source = this.ac.createBufferSource()
        track.source.buffer = track.audioBuffer
        track.panner = this.ac.createStereoPanner()
        track.panner.pan.value = track.panning
        track.gain = this.ac.createGain()
        track.gain.gain.value = track.volume

        track.source
          .connect(track.gain)
          .connect(track.panner)
          .connect(this.ac.destination)
      })

      this.playbackStartTime = this.ac.currentTime + this.playbackDelay
      this.tracks.forEach(track => {
        if (track.source !== undefined) {
          if (track.offset > 0) {
            track.source.start(this.playbackStartTime, track.offset)
          } else {
            track.source.start(this.playbackStartTime - track.offset)
          }
        }
      })

      setTimeout(this.updateTracksCssSize.bind(this))
      this.playtime = 0
      this.playtimeInterval = setInterval(this.updatePlaytime.bind(this), 1000 / 24)
    }

    updatePlaytime () {
      this.playtime = this.ac.currentTime - this.playbackStartTime
      if (this.recording && this.playtime > this.maxTrackDuration) {
        this.maxTrackDuration = this.playtime
      }
    }

    updateTracksCssSize () {
      if (this.$refs.tracksref !== undefined) {
        this.tracksCssSize = (this.$refs.tracksref as HTMLDivElement).clientWidth.toString() + 'px'
      }
    }

    stopAllSources () {
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

    toggleRecord () {
      if (this.mediaRecorder !== undefined) {
        if (this.recording) {
          this.mediaRecorder.stop() // triggers onstop callback
          this.stopAllSources()
          this.recording = false
        } else {
          this.stopAllSources()
          this.recordingChunks = []
          this.playAll()
          this.mediaRecorder.start()
          this.recording = true
          this.dirty = true
        }
      } else {
        console.error('mediaRecorder undefined -> recording not possible')
      }
    }

    pLog (msg: string) {
      this.publishingLog.push(
        new LogEntry(
          'msg',
          msg
        )
      )
    }

    pLogCopyable (cid: string) {
      this.publishingLog.push(
        new LogEntry(
          'copyable',
          cid
        )
      )
    }

    publish () {
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
            const getIpfsNodeIdPromise = ipfsWrapper.getIpfsNodeId()
            const publishTracksPromise = this.publishSession()
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

    logLinks (cid: string, ipfsNodeId: string) {
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
      this.pLog('(click any link to copy)')
    }

    confirmPublishResults () {
      this.publishing = 'no'
    }

    publishTracks () {
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

    publishTrack (track: Track) {
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

    publishSession () {
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

    renameSession () {
      this.renaming = true
      this.$nextTick(() => {
        (this.$refs.newSessionTitle as HTMLInputElement).select()
      })
    }

    updateName () {
      this.title = (this.$refs.newSessionTitle as HTMLInputElement).value
      this.renaming = false
      this.dirty = true
    }

    editTrack (index: number) {
      this.editTrackIndex = index
    }

    changeTrackName (name: string | undefined) {
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

    removeTrack () {
      if (this.editTrackIndex !== null) {
        const trackToBeDeleted = this.tracks[this.editTrackIndex]
        this.editTrackIndex = null
        this.tracks = this.tracks.filter(track => track !== trackToBeDeleted)
        this.maxTrackDuration = this.checkForHigherTrackDuration()
      }
    }

    updateTrackVolume (v: number) {
      if (this.editTrackIndex !== null) {
        const track = this.tracks[this.editTrackIndex]
        track.volume = v
        if (track.gain !== undefined) {
          track.gain.gain.value = v
        }
      }
    }

    updateTrackPanning (v: number) {
      if (this.editTrackIndex !== null) {
        const track = this.tracks[this.editTrackIndex]
        track.panning = v
        if (track.panner !== undefined) {
          track.panner.pan.value = v
        }
      }
    }

    updateTrackOffset (v: number) {
      if (this.editTrackIndex !== null) {
        const track = this.tracks[this.editTrackIndex]
        track.offset = v
        track.effectiveDuration = track.audioBuffer.duration - v
      }
    }

    checkAudioContext () {
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
  }
})


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
  .ud-affiliate {
    display: block;
    text-decoration: none;
    @include clickable-surface;
    color: #4c46f7;
    border: 0.1em solid #4c46f7;
    box-shadow: 0 0 0.5em #4c46f799;
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
