<template>
  <div class="fromFileImporter">
    <h1> import recording from file</h1>
    <input ref="file" type="file" multiple="multiple">

    <p v-if="this.error" class="error"> {{error}} </p>
    <div>
      <div class="button" @click="goBack">
        cancel
      </div>
      <div class="button" @click="importRecordings">
        import
      </div>
      <div class="spacer"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Track } from '@/types'
import { defineComponent } from 'vue'

export default defineComponent({
  data () {
    return {
      error: undefined as undefined | string,
      localId: Number(this.$route.params.localId)
    }
  },
  methods: {
    handleKeydown ($event: KeyboardEvent) {
      if ($event.key === 'Escape') {
        this.goBack()
      }
    },
    goBack () {
      this.$router.go(-1)
    },
    importRecordings () {
      this.error = undefined
      const files = (this.$refs.file as HTMLInputElement).files
      if (files === undefined || files === null || files.length === 0) {
        this.error = 'no files selected'
      } else {
        const promises: Array<Promise<Track>> = []
        Array.from(files).forEach(file => {
          promises.push(
            this.importRecording(file)
          )
        })
        Promise.all(promises).then(
          importedTracks => {
            importedTracks.forEach(track => {
              this.state.sessions.local[this.localId].tracks.push(track)
            })
            this.goBack()
          },
          () => {
            this.error += "Make sure the selected file is an audio file. Browsers have limited support for codecs. You may want to recode it to some other format."
          }
        )
      }
    },
    async importRecording (file: File) : Promise<Track> {
      console.log('importing file', file)
      const arrayBuffer = await file.arrayBuffer()
      const audioContext = new AudioContext()
      try {
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        const recording = {
          cid: undefined,
          audioBuffer,
          audioBlob: file
        }

        return Track.fromRecording(
          recording,
          file.name
        )
      } catch(e) {
        this.error = `Could not import ${file.name}: ${e} `
        throw(new Error('could not load track from file'))
      }
    }
  }
})

</script>

<style lang="scss">

.fromFileImporter{
  .button {
    @include clickable-surface;
    display: inline-block;
  }
  .spacer {
    width: 1em;
    height: 5em;
  }
  .error {
    color: $danger;
  }
  input {
    padding: 1em;
  }
}

</style>
