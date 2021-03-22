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
import TrackSettings from '@/views/TrackSettings.vue'
import Log, { LogEntry } from '@/components/Log.vue'
import Copyable from '@/components/Copyable.vue'

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
      localSessionId,
      session: store.state.sessions.local[localSessionId],
      // move to vuex
      dirty: false, // let's see how to implement this concept in vuex
        // playback and recording
      playtime: 0,
    }

  },
  computed: {
    title() {
      return session.title
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
  openSettings() {
    this.$router.push(`/session/${this.localSessionId}/settings`)
  },
  publish() {

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
