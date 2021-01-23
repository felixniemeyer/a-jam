class Ui {
    constructor(ipfsWrapper) {
        this.ipfsWrapper = ipfsWrapper
        this.initElement()
    }
    loadSession(sessionCid) {
        // ipfs cat session 
        
        this.editor = new Editor()
    }
    createNewSession() {
        session = Object.assign({}, Editor.blankSession)
        if(this.editor !== undefined) {
            this.clearSession()
        }
        this.editor = new Editor(Editor.blankSession)
        this.editor.mount(this.element)
    }
    clearSession() {
        // ask: "all changes of the current session since the last publishing will be lost"
        this.closeSession()
    }
    publishSession() {
        // set timestamp of the session object
        // ipfs add tracks without cid and set cids in the session object
        // ipfs save session 
    }
    closeSession() {
        this.session.umount()
        delete this.session
    }
    welcome() {
        //TODO: show hello and list of recent sessions
    }
    initElement() {
        this.element = document.createElement("div")
        this.element.className = "ui"
    }
    mount(mountPoint) {
        mountPoint.appendChild(this.element)
    }
    umount() {
        this.element.remove() 
    }
}