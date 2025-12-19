import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { inject, injectable } from 'inversify'
import { createIPCHandler } from 'trpc-electron/main'
import WindowService from './window/window.service'
import AppRouterFactory from './app.router'
import PluginService from './plugin/plugin.service'
import { exec } from 'child_process'

@injectable()
export default class AppService {
  constructor(
    @inject(WindowService) private readonly windowService: WindowService,
    @inject(AppRouterFactory) private readonly appRouterFactory: AppRouterFactory,
    @inject(PluginService) private readonly pluginService: PluginService
  ) {}

  bootstrap(): void {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.whenReady().then(async () => {
      // Set app user model id for windows
      electronApp.setAppUserModelId('com.electron')

      // Default open or close DevTools by F12 in development
      // and ignore CommandOrControl + R in production.
      // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
      app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
      })

      const mainWindow = this.windowService.createWindow()
      // const childView = new WebContentsView()
      // childView.webContents.loadFile('D:\\git\\electron-trpc-inversify\\resources\\index.html')
      // mainWindow.contentView.addChildView(childView)
      // childView.setBounds({ x: 0, y: 0, width: 400, height: 400 })
      const appRouter = this.appRouterFactory.create()
      createIPCHandler({ router: appRouter, windows: [mainWindow] })
      this.pluginService.startPluginProgress()
      // exec('npm -v', (error, stdout, stderr) => {
      //   if (error) {
      //     console.error(`执行出错: ${error}`)
      //     return
      //   }
      //   console.log(`stdout: ${stdout}`)
      //   if (stderr) {
      //     console.error(`stderr: ${stderr}`)
      //   }
      // })
      // 创建子进程
      // try {
      //   const extensionHost = fork(extensions)
      //   const client = createTRPCProxyClient({
      //     links: [
      //       nodeIPCLink(extensionHost) // 这里把 fork 进程传给 link
      //     ]
      //   })
      //   const result = await client.math.add.query({ a: 1, b: 2 })
      //   console.log('Result from worker:', result)
      // } catch (error) {
      //   console.log('error:', error)
      // }

      app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) this.windowService.createWindow()
      })
    })

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    // In this file you can include the rest of your app's specific main process
    // code. You can also put them in separate files and require them here.
  }
}
