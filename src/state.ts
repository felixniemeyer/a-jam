import { RecentSessionEntry, Settings } from './local-storage-wrapper'
import { LocalSession, Process, PublicSession, Recording } from './types'

export interface State {
  sessions: {
    recent: RecentSessionEntry[],
    public: {[cid: string]: PublicSession},
    local: {[localId: number]: LocalSession},
    nextLocalSessionId: number
    loadingProcesses: {[cid: string]: Process}
    publishingProcesses: {[localId: number]: Process}
  }
  recordings: {[cid: string]: Recording}
  settings: Settings
}

export const state = {
  sessions: {
    recent: [],
    public: {}, 
    local: {}, 
    nextLocalSessionId: 0, 
    loadingProcesses: {}, 
    publishingProcesses: {}
  }, 
  recordings: {}, 
  settings: {
    defaultRecordingOffset: 0, 
    playbackDelay: 50
  }, 
} as State