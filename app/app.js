class App {
    constructor(params, ipfsWrapper) {
        this.ipfsWrapper = ipfsWrapper
        this.initElement()
    }
    loadSession(sessionCid) {
        this.editor = new Editor()
    }
    createNewSession() {
        this.leaveSession()
        this.editor = new Editor({
            name: "my new jam session", 
            tracks: []
        })
        this.editor.mount(this.el)
    }
    leaveSession() {
        if(this.editor !== undefined) {
            this.clearSession()
            createDialogue(
                "close session?", 
                "all changes of the current session since the last publishing will be lost!", 
                {
                    ok: () => {
                        this.closeSession()
                    }, 
                    cancel: () => {}
                }
            )
        }
    }
    publishSession() {
        // set timestamp of the session object
        // ipfs add tracks without cid and set cids in the session object
        // ipfs save session 
    }
    closeSession() {
        this.editor.umount()
        delete this.editor
    }
    welcome() {
        //TODO: show hello and list of recent sessions
    }
    initElement() {
        this.el = document.createElement("div")
        this.el.className = "app"
    }
    mount(mountPoint) {
        mountPoint.appendChild(this.el)
    }
    umount() {
        this.el.remove() 
    }
}