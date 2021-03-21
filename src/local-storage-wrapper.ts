const HIST_LENGTH = 100

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


export const storageWrapper = {
  setDefaultRecordingOffset(v: number) {
    localStorage.setItem('defaultRecordingOffset', v.toString())
  },
  getRecentSessions() {
    const result = []
    /**
     * we traverse from the next_id-1 to the smallest possible id
     * we skip entries that have a cid, that was already encountered
     * we skip and delete all entries after we found HIST_LENGTH entries
     * we set the new smallest possible id to smallest id from the results
     */
    if ('next_history_id' in localStorage) {
      let i = Number(localStorage.getItem('next_history_id'))
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
  },
  addRecentSession (rse: RecentSessionEntry) {
    let i
    if ('next_history_id' in localStorage) {
      i = Number(localStorage.getItem('next_history_id'))
    } else {
      i = 0
    }
    localStorage.setItem('recent_session_' + i, rse.toString())
    localStorage.setItem('next_history_id', (i + 1).toString())
  },
  getSettings() : Settings {
    const settings = {
      defaultRecordingOffset: 65,
    }

    if ('defaultRecordingOffset' in localStorage) {
      settings.defaultRecordingOffset = Number(localStorage.getItem('defaultRecordingOffset'))
    }

    return settings
  }
}

export interface Settings {
  defaultRecordingOffset: number,
  // pinningServices: PinningService[],
}

