import { debug } from './tools'

const HIST_LENGTH = 100

export interface Settings {
  defaultRecordingOffset: number;
  playbackDelay: number;
  micDeviceId: string | undefined;
}

export class RecentSessionEntry {
  constructor (
    public cid: string,
    public title: string,
    public timestamp = Date.now()
  ) {

  }

  static fromString (jsonString: string) {
    const o = JSON.parse(jsonString)
    return new RecentSessionEntry(
      o.c, o.t, o.d
    )
  }

  toString () {
    return JSON.stringify({
      c: this.cid,
      t: this.title,
      d: this.timestamp
    })
  }
}

export interface StorageWrapper {
  setDefaultRecordingOffset (v: number): void;
  setPlaybackDelay (v: number): void;
  setMicDeviceId (micId: string): void;
  getRecentSessions (): RecentSessionEntry[];
  addRecentSession (rse: RecentSessionEntry, list: RecentSessionEntry[]): RecentSessionEntry[];
  getSettings (): Settings;
}

export class LocalStorageWrapper implements StorageWrapper {
  setPlaybackDelay (v: number): void {
    localStorage.setItem('playbackDelay', v.toString())
  }

  setMicDeviceId (micId: string): void {
    localStorage.setItem('micDeviceId', micId)
  }

  setDefaultRecordingOffset (v: number) {
    localStorage.setItem('defaultRecordingOffset', v.toString())
  }

  getRecentSessions (): RecentSessionEntry[] {
    const result = [] as RecentSessionEntry[]
    /**
     * we traverse from the next_id-1 to the smallest possible id
     * we skip entries that have a cid, that was already encountered
     * we skip and delete all entries after we found HIST_LENGTH entries
     * we set the new smallest possible id to smallest id from the results
     */
    if ('next_history_id' in localStorage) {
      let i = Number(localStorage.getItem('next_history_id'))
      debug('next_history_id = ' + i)
      const smallestId = Number(localStorage.getItem('smallest_history_id')) | 0
      let found = 0
      let newSmallestId = smallestId
      let key: string
      const cids: {[key: string]: boolean} = {}
      while (i > smallestId) {
        i -= 1
        if ((key = 'recent_session_' + i) in localStorage) {
          if (found >= HIST_LENGTH) {
            localStorage.removeItem(key)
          } else {
            const rseString = localStorage.getItem(key)
            debug('rse string = ' + rseString)
            if (rseString !== null) {
              const rse = RecentSessionEntry.fromString(rseString)
              if (rse.cid in cids) {
                localStorage.removeItem(key)
              } else {
                cids[rse.cid] = true
                found++
                newSmallestId = i
                result.push(rse)
              }
            }
          }
        }
      }
      localStorage.setItem('smallest_history_id', newSmallestId.toString())
    }
    return result
  }

  addRecentSession (rse: RecentSessionEntry, list: RecentSessionEntry[]) {
    let i
    if ('next_history_id' in localStorage) {
      i = Number(localStorage.getItem('next_history_id'))
    } else {
      i = 0
    }
    localStorage.setItem('recent_session_' + i, rse.toString())
    localStorage.setItem('next_history_id', (i + 1).toString())
    if (list !== undefined) {
      const deduplicated = list.filter(e => e.cid !== rse.cid)
      return [rse].concat(deduplicated)
    } else {
      return [rse]
    }
  }

  getSettings () {
    const settings = {
      defaultRecordingOffset: 0.065,
      playbackDelay: 0.010,
      micDeviceId: undefined
    }
    if ('playbackDelay' in localStorage) {
      settings.playbackDelay = Number(localStorage.getItem('playbackDelay'))
    }
    if ('defaultRecordingOffset' in localStorage) {
      settings.defaultRecordingOffset = Number(localStorage.getItem('defaultRecordingOffset'))
    }
    if ('micDeviceId' in localStorage) {
      settings.defaultRecordingOffset = Number(localStorage.getItem('micDeviceId'))
    }
    return settings
  }
}
