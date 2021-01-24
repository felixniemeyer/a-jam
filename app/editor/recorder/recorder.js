class Recorder {
    constructor(callbacks) {
        this.initElement()
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
        tools.createDialogue("Recording!", '')
    }
    mount(mountPoint) {
        mountPoint.appendChild(this.el)
    }

}