class TrackList {
    constructor(tracks) {
        this.tracks = tracks
        this.createElement(tracks) 
    }
    createElement(tracks) {
        this.el = document.createElement("div")
        this.el.className = 'track-list'

        this.tracks.forEach(this.addTrackElement.bind(this))
    }
    addTrack(track) {
        if(track.cid == undefined){
            track.localId = this.nextLocalId
            this.nextLocalId += 1
        }
        this.tracks.push(track)
        this.addTrackElement(track)
    }
    addTrackElement(track) {
        let t = new Track(track)
        t.mount(this.el)
    }
    removeTrack(id) {

    }
    mount(mountPoint) {
        mountPoint.appendChild(this.el)
    }
    umount() {
        
    }
}