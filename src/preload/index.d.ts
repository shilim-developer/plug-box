import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
  }
  type AppRouter = import('@main/modules/app.router').AppRouter
}
