<template>
  <div class="fromFileImporter">
    <h1> import recording from file</h1>
    <input ref="file" type="file" @change="updateFileList"/>

    <div v-if="fileList !== undefined">
      <p> Selected files: </p>
      <ul>
        <li v-for="file, key in Array.from(fileList)" :key="key">
          {{ file.name }}
        </li>
      </ul>
    </div>

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
      fileList: undefined as undefined | FileList,
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
    updateFileList () {
      const inputEl = this.$refs.file as HTMLInputElement
      if (inputEl.files !== null) {
        this.fileList = inputEl.files
      }
    },
    importRecordings () {
      if(this.fileList === undefined || this.fileList.length === 0) {
        this.error = "no files selected"
      } else {
        const promises :Array<Promise<void>> = []
        Array.from(this.fileList).forEach(file => {
          promises.push(
            this.importRecording(file)
          )
        })
        Promise.all(promises).then(() => {
          this.goBack()
        })
      }
    },
    async importRecording (file: File) {
      console.log('importing file', file)
      const arrayBuffer = await file.arrayBuffer()
      const audioContext = new AudioContext()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      const recording = {
        cid: undefined,
        audioBuffer,
        audioBlob: undefined
      }

      const track = Track.fromRecording(
        recording,
        file.name
      )
      this.state.sessions.local[this.localId].tracks.push(track)
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
  input {
    padding: 1em;
  }
}

</style>
