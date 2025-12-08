import { MainIpc } from './../../ipc/main-ipc'
import { inject, injectable } from 'inversify'
import TrpcService from '../trpc/trpc.service'
import WindowService from '../window/window.service'
import { WebContentsView, screen } from 'electron'
import { join } from 'path'
import { ChildProcess, fork } from 'child_process'
import extensions from '../../extensions/index?modulePath'
import { createIpcTrpcClient } from '../../extensions/trpc/trpc-client'
import { TRPCClient } from '@trpc/client'
import { AppRouter } from '../../extensions/trpc/router'

@injectable()
export default class PluginService {
  subWindow!: WebContentsView
  trpcClient!: TRPCClient<AppRouter>
  mainIpc = new MainIpc()
  extensionHost!: ChildProcess

  constructor(
    @inject(TrpcService) private readonly trpcService: TrpcService,
    @inject(WindowService) private readonly windowService: WindowService
  ) {}

  startPluginProgress() {
    try {
      this.extensionHost = fork(extensions)
      this.trpcClient = createIpcTrpcClient(this.extensionHost)
    } catch (error) {
      console.log('error:', error)
    }
  }

  async getPluginList() {
    return await this.trpcClient.getPlugins.query()
  }

  async openPlugin(id: string) {
    // 加载html
    const plugin = await this.trpcClient.getPlugin.query({ id })
    if (!plugin) return
    const mainWindow = this.windowService.mainWindow
    this.subWindow = new WebContentsView({
      webPreferences: {
        sandbox: false,
        // preload: join(__dirname, '../preload/plugin.js')
        preload: plugin.isSystem
          ? join(__dirname, '../preload/index.js')
          : join(__dirname, '../preload/plugin.js')
      }
    })
    this.mainIpc.register(`${id}:invoke`, async (data) => {
      return await this.trpcClient.invokePluginMethod.mutate({
        id,
        methodName: data.methodName,
        params: data
      })
    })
    // this.subWindow.webContents.loadFile('D:\\git\\electron-trpc-inversify\\resources\\index.html')
    const newX = (screen.getPrimaryDisplay().bounds.width - 1000) / 2
    mainWindow.setBounds({
      x: newX,
      y: mainWindow.getBounds().y,
      width: 1000,
      height: 784
    })
    this.subWindow.setBounds({ x: 0, y: 60, width: 1000, height: 700 })
    mainWindow.contentView.addChildView(this.subWindow)

    if (plugin.view.includes('http')) {
      this.subWindow.webContents.loadURL(plugin.view)
    } else {
      this.subWindow.webContents.loadFile(plugin.view)
    }
    this.subWindow.webContents.openDevTools()
  }

  closePlugin() {
    this.windowService.mainWindow.contentView.removeChildView(this.subWindow)
    const newX = (screen.getPrimaryDisplay().bounds.width - 600) / 2
    const { y, height } = this.windowService.mainWindow.getBounds()
    this.windowService.mainWindow.setBounds({ x: newX, y, width: 600, height })
  }
}
