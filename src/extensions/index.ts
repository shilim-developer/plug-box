import { MessagePortMain } from 'electron'
class ExtensionHostProcess {
  private _connection: NodeJS.Process
  //   private _extensionHostMain: ExtensionHostMain
  private port: MessagePortMain

  async start(): Promise<void> {
    try {
      // 建立与主进程的IPC连接
      this._connection = this.createIPCCconnection()

      //   // 初始化Extension Host主逻辑
      //   this._extensionHostMain = new ExtensionHostMain(this._connection, process.argv)

      //   await this._extensionHostMain.start()

      console.log('Extension Host Process started successfully')
    } catch (error) {
      console.error('Failed to start Extension Host:', error)
      process.exit(1)
    }
  }

  private createIPCCconnection() {
    process.once('message', (message) => {
      console.log('message:', message[0].postMessage)
      this.port = (message as any)[0]
      message[0].postMessage({ type: 'ready' })
    })
    return process
  }
}

// 启动进程
new ExtensionHostProcess().start()
