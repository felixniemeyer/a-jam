class Editor {
    constructor(sessionObject) {
        this.so = sessionObject
        this.sources = []
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
                            this.ac.decodeAudioData(arrayBuffer).then(
                                audioBuffer => {
                                    console.log(audioBuffer)
                                    this.trackList.addTrack({
                                        name: 'new recording',
                                        audioBuffer,
                                        volume: 1.0,
                                        offset: 0,
                                    })
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
        console.log("setting name to", name) 
        this.so.name = name
        this.name_el.textContent = name
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
        
        let headline_el = document.createElement("div")
        headline_el.className = "headline"

        this.name_el = document.createElement("div")
        this.name_el.className = 'name'
        this.name_el.textContent = this.so.name
        this.name_el.spellcheck = false
        this.name_el.setAttribute('contenteditable', true)
        this.name_el.addEventListener('blur', () => {
            this.setName(this.name_el.textContent)
        })
        
        let publish_el = document.createElement("div")
        publish_el.className = 'publish-button'

        headline_el.append(this.name_el, publish_el)
        
        this.el.appendChild(headline_el)

        this.play_el = document.createElement("div")
        this.play_el.className = "play"
        this.play_el.addEventListener('click', this.playAll.bind(this)) 
        this.el.appendChild(this.play_el)

        this.trackList = new TrackList(this.so.tracks)
        this.trackList.mount(this.el)

    }
    playAll() {
        this.stopAll() 
        console.log("playing back")
        let now = this.ac.currentTime + 0.1
        this.so.tracks.forEach(track => {
            console.log("track..")
            let source = this.ac.createBufferSource()
            source.buffer = track.audioBuffer
            source.connect(this.ac.destination)
            source.start(now)
            this.sources.push(source)
        })
    }
    stopAll() {
        this.sources.forEach(source => {
            source.stop()
        })
        this.sources = []
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