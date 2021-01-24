class Editor {
    constructor(sessionObject) {
        this.so = sessionObject
        this.initElement()
        this.initWebAudio()
        this.initUserMedia()
    }
    initWebAudio() {
        AudioContext = window.AudioContext || window.webkitAudioContext
        this.em = document.createDocumentFragment()

        this.state = 'inactive'

        this.chunks = []
        this.chunkType = ''

        this.encoderMimeType = 'audio/wav'

        this.config = {
            manualEncoderId: 'wav',
            micGain: 1.0,
            processorBufferSize: 2048,
            stopTracksAndCloseCtxWhenFinished: true,
            usingMediaRecorder: typeof window.MediaRecorder !== 'undefined',
            //userMediaConstraints: { audio: true }
            userMediaConstraints: { audio: { echoCancellation: false } }
        }
    }
    initUserMedia() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            console.log('getUserMedia supported.')
            navigator.mediaDevices.getUserMedia(
                {
                    audio: true
                })
                .then(function (stream) {
                    const mediaRecorder = new MediaRecorder(stream)
                    this.initRecorder(
                        () => {
                            mediaRecorder.start()
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