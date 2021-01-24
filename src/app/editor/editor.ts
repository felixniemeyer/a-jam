import { Track, TrackObject } from './track/track'
import { Recorder } from './recorder/recorder'

export type SessionObject = {
    name: string,
    tracks: TrackObject[]
}

export type Element = {
    el: HTMLElement,
    children: {
        [key: string]: Element
    }
}

export class Editor {
    so: SessionObject
    element: Element
    recorder: Recorder
    constructor(so: SessionObject) {
        this.so = so

        this.element = {
            el: document.createElement("div"),
            children: {}
        }
        this.initElement()

        this.recorder = new Recorder()
    }
    initSession() {
        this.setName('my new session')
        this.setTracks([])
    }
    setName(name: string) {
        this.so.name = name
        this.element.children.name.el.textContent = name
    }
    setTracks(tracks: TrackObject[]) {
    }
    addTrack() {
    }
    removeTrack() {
    }
    loadSession() {
    }
    initElement() {
        this.element.el.className = "editor"
        this.element.children.name = {
            el: document.createElement("div"),
            children: {}
        }
        this.element.children.name.el.className = "name"
        this.element.children.name
        this.element.el.appendChild(this.element.children.name.el)
    }
    mount(mountPoint: HTMLElement) {
        mountPoint.appendChild(this.element.el)
    }
    umount() {
        this.element.el.remove()
    }
}