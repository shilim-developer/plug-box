import { WebContentsView } from 'electron'

export class PluginStore {
  pluginView: WebContentsView
  preloadId: string
  dispose: () => void | Promise<void>

  constructor(pluginView: WebContentsView, preloadId: string, dispose: () => void | Promise<void>) {
    this.pluginView = pluginView
    this.preloadId = preloadId
    this.dispose = dispose
  }
}
