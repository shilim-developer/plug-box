import { MainIpc } from './../../ipc/main-ipc'
import { inject, injectable } from 'inversify'
import TrpcService from '../trpc/trpc.service'
import WindowService from '../window/window.service'
import { WebContentsView, app, screen, session } from 'electron'
import { join } from 'path'
import { ChildProcess, fork } from 'child_process'
import extensions from '../../extensions/index?modulePath'
import { createIpcTrpcClient } from '../../extensions/trpc/trpc-client'
import { TRPCClient } from '@trpc/client'
import { AppRouter } from '../../extensions/trpc/router'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs-extra'
import { SpawnUtil } from '../../utils/spawn-util'
import pluginJsTemp from '../../../../resources/plugin.js?asset'
import { BaseResponse } from '@common/constants/base-response'
import { autoTryCatch } from '@main/decorators/auto-try-catch'

@injectable()
export default class PluginService {
  extensionHost!: ChildProcess
  extensionTrpcClient!: TRPCClient<AppRouter>
  extensionsDir = join(app.getPath('userData'), './extensions')
  pluginMap = new Map<
    string,
    {
      view: WebContentsView
      preloadId: string
    }
  >()
  subWindow!: WebContentsView
  mainIpc = new MainIpc()
  pluginSessionMap = new Map<string, string>()
  currentPluginId = ''

  constructor(
    @inject(TrpcService) private readonly trpcService: TrpcService,
    @inject(WindowService) private readonly windowService: WindowService
  ) {}

  @autoTryCatch({ errorMsg: '插件启动失败' })
  async startPluginProgress() {
    // 创建扩展目录
    if (!existsSync(this.extensionsDir)) {
      mkdirSync(this.extensionsDir)
    }
    this.extensionHost = fork(extensions)
    this.extensionTrpcClient = createIpcTrpcClient(this.extensionHost)
    return BaseResponse.successMessage('启动成功')
  }

  @autoTryCatch({ errorMsg: '插件安装失败' })
  async installPlugin(id: string) {
    await SpawnUtil.exec('npm', ['install', id, '--registry=http://npm.shilim.cn/'], {
      cwd: this.extensionsDir
    })
    return BaseResponse.successMessage('安装成功')
  }

  @autoTryCatch({ errorMsg: '插件卸载失败' })
  async uninstallPlugin(id: string) {
    await SpawnUtil.exec('npm', ['uninstall', id], {
      cwd: this.extensionsDir
    })
    await this.extensionTrpcClient.unInstallPlugin.mutate({ id })
    return BaseResponse.successMessage('卸载成功')
  }

  @autoTryCatch({ errorMsg: '获取插件列表失败' })
  async getMarketplacePluginList() {
    return this.extensionTrpcClient.getMarketplacePluginList.query()
  }

  @autoTryCatch({ errorMsg: '获取已安装插件列表失败' })
  async getInstalledPluginList() {
    return this.extensionTrpcClient.getInstalledPluginList.query({
      pluginsDir: this.extensionsDir
    })
  }

  @autoTryCatch({ errorMsg: '打开插件失败' })
  async openPlugin(id: string) {
    const plugin = await this.extensionTrpcClient.getPlugin.query({ id })
    console.log('plugin:', plugin)
    if (!plugin) return
    if (this.currentPluginId) {
      this.closePlugin()
    }
    this.currentPluginId = id
    const pluginSession = session.fromPartition(`persist:${id}`)
    const pluginPreloadId = pluginSession.registerPreloadScript({
      type: 'frame',
      filePath: plugin.isSystem
        ? join(__dirname, '../preload/index.js')
        : join(this.extensionsDir, 'node_modules', id, 'plugin.js')
    })
    this.pluginSessionMap.set(id, pluginPreloadId)
    const pluginJs = join(this.extensionsDir, 'node_modules', id, 'plugin.js')
    if (!existsSync(pluginJs) && !plugin.isSystem) {
      writeFileSync(pluginJs, readFileSync(pluginJsTemp).toString().replace('${pluginName}', id))
    }
    const mainWindow = this.windowService.mainWindow
    this.subWindow = new WebContentsView({
      webPreferences: {
        sandbox: false,
        session: pluginSession
        // preload: plugin.isSystem ? join(__dirname, '../preload/index.js') : pluginJs
      }
    })
    this.mainIpc.register(`${id}:invoke`, async (data) => {
      return await this.extensionTrpcClient.invokePluginMethod.mutate({
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

  @autoTryCatch({ errorMsg: '关闭插件失败' })
  closePlugin() {
    const pluginPreloadId = this.pluginSessionMap.get(this.currentPluginId)
    if (this.currentPluginId && pluginPreloadId) {
      this.subWindow.webContents.session.unregisterPreloadScript(pluginPreloadId)
      this.pluginSessionMap.delete(this.currentPluginId)
    }
    this.windowService.mainWindow.contentView.removeChildView(this.subWindow)
    const newX = (screen.getPrimaryDisplay().bounds.width - 600) / 2
    const { y, height } = this.windowService.mainWindow.getBounds()
    this.windowService.mainWindow.setBounds({ x: newX, y, width: 600, height })
    this.currentPluginId = ''
  }
}
