<template>
  <div class="offsetCalibration">
    <h1>{{ calibrating ? "Calibrating..." : "Recording offset calibration" }}</h1>
    <div v-if="cancel || !calibrating" class="button" @click="startCalibration">
      {{ done || cancel ? "re-calibrate" : "calibrate" }}
    </div>
    <div v-else class="button" @click="cancel=true">cancel</div>
    <div v-if="results.length > 0" class="results">
      <div class="result" v-for="(result, key) in results" :key="key">
        <p> Frequency: {{ result.freq }} </p>
        <p> Offset: {{ Math.floor(1000 * result.delta) }} </p>
      </div>
      <div v-if="cancel" class="result cancel">
        cancelled
      </div>
    </div>
    <div v-if="done" class="donearea">
      <div v-if="success">
        Calibration done.<br/>
        The average over non-outlying measurements is {{Math.floor(1000 * recommendation)}}ms.<br/>
        Default offset has been updated.
      </div>
      <div v-else>
        Calibration failed.
        Try again in a more silent environment.
      </div>
    </div>
    <div v-if="!calibrating || cancel" class="button" @click="leave">leave</div>
  </div>
</template>

<script lang="ts">
import { debug } from '@/tools'
import { defineComponent } from 'vue'

interface Result {
  freq: number;
  delta: number;
}

export default defineComponent({
  data () {
    return {
      results: [] as Result[],
      calibration: false,
      done: false,
      success: false,
      recommendation: 0,
      calibrating: false,
      cancel: false
    }
  },
  props: {
    beeps: {
      type: Number,
      default: 7
    },
    beepDuration: {
      type: Number,
      default: 0.3
    }
  },
  methods: {
    leave () {
      this.$router.go(-1)
    },
    startCalibration () {
      this.done = false
      this.cancel = false
      this.calibrating = true
      this.success = false
      this.results = []
      this.calibrate()
    },
    summarize () {
      let startSum = 0
      for (const result of this.results) {
        startSum += result.delta
      }
      const startAvg = startSum / this.results.length

      let inliersCount = 0
      let inliersSum = 0
      for (const result of this.results) {
        if (result.delta > startAvg - 0.1 && result.delta < startAvg + 0.1) {
          inliersSum += result.delta
          inliersCount += 1
        }
      }

      if (inliersCount > this.results.length / 2) {
        this.recommendation = inliersSum / inliersCount
        this.state.settings.defaultRecordingOffset = this.recommendation
        this.storageWrapper.setDefaultRecordingOffset(this.recommendation)
        if (this.state.settings.initialCalibration === false) {
          this.storageWrapper.setInitialCalibration(true)
          this.state.settings.initialCalibration = true
        }
        this.success = true
      }
      this.done = true
      this.calibrating = false
    },
    async calibrate () {
      await this.ac.resume()

      const stream = await this.initUserMedia()
      const mediaRecorder = new MediaRecorder(stream)

      let delay = 1
      const safety = 1

      for (let i = 0; i < this.beeps; i++) {
        const freq = 1000 + i * 200

        // record
        const source = this.ac.createOscillator()
        source.connect(this.ac.destination)
        const now = this.ac.currentTime
        source.frequency.setValueAtTime(freq, now)
        source.start(now + delay)
        source.stop(now + delay + this.beepDuration)
        const audioBlob = await this.recordInterval(mediaRecorder, delay + this.beepDuration + safety)
        const audioBuffer = await this.toAudioBuffer(audioBlob)
        source.disconnect()

        // measure
        const sampleRate = this.ac.sampleRate
        const oac = new OfflineAudioContext(1, sampleRate * 2, sampleRate)
        await oac.audioWorklet.addModule('beep-detector.js', {
          credentials: 'omit'
        })
        const beepDetector = new AudioWorkletNode(oac, 'beep-detector')
        const playbackNode = oac.createBufferSource()
        playbackNode.buffer = audioBuffer
        playbackNode.connect(beepDetector)
        playbackNode.start(0)

        const measurementPromise = new Promise<number[]>((resolve, reject) => {
          beepDetector.port.onmessage = event => { resolve(event.data) }
          setTimeout(reject, 2000)
        })

        await oac.startRendering()
        beepDetector.port.postMessage('')
        const measurement = await measurementPromise

        debug('m', freq, measurement)

        const result = this.evaluate(
          measurement,
          freq
        )

        const start = result.index / 1000
        const delta = result.index / 1000 - delay
        delay = Math.max(start, (delay + (delay - start))) / 2 + 0.1

        this.results.push({ freq, delta })

        if (this.cancel) {
          this.calibrating = false
          return
        }
      }
      this.summarize()
    },
    async initUserMedia () {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const constraints = {
          audio: {
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
    recordInterval (mediaRecorder: MediaRecorder, duration: number): Promise<Blob> {
      return new Promise<Blob>((resolve, reject) => {
        const chunks: Blob[] = []
        mediaRecorder.ondataavailable = event => {
          chunks.push(event.data)
        }
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, {
            type: 'audio/ogg; codecs=opus'
          })
          resolve(blob)
        }
        mediaRecorder.onerror = reject
        mediaRecorder.start()
        setTimeout(() => { mediaRecorder.stop() }, duration * 1000)
      })
    },
    toAudioBuffer (blob: Blob): Promise<AudioBuffer> {
      return new Promise<AudioBuffer>((resolve, reject) => {
        const fileReader = new FileReader()
        fileReader.onloadend = () => {
          const arrayBuffer = fileReader.result
          if (arrayBuffer instanceof ArrayBuffer) {
            this.ac.decodeAudioData(arrayBuffer).then(
              (audioBuffer) => {
                resolve(audioBuffer)
              },
              (err) => {
                reject(new Error(`failed to decode audio blob: ${err}`))
              }
            )
          } else {
            reject(new Error('arrayBuffer is not an ArrayBuffer'))
          }
        }
        fileReader.readAsArrayBuffer(blob)
      })
    },
    evaluate (freqs: number[], freq: number) {
      const squares = freqs.map((f: number) => Math.pow(f - freq, 2))

      const length = Math.floor(this.beepDuration * 1000)
      let bestIndex = 0
      let value = 0
      for (let i = 0; i < length; i++) {
        value += squares[i]
      }
      let leastSum = value
      let index = 1
      while (index + length < freqs.length) {
        value += squares[index + length]
        value -= squares[index - 1]
        if (value < leastSum) {
          leastSum = value
          bestIndex = index
        }
        index += 1
      }
      return {
        index: bestIndex,
        coverage: leastSum
      }
    }
  }
})
</script>

<style lang="scss">
.offsetCalibration{
  .result {
    margin: 0.3em;
    display: inline-block;
    background-color: darken($brown, 20%);
    border-radius: 0.3em;
    padding: 0.3em;
    p {
      margin: 0.3em;
    }
    &.cancel {
      background-color: darken($danger, 20%);
    }
  }
  .button {
    @include clickable-surface;
    display: inline-block;
  }
}
</style>
