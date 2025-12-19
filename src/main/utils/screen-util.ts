import { screen, BrowserWindow } from 'electron'

/**
 * Electron 多屏窗口居中工具类
 * 支持：主屏幕居中、指定屏幕居中、鼠标所在屏幕居中
 */
export class ScreenCenterHelper {
  /**
   * 获取所有屏幕信息（过滤无效屏幕）
   * @returns {Electron.Display[]} 有效屏幕数组
   */
  static getAllValidScreens() {
    const allScreens = screen.getAllDisplays()
    // 过滤掉可能的无效屏幕（如未激活的虚拟屏）
    return allScreens.filter((display) => display && display.workArea && display.size)
  }

  /**
   * 精准获取窗口当前所在的显示区域（适配分屏）
   * @param {BrowserWindow} window 窗口实例
   * @returns {Electron.Display} 窗口实际所在的屏幕/分屏区域
   */
  static getWindowActualDisplay(window) {
    const windowBounds = window.getBounds()
    // 关键：使用 getDisplayMatching 而非固定屏幕索引，精准匹配窗口当前所在区域（包括分屏）
    return screen.getDisplayMatching(windowBounds)
  }

  /**
   * 获取目标屏幕（处理索引越界）
   * @param {number} screenIndex 屏幕索引
   * @returns {Electron.Display} 目标屏幕（默认主屏幕）
   */
  static getTargetScreen(screenIndex = 0) {
    const validScreens = this.getAllValidScreens()
    // 索引越界时默认使用主屏幕
    if (screenIndex < 0 || screenIndex >= validScreens.length) {
      return screen.getPrimaryDisplay()
    }
    return validScreens[screenIndex]
  }

  /**
   * 计算窗口在指定屏幕的居中坐标
   * @param {number} windowWidth 窗口宽度
   * @param {number} windowHeight 窗口高度
   * @param {Electron.Display} targetDisplay 目标显示区域
   * @param {BrowserWindow} window 窗口实例（用于适配分屏）
   * @returns {{x: number, y: number}} 居中坐标
   */
  static calculateCenterPosition(windowWidth, windowHeight, targetDisplay, window) {
    const windowBounds = window.getBounds()
    // 分屏场景下，获取窗口实际占用的屏幕区域（而非整个屏幕的 workArea）
    const displayBounds = targetDisplay.bounds
    const workArea = targetDisplay.workArea

    // 修正1：分屏时，窗口的可用区域是「分屏后的虚拟区域」，而非整个屏幕
    let actualWorkArea = { ...workArea }

    // 检测是否为分屏（窗口宽度远小于屏幕宽度/高度，且贴边）
    const isSplitScreen =
      (windowBounds.width < displayBounds.width * 0.6 &&
        (windowBounds.x === displayBounds.x ||
          windowBounds.x === displayBounds.x + displayBounds.width - windowBounds.width)) ||
      (windowBounds.height < displayBounds.height * 0.6 &&
        (windowBounds.y === displayBounds.y ||
          windowBounds.y === displayBounds.y + displayBounds.height - windowBounds.height))

    if (isSplitScreen) {
      // 分屏时，以窗口当前所在的贴边区域为基准计算居中
      actualWorkArea = {
        x: windowBounds.x,
        y: windowBounds.y,
        width: windowBounds.width, // 分屏后窗口的最大可用宽度（系统限制）
        height: windowBounds.height // 分屏后窗口的最大可用高度
      }
    }

    // 修正2：基于实际可用区域计算居中（分屏/普通屏通用）
    const x = Math.floor(actualWorkArea.x + (actualWorkArea.width - windowWidth) / 2)
    const y = Math.floor(actualWorkArea.y + (actualWorkArea.height - windowHeight) / 2)

    console.log('windowWidth:', windowWidth)
    console.log('workArea.x:', workArea.x)
    console.log('windowHeight:', windowHeight)
    console.log('workArea.height:', workArea.height)
    console.log('workArea.y:', workArea.y)

    // 兜底：确保坐标不超出屏幕边界
    return {
      x: Math.max(displayBounds.x, x),
      y: Math.max(displayBounds.y, y)
    }
  }

  /**
   * 将窗口居中到指定屏幕
   * @param {BrowserWindow} window Electron窗口实例
   * @param {number} [screenIndex=0] 屏幕索引（0为主屏幕）
   */
  static centerToScreen(window, screenIndex = 0) {
    if (!(window instanceof BrowserWindow)) {
      throw new Error('参数必须是 Electron BrowserWindow 实例')
    }

    // 获取窗口当前尺寸
    const { width, height } = window.getBounds()
    // 获取目标屏幕
    const targetScreen = this.getTargetScreen(screenIndex)
    // 计算居中坐标
    const { x, y } = this.calculateCenterPosition(width, height, targetScreen, window)
    // 设置窗口位置（保持尺寸不变）
    window.setPosition(x, y, false)
  }

  /**
   * 将窗口居中到鼠标所在屏幕
   * @param {BrowserWindow} window Electron窗口实例
   */
  static centerToCursorScreen(window) {
    if (!(window instanceof BrowserWindow)) {
      throw new Error('参数必须是 Electron BrowserWindow 实例')
    }

    // 获取鼠标当前位置
    const cursorPoint = screen.getCursorScreenPoint()
    // 获取鼠标所在屏幕
    const cursorScreen = screen.getDisplayNearestPoint(cursorPoint)
    // 获取窗口尺寸
    const { width, height } = window.getBounds()
    // 计算并设置居中坐标
    const { x, y } = this.calculateCenterPosition(width, height, cursorScreen, window)
    console.log('y:', y)
    window.setPosition(x, y, false)
  }

  /**
   * 创建窗口时直接居中到指定屏幕（一步到位）
   * @param {Electron.BrowserWindowConstructorOptions} windowOptions 窗口配置
   * @param {number} [screenIndex=0] 目标屏幕索引
   * @returns {BrowserWindow} 居中后的窗口实例
   */
  static createCenteredWindow(windowOptions, screenIndex = 0) {
    // 先获取目标屏幕
    const targetScreen = this.getTargetScreen(screenIndex)
    const { workArea } = targetScreen

    // 提取窗口尺寸（默认使用屏幕可用区域的80%）
    const windowWidth = windowOptions.width || Math.floor(workArea.width * 0.8)
    const windowHeight = windowOptions.height || Math.floor(workArea.height * 0.8)

    // 计算居中坐标
    const { x, y } = this.calculateCenterPosition(windowWidth, windowHeight, targetScreen, window)

    // 合并配置并创建窗口
    const centeredOptions = {
      ...windowOptions,
      width: windowWidth,
      height: windowHeight,
      x,
      y,
      // 避免窗口创建时的默认位置偏移
      center: false
    }

    return new BrowserWindow(centeredOptions)
  }
}
