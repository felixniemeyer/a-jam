class BeepDetector extends AudioWorkletProcessor {
  freqPerMs = []
  samplesSinceLastMs = 0
  samplesPerMs = sampleRate / 1000

  above = true
  distance = 0

  recentZeroCrossingDistances = {
    pushStack: [],
    popStack: [] // initialized in constructor
  }

  avgOver = 3
  avg = 100

  zeroline = 0
  zerolineDrag = 0

  constructor () {
    super()

    for (let i = 0; i < this.avgOver; i++) {
      this.recentZeroCrossingDistances.popStack.push(this.avg)
    }

    this.port.onmessage = event => {
      this.port.postMessage(this.freqPerMs)
    }
  }

  handleZeroCrossing () {
    const rzcd = this.recentZeroCrossingDistances
    rzcd.pushStack.push(this.distance)
    const subtract = rzcd.popStack.pop()

    if (rzcd.popStack.length == 0) {
      if (rzcd.pushStack.length !== this.avgOver) {
        console.error('avgOver !== pushStack.length, error')
      }
      let d; let sum = 0
      while (rzcd.pushStack.length > 0) {
        d = rzcd.pushStack.pop()
        sum += d
        rzcd.popStack.push(d)
      }
      this.avg = sum / this.avgOver
    } else {
      this.avg += (this.distance - subtract) / this.avgOver
    }
    this.distance = 0
  }

  process (inputs, _outputs, _parameters) {
    const device = inputs[0]
    if (device && device.length > 0) {
      const channel = device[0]
      if (channel && channel.length > 0) {
        for (const sample of channel) {
          this.distance += 1
          if (this.above ^ (sample > this.zeroline)) {
            this.above = !this.above
            this.handleZeroCrossing()
          }
          this.samplesSinceLastMs += 1
          if (this.samplesSinceLastMs > this.samplesPerMs) {
            this.samplesSinceLastMs -= this.samplesPerMs
            const freq = sampleRate / this.avg / 2
            this.freqPerMs.push(freq)
            // console.log("freq around 1000?", freq > 990 && freq < 1010)
          }
          this.zeroline = this.zeroline * (1 - this.zerolineDrag) + this.zerolineDrag * sample
        }
      }
    }
    return true
  }
}

registerProcessor('beep-detector', BeepDetector)
