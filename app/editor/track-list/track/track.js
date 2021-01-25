class Track {
    constructor(track) {
        this.track = track
        this.createElement()
    }
    createElement() {
        this.el = document.createElement('div')
        this.el.className = 'track'
        this.el.textContent = this.track.name
    }
    mount(mountPoint) {
        mountPoint.append(this.el)
    }
}