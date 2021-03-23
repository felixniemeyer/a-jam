<template>
  <div class="session">
    <div class="cornerbutton back" @click="$router.go(-1)"></div>
    <div class="title" @click="openSettings()">
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
import TrackSettings from '@/views/Session/TrackSettings.vue'
import Log, { LogEntry } from '@/components/Log.vue'
import Copyable from '@/components/Copyable.vue'
import { Track } from '@/types'

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
      playing: false, 
      localSessionId,
      session: store.state.sessions.local[localSessionId],
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
  mounted () {
    document.addEventListener('keydown', this.handleKeydown)
  },
  beforeUnmount () {
    this.stopAllPlaybacks()
    this.stopRecording()
    document.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    openSettings() {
      this.$router.push(`/session/${this.localSessionId}/settings`)
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
        this.leaveSession()
      }
    }, 
    togglePlay () {
      if (this.playing) {
        this.stopAllPlaybacks()
      } else {
        if (!this.recorder.state.recording) {
          this.playAllTracks()
          this.stopTimeout = setTimeout(
            this.stopAllPlaybacks.bind(this),
            this.maxTrackDuration * 1000 + this.state.settings.playbackDelay
          )
          this.playing = true
        }
      }
    }, 
    playAllTracks () {
      this.stopAllPlaybacks()
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
      this.playtime = 0
      this.playtimeInterval = setInterval(this.updatePlaytime.bind(this), 1000 / 24)
    }, 
    updatePlaytime () {
      this.playtime = this.ac.currentTime - this.playbackStartTime
      if (this.recording && this.playtime > this.maxTrackDuration) {
        this.maxTrackDuration = this.playtime
      }
    }, 
    stopAllPlaybacks () {
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
    }, 
    toggleRecord () {
      if (this.recorder.state.recording.value === true) {
        this.recorder.stop()
        this.stopAllPlaybacks()
      } else {
        if (!this.recorder.initialized) {
          await this.recorder.init()
        }
        this.prepareRecording()
        this.stopAllPlaybacks()
      } 
      if (this.recorder.state.recording.value === true) {
      } else {
        this.playAllTracks()
        this.mediaRecorder.start()
        this.recorder.record(this.createTrackFromRecording)
        this.recording = true
        this.dirty = true
      }
      } else {
        console.error('mediaRecorder undefined -> recording not possible')
      }
    }, 
    createTrackFromRecording(audioBlob: Blob) {
      const fileReader = new FileReader()
      fileReader.onloadend = () => {
        const arrayBuffer = fileReader.result
        if (arrayBuffer instanceof ArrayBuffer) {
          this.ac.decodeAudioData(arrayBuffer).then(
            (audioBuffer) => {
              this.session.tracks.push(new Track(this.state.settings.defaultRecordingOffset, {
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
      fileReader.readAsArrayBuffer(audio)
    },
    pLog (msg: string) {
      this.publishingLog.push(
        new LogEntry(
          'msg',
          msg
        )
      )
    }, 
    pLogCopyable (cid: string) {
      this.publishingLog.push(
        new LogEntry(
          'copyable',
          cid
        )
      )
    }, 
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
    }, 
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
    }, 
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
    }, 
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
    }, 
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
    }, 
    renameSession () {
      this.renaming = true
      this.$nextTick(() => {
        (this.$refs.newSessionTitle as HTMLInputElement).select()
      })
    }, 
    updateName () {
      this.title = (this.$refs.newSessionTitle as HTMLInputElement).value
      this.renaming = false
      this.dirty = true
    }, 
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
