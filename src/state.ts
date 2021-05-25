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
