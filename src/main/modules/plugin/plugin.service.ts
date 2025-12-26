import { MainIpc } from './../../ipc/main-ipc'
import { inject, injectable } from 'inversify'
import TrpcService from '../trpc/trpc.service'
import WindowService from '../window/window.service'
import { WebContentsView, app, session } from 'electron'
import { join } from 'path'
import { ChildProcess, fork } from 'child_process'
import extensions from '../../extensions/index?modulePath'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs-extra'
import { SpawnUtil } from '../../utils/spawn-util'
import pluginJsTemp from '../../../../resources/plugin.js?asset'
import { BaseResponse } from '@common/constants/base-response'
import { autoTryCatch } from '@main/decorators/auto-try-catch'
import { createIpcTrpcServer } from '@main/extensions/trpc/trpc-server'
import { initElectronExposeRouter } from '@main/electron-expose/router'
import { PluginStore } from './models/plugin-store'
import { logger } from '@main/utils/logger'
import { ScreenCenterHelper } from '@main/utils/screen-util'
// import { AppRouter } from '@main/extensions/app.router'
import SettingsService from '../settings/settings.service'

@injectable()
export default class PluginService {
  extensionHost!: ChildProcess
  // extensionTrpcClient!: TRPCClient<AppRouter>
  extensionsDir = join(app.getPath('userData'), './extensions')
  pluginMap = new Map<string, PluginStore>()
  subWindow!: WebContentsView
  mainIpc = new MainIpc()
  pluginSessionMap = new Map<string, string>()
  currentPluginId = ''

  constructor(
    @inject(TrpcService) private readonly trpcService: TrpcService,
    @inject(WindowService) private readonly windowService: WindowService,
    @inject(SettingsService) private readonly settingsService: SettingsService
  ) {}

  @autoTryCatch({ errorMsg: '插件启动失败' })
  async startPluginProgress() {
    // 创建扩展目录
    if (!existsSync(this.extensionsDir)) {
      mkdirSync(this.extensionsDir)
    }
    this.extensionHost = fork(extensions)
    this.trpcService.initExtensionTrpcClient(this.extensionHost)
    // this.extensionTrpcClient = createIpcTrpcClient(this.extensionHost)
    createIpcTrpcServer({
      router: initElectronExposeRouter({ pluginService: this }),
      process: this.extensionHost
    })
    await this.trpcService.extensionTrpcClient.extension.initConfig.mutate({
      appPath: app.getPath('userData'),
      extensionsDir: this.extensionsDir
    })
    return BaseResponse.successMessage('启动成功')
  }

  @autoTryCatch({ errorMsg: '插件安装失败' })
  async installPlugin(id: string) {
    await SpawnUtil.exec('npm', ['install', id, '--registry=http://npm.shilim.cn'], {
      cwd: this.extensionsDir
    }).catch((error) => {
      console.error('安装插件失败:', error)
    })
    return BaseResponse.successMessage('安装成功')
  }

  @autoTryCatch({ errorMsg: '插件卸载失败' })
  async uninstallPlugin(id: string) {
    await SpawnUtil.exec('npm', ['uninstall', id], {
      cwd: this.extensionsDir
    })
    await this.trpcService.extensionTrpcClient.extension.unInstallPlugin.mutate({ id })
    return BaseResponse.successMessage('卸载成功')
  }

  @autoTryCatch({ errorMsg: '获取插件列表失败' })
  async getMarketplacePluginList() {
    return this.trpcService.extensionTrpcClient.extension.getMarketplacePluginList.query()
  }

  @autoTryCatch({ errorMsg: '获取已安装插件列表失败' })
  async getInstalledPluginList() {
    return this.trpcService.extensionTrpcClient.extension.getInstalledPluginList.query({
      pluginsDir: this.extensionsDir
    })
  }

  @autoTryCatch({ errorMsg: '打开插件失败' })
  async openPlugin(id: string) {
    const plugin = await this.trpcService.extensionTrpcClient.extension.getPlugin.query({ id })
    if (!plugin) return BaseResponse.failMessage('插件不存在')
    logger.info('打开插件', plugin?.pluginName)
    if (this.currentPluginId) {
      this.closePlugin()
    }
    this.currentPluginId = id
    if (plugin.backend) {
      await this.trpcService.extensionTrpcClient.extension.registerPlugin.mutate({
        id,
        backend: plugin.backend
      })
    }
    const pluginSession = session.fromPartition(`persist:${id}`)
    const pluginPreloadId = pluginSession.registerPreloadScript({
      type: 'frame',
      filePath: plugin.isSystem
        ? join(__dirname, '../preload/index.js')
        : join(this.extensionsDir, 'node_modules', id, 'plugin.js')
    })
    const pluginJs = join(this.extensionsDir, 'node_modules', id, 'plugin.js')
    if (!existsSync(pluginJs) && !plugin.isSystem) {
      writeFileSync(pluginJs, readFileSync(pluginJsTemp).toString().replace('${pluginName}', id))
    }
    const mainWindow = this.windowService.mainWindow
    const pluginView = new WebContentsView({
      webPreferences: {
        webSecurity: !plugin.isSystem,
        sandbox: false,
        session: pluginSession
      }
    })
    const mainIpcDispose = this.mainIpc.register(`${id}:invoke`, async (data: any) =>
      this.trpcService.extensionTrpcClient.extension.invokePluginMethod.mutate({
        id,
        methodName: data.methodName,
        params: data
      })
    )
    mainWindow.setBounds({
      x: mainWindow.getBounds().x,
      y: mainWindow.getBounds().y,
      width: 1000,
      height: 784
    })
    pluginView.setBounds({ x: 0, y: 60, width: 1000, height: 700 })
    ScreenCenterHelper.centerToCursorScreen(mainWindow)
    mainWindow.contentView.addChildView(pluginView)
    if (plugin.view.includes('http')) {
      pluginView.webContents.loadURL(plugin.view)
    } else {
      pluginView.webContents.loadFile(join(this.extensionsDir, 'node_modules', id, plugin.view))
    }
    pluginView.webContents.openDevTools()
    const resizeFun = () => {
      pluginView.setBounds({
        x: 0,
        y: 60,
        width: mainWindow.getBounds().width,
        height: mainWindow.getBounds().height - 84
      })
    }
    mainWindow.addListener('resize', resizeFun)
    this.pluginMap.set(id, {
      pluginView,
      preloadId: pluginPreloadId,
      dispose: () => {
        mainIpcDispose()
        pluginView.webContents.session.unregisterPreloadScript(pluginPreloadId)
        const { x, y, height } = this.windowService.mainWindow.getBounds()
        this.windowService.mainWindow.setBounds({ x, y, width: 600, height })
        ScreenCenterHelper.centerToCursorScreen(mainWindow)
        mainWindow.removeListener('resize', resizeFun)
        mainWindow.contentView.removeChildView(pluginView)
        this.currentPluginId = ''
        this.pluginMap.delete(id)
      }
    })
    return BaseResponse.success(plugin)
  }

  @autoTryCatch({ errorMsg: '关闭插件失败' })
  closePlugin() {
    if (this.currentPluginId) {
      this.pluginMap.get(this.currentPluginId)?.dispose()
    }
  }
}
