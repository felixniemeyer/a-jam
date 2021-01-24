class TrackList {
    constructor(tracks) {
        this.createElement(tracks) 
    }
    createElement(tracks) {
        this.el = document.createElement("div")
        this.el.className = 'track-list'
        this.el.textContent = 'track-list'

        this.tracks = {}
        tracks.forEach(track => {
            let t = new Track(track, {
                removeTrack: () => {} 
            })
            t.mount
        });
    }
    addTrack() {
        
    }
    removeTrack(id) {

    }
    mount(mountPoint) {
        mountPoint.appendChild(this.el)
    }
    umount() {
        
    }
}