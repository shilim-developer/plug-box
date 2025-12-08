import { spawn } from 'child_process'

export class SpawnUtil {
  static async exec(command: string, args = [], options = { timeout: 0 }) {
    const { timeout, ...spawnOptions } = options
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, spawnOptions)
      let timeoutTimer: NodeJS.Timeout

      // 超时处理
      if (timeout > 0) {
        timeoutTimer = setTimeout(() => {
          child.kill()
          reject(new Error(`Command timeout (${timeout}ms)`))
        }, timeout)
      }

      // 正常退出
      child.on('close', (code) => {
        clearTimeout(timeoutTimer)
        code === 0 ? resolve(code) : reject(new Error(`Exit code ${code}`))
      })

      child.on('error', (err) => {
        clearTimeout(timeoutTimer)
        reject(err)
      })
    })
  }
}
