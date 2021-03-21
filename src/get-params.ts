export class GetParams {
  loadSession: string | undefined
  loadSessionOrigin: string | undefined
  newSession = false

}

export function getGetParams() {
  const gp = new GetParams()
  let tmp = []
  location.search
    .substr(1)
    .split('&')
    .forEach(item => {
      tmp = item.split('=')
      switch (tmp[0]) {
        case 'loadSession':
          gp.loadSession = tmp[1]
          break
        case 'loadSessionOrigin':
          gp.loadSessionOrigin = tmp[1]
          break
        case 'newSession':
          gp.newSession = true
          break
      }
    })
  return gp
}

export const getParams = getGetParams()



