class Editor {
    constructor(sessionObject) {
        this.so = sessionObject
        this.initElement()
        this.initWebAudio()
        this.initUserMedia()
    }
    initWebAudio() {
        AudioContext = window.AudioContext || window.webkitAudioContext
        this.ac = new AudioContext()
    }
    initUserMedia() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            let chunks = []
            navigator.mediaDevices.getUserMedia(
                {
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false
                    }
                })
                .then((stream) => {
                    const mediaRecorder = new MediaRecorder(stream)
                    mediaRecorder.ondataavailable = (e) => {
                        chunks.push(e.data)
                        console.log("bla")
                    }
                    mediaRecorder.onstop = () => {
                        let audio = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' })
                        let fileReader = new FileReader()
                        let arrayBuffer
                        fileReader.onloadend = () => {
                            arrayBuffer = fileReader.result
                            console.log(arrayBuffer)
                            let source = this.ac.createBufferSource()
                            this.ac.decodeAudioData(arrayBuffer).then(
                                audioBuffer => {
                                    console.log(audioBuffer)
                                    source.buffer = audioBuffer
                                    source.connect(this.ac.destination)
                                    source.start(0)

                                    let o = this.ac.createOscillator()
                                    o.type = "sine"
                                    o.connect(this.ac.destination)
                                    o.frequency.value = 440
                                    o.start()
                                    
                                    setTimeout(() => {o.stop()}, 1000)
                                },
                                err => {
                                    console.error("failed to decode audio data:", err)
                                }
                            )
                        }
                        fileReader.readAsArrayBuffer(audio)
                        console.log("stopped recording")
                    }
                    this.initRecorder(
                        () => {
                            mediaRecorder.start()
                            chunks = []
                        },
                        () => {
                            mediaRecorder.stop()
                        }
                    )

                })
                .catch(function (err) {
                    console.log('The following getUserMedia error occurred: ' + err)
                }
                );
        } else {
            console.log('getUserMedia not supported on your browser!')
        }
    }
    setName(name) {
        this.so.name = name
        this.element.name.el.textContent = name
    }
    setTracks(newTracks) {
    }
    addTrack() {
    }
    removeTrack() {
    }
    loadSession() {
    }
    initElement() {
        this.el = document.createElement("div")
        this.el.className = "editor"
        this.el.textContent = "editor"
        this.name_el = document.createElement("div")
        this.name_el.className = 'name'
        this.name_el.textContent = this.so.name
        this.el.appendChild(this.name_el)

        this.trackList = new TrackList(this.so.tracks)
        this.trackList.mount(this.el)

    }
    initRecorder(startRecording, stopRecording) {
        this.recorder = new Recorder({
            startRecording,
            stopRecording
        })
        this.recorder.mount(this.el)
    }
    mount(mountPoint) {
        mountPoint.appendChild(this.el)
    }
    umount() {
        this.el.remove()
    }
}