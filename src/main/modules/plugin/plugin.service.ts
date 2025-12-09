import { MainIpc } from './../../ipc/main-ipc'
import { inject, injectable } from 'inversify'
import TrpcService from '../trpc/trpc.service'
import WindowService from '../window/window.service'
import { WebContentsView, app, screen } from 'electron'
import { join } from 'path'
import { ChildProcess, fork } from 'child_process'
import extensions from '../../extensions/index?modulePath'
import { createIpcTrpcClient } from '../../extensions/trpc/trpc-client'
import { TRPCClient } from '@trpc/client'
import { AppRouter } from '../../extensions/trpc/router'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs-extra'
import { SpawnUtil } from '../../utils/spawn-util'
import pluginJsTemp from '../../../../resources/plugin.js?asset'

@injectable()
export default class PluginService {
  subWindow!: WebContentsView
  trpcClient!: TRPCClient<AppRouter>
  mainIpc = new MainIpc()
  extensionHost!: ChildProcess
  extensionsDir = join(app.getPath('userData'), './extensions')

  constructor(
    @inject(TrpcService) private readonly trpcService: TrpcService,
    @inject(WindowService) private readonly windowService: WindowService
  ) {}

  startPluginProgress() {
    try {
      // 创建扩展目录
      if (!existsSync(this.extensionsDir)) {
        mkdirSync(this.extensionsDir)
      }
      this.extensionHost = fork(extensions)
      this.trpcClient = createIpcTrpcClient(this.extensionHost)
    } catch (error) {
      console.log('error:', error)
    }
  }

  installPlugin(id: string) {
    console.log('id:', id)
    console.log(this.extensionsDir)

    return SpawnUtil.exec('npm', ['install', id, '--registry=http://npm.shilim.cn/'], {
      cwd: this.extensionsDir
    }).catch((err) => console.error(err))
  }

  async uninstallPlugin(id: string) {
    console.log('卸载插件:', id)
    await SpawnUtil.exec('npm', ['uninstall', id], {
      cwd: this.extensionsDir
    })
    await this.trpcClient.unInstallPlugin.mutate({ id })
  }

  async getMarketplacePluginList() {
    return await this.trpcClient.getMarketplacePluginList.query()
  }

  async getInstalledPluginList() {
    return await this.trpcClient.getInstalledPluginList.query({
      pluginsDir: this.extensionsDir
    })
  }

  async openPlugin(id: string) {
    const plugin = await this.trpcClient.getPlugin.query({ id })
    console.log('plugin:', plugin)
    if (!plugin) return
    const pluginJs = join(this.extensionsDir, 'node_modules', id, 'plugin.js')
    if (!existsSync(pluginJs) && !plugin.isSystem) {
      writeFileSync(pluginJs, readFileSync(pluginJsTemp).toString().replace('${pluginName}', id))
    }
    const mainWindow = this.windowService.mainWindow
    this.subWindow = new WebContentsView({
      webPreferences: {
        sandbox: false,
        preload: plugin.isSystem ? join(__dirname, '../preload/index.js') : pluginJs
      }
    })
    this.mainIpc.register(`${id}:invoke`, async (data) => {
      return await this.trpcClient.invokePluginMethod.mutate({
        id,
        methodName: data.methodName,
        params: data
      })
    })
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
      this.subWindow.webContents.loadFile(join(this.extensionsDir, 'node_modules', id, plugin.view))
    }
    this.subWindow.webContents.openDevTools()
    mainWindow.addListener('resize', () => {
      this.subWindow.setBounds({
        x: 0,
        y: 60,
        width: mainWindow.getBounds().width,
        height: mainWindow.getBounds().height - 84
      })
    })
  }

  closePlugin() {
    this.windowService.mainWindow.contentView.removeChildView(this.subWindow)
    const newX = (screen.getPrimaryDisplay().bounds.width - 600) / 2
    const { y, height } = this.windowService.mainWindow.getBounds()
    this.windowService.mainWindow.setBounds({ x: newX, y, width: 600, height })
  }
}
