import { contextBridge, ipcRenderer } from 'electron'

// ===================== IPC 核心封装 =====================
class PreloadIpc {
  pluginName = 'json-plugin'
  /**
   * 双向通信（invoke）：渲染进程 -> 主进程（异步，有返回值）
   * @param {string} channel - 通道名
   * @param {any} data - 发送的数据
   * @returns {Promise<any>} 主进程返回的结果
   */
  invoke(channel, data = {}) {
    return ipcRenderer.invoke(`${this.pluginName}:${channel}`, data)
  }

  /**
   * 单向通信（send）：渲染进程 -> 主进程（无返回值）
   * @param {string} channel - 通道名
   * @param {any} data - 发送的数据
   */
  send(channel, data = {}) {
    ipcRenderer.send(`${this.pluginName}:${channel}`, data)
  }

  /**
   * 监听主进程推送的消息（on）：主进程 -> 渲染进程
   * @param {string} channel - 通道名
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消监听的方法
   */
  on(channel, callback) {
    // 包装回调，屏蔽原始 event 对象（仅传递数据）
    const wrappedCallback = (event, ...args) => callback(...args)
    ipcRenderer.on(`${this.pluginName}:${channel}`, wrappedCallback)

    // 返回取消监听的方法
    return () => {
      ipcRenderer.removeListener(channel, wrappedCallback)
    }
  }

  /**
   * 一次性监听主进程推送的消息（once）
   * @param {string} channel - 通道名
   * @param {Function} callback - 回调函数
   */
  once(channel, callback) {
    ipcRenderer.once(`${this.pluginName}:${channel}`, (_, ...args) => callback(...args))
  }
}

// 实例化并暴露给渲染进程（通过 contextBridge，安全隔离）
const preloadIpc = new PreloadIpc()
contextBridge.exposeInMainWorld('ipc', {
  invoke: preloadIpc.invoke.bind(preloadIpc),
  send: preloadIpc.send.bind(preloadIpc),
  on: preloadIpc.on.bind(preloadIpc),
  once: preloadIpc.once.bind(preloadIpc)
})
