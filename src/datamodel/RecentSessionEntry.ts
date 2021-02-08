export default class RecentSessionEntry {
  constructor(
    public createdByMe: boolean,
    public cid: string,
    public title: string,
    public timestamp = Date.now()
  ) {

  }

  static fromString(jsonString: string) {
    const o = JSON.parse(jsonString)
    return new RecentSessionEntry(
      o.m, o.c, o.t, o.d
    )
  }

  static getHistory() {
    const result = []

    if ('next_history_id' in localStorage) {
      let i = Number(localStorage.getItem('next_history_id')) - 1
      let found = 0
      let key: string
      const cids: {[key: string]: boolean} = {}
      while ((key = 'recent_session_' + i) in localStorage) {
        if (found > 100) {
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
              result.push(rse)
            }
          }
        }
        i -= 1
      }
    }
    return result
  }

  static append(rse: RecentSessionEntry) {
    let i
    if ('next_history_id' in localStorage) {
      i = Number(localStorage.getItem('next_history_id'))
    } else {
      i = 0
    }
    localStorage.setItem('recent_session_' + i, rse.toString())
    localStorage.setItem('next_history_id', String(i + 1))
  }

  toString() {
    return JSON.stringify({
      m: this.createdByMe,
      c: this.cid,
      t: this.title,
      d: this.timestamp
    })
  }
}
