export const isDev = process.env.NODE_ENV === 'development'

export function debug (...args: any[]) { // eslint-disable-line
  if (isDev) {
    console.log('DEBUG:', ...args)
  }
}

export async function sleep (s: number) : Promise<void> {
  return new Promise((resolve) => { // eslint-disable-line
    setTimeout(resolve, s)
  })
}
