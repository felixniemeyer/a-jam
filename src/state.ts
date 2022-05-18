import { RecentSessionEntry, Settings } from './local-storage-wrapper'
import { LocalSession, PublicSession, Recording } from './types'

export interface State {
  sessions: {
    recent: RecentSessionEntry[];
    public: {[hash: string]: PublicSession};
    local: {[localId: number]: LocalSession};
    nextLocalSessionId: number;
  };
  recordings: {[hash: string]: Recording};
  settings: Settings;
}
