import { ipcMain } from 'electron'

// ===================== IPC 核心封装 =====================
export class MainIpc {
  handlers: Map<string, unknown>
  constructor() {
    this.handlers = new Map() // 存储已注册的 IPC 处理器
  }

  /**
   * 注册双向 IPC 处理器（invoke/handle）
   * @param {string} channel - IPC 通道名
   * @param {Function} handler - 处理函数，支持异步
   */
  register(channel, handler) {
    if (this.handlers.has(channel)) {
      console.warn(`IPC 通道 ${channel} 已注册，将覆盖原有处理器`)
      // 移除旧处理器
      ipcMain.removeHandler(channel)
    }

    // 注册新处理器，统一异常处理
    ipcMain.handle(channel, async (event, data) => {
      try {
        const result = await handler(data, event)
        // 标准化响应格式
        return {
          success: true,
          data: result,
          message: '操作成功'
        }
      } catch (error: any) {
        // 统一异常返回
        return {
          success: false,
          data: null,
          message: error.message || '操作失败',
          error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      }
    })

    this.handlers.set(channel, handler)
    console.log(`IPC 通道 ${channel} 注册成功`)
    return () => this.unregister(channel)
  }

  /**
   * 主动向渲染进程推送消息（单向）
   * @param {string} channel - IPC 通道名
   * @param {any} data - 推送的数据
   * @param {BrowserWindow} window - 目标窗口（默认主窗口）
   */
  sendToRenderer(channel, data, window) {
    if (!window || window.isDestroyed()) {
      console.warn(`窗口已销毁，无法推送消息到通道 ${channel}`)
      return
    }
    window.webContents.send(channel, data)
  }

  /**
   * 移除指定 IPC 处理器
   * @param {string} channel - IPC 通道名
   */
  unregister(channel) {
    if (this.handlers.has(channel)) {
      ipcMain.removeHandler(channel)
      this.handlers.delete(channel)
      console.log(`IPC 通道 ${channel} 已注销`)
    }
  }

  /**
   * 清空所有 IPC 处理器
   */
  clear() {
    this.handlers.forEach((_, channel) => this.unregister(channel))
    this.handlers.clear()
  }
}
