class Editor {
    constructor (callbacks, sessionCid = undefined) {
        this.initElement()
    }
    initSession() {
        this.setName('my new session')
        this.setTracks([])
    }
    setName(name){
        this.session.name = name
        this.element.name.el.textContent = name
    }
    setTracks(newTracks){
    }
    addTrack(){
    }
    removeTrack(){
    }
    loadSession() {
    }
    initElement() {
        this.element = {}
        this.element.el = document.createElement("div")
        this.element.el.className = "editor"
        this.element.name = {}
        this.element.name.el = document.createElement("div")
        this.element.name.el.className = "name"
        this.element.el.appendChild(this.element.name.el)
    }
    mount(mountPoint) {
        mountPoint.appendChild(this.element)
    }
    umount() {
        this.element.remove
    }
}