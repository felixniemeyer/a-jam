class Recorder {
    constructor(callbacks) {
        this.initElement()
        this.callbacks = callbacks
        this.recording = false
    }
    initElement() {
        this.el = document.createElement("div")
        this.el.className = 'recorder'
        
        this.rb_el = document.createElement("div")
        this.rb_el.className = 'record-button'
        this.rb_el.addEventListener("click", this.recordButtonPressed.bind(this))
        
        this.el.append(this.rb_el)
    }
    recordButtonPressed() {
        if(this.recording) {
            this.callbacks.stopRecording()
            this.recording = false
            this.rb_el.classList.remove("recording")
        } else {
            this.callbacks.startRecording()
            this.recording = true
            this.rb_el.classList.add("recording")
        }
    }
    mount(mountPoint) {
        mountPoint.appendChild(this.el)
    }

}