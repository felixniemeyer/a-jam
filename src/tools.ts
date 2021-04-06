export function debug (...args: any[]) { // eslint-disable-line
  if (process.env.NODE_ENV === 'development') {
    console.log(args)
  }
}
