export function debug (...args: any[]) { // eslint-disable-line
  if (process.env.NODE_ENV === 'development') {
    console.log('DEBUG:', ...args)
  }
}
export async function sleep (s: number) {
  return new Promise((resolve, reject) => { // eslint-disable-line
    setTimeout(resolve, s)
  })
}
