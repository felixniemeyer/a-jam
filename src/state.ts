import { reactive } from 'vue'
import { RecentSessionEntry, Settings } from './local-storage-wrapper'
import { LocalSession, PublicSession, Recording } from './types'

export interface State {
  sessions: {
    recent: RecentSessionEntry[];
    public: {[cid: string]: PublicSession};
    local: {[localId: number]: LocalSession};
    nextLocalSessionId: number;
  };
  recordings: {[cid: string]: Recording};
  settings: Settings;
}

export const state = reactive({
  sessions: {
    recent: [],
    public: {},
    local: {},
    nextLocalSessionId: 0
  },
  recordings: {},
  settings: {
    defaultRecordingOffset: 0,
    playbackDelay: 50
  }
} as State)
