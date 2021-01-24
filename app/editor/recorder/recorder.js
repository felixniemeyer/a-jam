class Recorder {
    constructor(callbacks) {
        this.initElement()
        this.callbacks = callbacks
        this.recording = false
    }
    initElement() {
        this.el = document.createElement("div")
        this.el.className = 'recorder'
        this.el.textContent = 'recorder'
        
        let rb_el = document.createElement("div")
        rb_el.className = 'record-button'
        rb_el.addEventListener("click", this.recordButtonPressed.bind(this))
        
        this.el.append(rb_el)
    }
    recordButtonPressed() {
        if(this.recording) {
            this.callbacks.stopRecording()
            this.recording = false
        } else {
            this.callbacks.startRecording()
            this.recording = true
        }
    }
    mount(mountPoint) {
        mountPoint.appendChild(this.el)
    }

}