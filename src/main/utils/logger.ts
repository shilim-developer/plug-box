import c from 'ansi-colors'
import Logger from 'electron-log'

export const logger = {
  tag: {
    success: (tag: string, ...args: any) => {
      console.log(c.green(`[${tag}]`), ...args)
      Logger.log(`[${tag}]`, ...args)
    },
    error: (tag: string, ...args: any) => {
      console.log(c.red(`[${tag}]`), ...args)
      Logger.log(`[${tag}]`, ...args)
    },
    info: (tag: string, ...args: any) => {
      console.log(c.blue(`[${tag}]`), ...args)
      Logger.log(`[${tag}]`, ...args)
    },
    warn: (tag: string, ...args: any) => {
      console.log(c.yellow(`[${tag}]`), ...args)
      Logger.log(`[${tag}]`, ...args)
    }
  },
  text: {
    success: (...args: any) => {
      console.log(
        ...args.map((item: any) =>
          c.green(typeof item === 'object' ? JSON.stringify(item, null, 2) : item)
        )
      )
    },
    error: (...args: any) => {
      console.log(
        ...args.map((item: any) =>
          c.red(typeof item === 'object' ? JSON.stringify(item, null, 2) : item)
        )
      )
    },
    info: (...args: any) => {
      console.log(
        ...args.map((item: any) =>
          c.blue(typeof item === 'object' ? JSON.stringify(item, null, 2) : item)
        )
      )
    },
    warn: (...args: any) => {
      console.log(
        ...args.map((item: any) =>
          c.yellow(typeof item === 'object' ? JSON.stringify(item, null, 2) : item)
        )
      )
    }
  },
  success: (...args: any) => {
    console.log(c.green('[sucess]'), ...args)
  },
  error: (...args: any) => {
    console.log(c.red('[error]'), ...args)
  },
  info: (...args: any) => {
    console.log(c.blue('[info]'), ...args)
  },
  warn: (...args: any) => {
    console.log(c.yellow('[warn]'), ...args)
  }
}
