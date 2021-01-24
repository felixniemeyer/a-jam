import IPFSWrapper from "./ipfs-wrapper"
import { Editor, SessionObject } from "./editor/editor"

export default class App {
    ipfsWrapper: IPFSWrapper
    editors: Editor[]
    editorIndex: number = 0
    currentEditor: undefined | number
    el: HTMLElement

    constructor(ipfsWrapper: IPFSWrapper) {
        this.ipfsWrapper = ipfsWrapper
        this.editors = []
        this.el = document.createElement("div")
    }
    loadSession(sessionCid: string) {
        // ipfs cat session 
        let so: SessionObject = {
            name: 'loaded jam session',
            tracks: []
        }
        let editor = new Editor(so)
        this.addEditor(editor)
    }
    createNewSession() {
        let editor = new Editor({
            name: 'my new jam session',
            tracks: []
        })
        this.addEditor(editor)
    }
    addEditor(editor: Editor) {
        this.editors[this.editorIndex] = editor
        if (this.currentEditor !== undefined) {
            this.editors[this.currentEditor].umount()
        }
        this.currentEditor = this.editorIndex
        this.editorIndex += 1
        editor.mount(this.el)
    }
    publishSession() {
        // set timestamp of the session object
        // ipfs add tracks without cid and set cids in the session object
        // ipfs save session 
    }
    welcome() {
        //TODO: show hello and list of recent sessions
    }
    mount(mountPoint: HTMLElement) {
        mountPoint.appendChild(this.el)
    }
    umount() {
        this.el.remove()
    }
}