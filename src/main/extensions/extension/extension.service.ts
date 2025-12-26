import { inject, injectable } from 'inversify'
import { join } from 'path'
import { loadJson5 } from '../../utils/json-util'
import { Plugin } from '@common/types/plugin'
import { systemPluginList } from '../../extensions/plugin-data/system-plugin'
import { marketplacePluginList } from '../../extensions/plugin-data/market-plugin'
import { createIpcTrpcClient } from '../../extensions/trpc/trpc-client'
import { AppRouter as ElectronExposeAppRouter } from '@main/electron-expose/router'
import { logger } from '@main/utils/logger'
import { getConfigStore } from '@main/utils/storage-util'
import { MainConfig } from './extension.type'
import SettingsService from '../settings/settings.service'

const plugins: Map<string, any> = new Map()
const mainTrpcClient = createIpcTrpcClient<ElectronExposeAppRouter>(process)

let installedPlugins: Plugin[] = []

@injectable()
export default class ExtensionService {
  config: MainConfig = {} as MainConfig

  constructor(@inject(SettingsService) private readonly settingsService: SettingsService) {}

  async initConfig(input: MainConfig) {
    this.config = input
    this.settingsService.init(input.appPath)

    // 初始化插件配置
    const store = getConfigStore(input.appPath)
    const settingJson: Record<string, any> = store.getSync('setting') || {}

    // 处理系统插件配置
    for (const plugin of systemPluginList) {
      if (plugin.configuration) {
        const pluginId = plugin.id
        const currentVersion = plugin.version
        const savedConfig = settingJson[pluginId]

        try {
          // 检查是否需要更新配置
          let shouldUpdate = false
          let newConfig: Record<string, any> = {}

          if (!savedConfig) {
            // 没有保存的配置，使用默认配置
            shouldUpdate = true
            for (const [key, prop] of Object.entries(plugin.configuration)) {
              newConfig[key] = prop.default
            }
          } else {
            // 有保存的配置，检查版本号
            const savedVersion = savedConfig.version
            if (savedVersion !== currentVersion) {
              // 版本号不同，需要更新配置
              shouldUpdate = true
              // 保留用户已设置的配置，使用新版本的默认值填充新增的配置项
              newConfig = { ...savedConfig.configuration }

              for (const [key, prop] of Object.entries(plugin.configuration)) {
                if (newConfig[key] === undefined) {
                  newConfig[key] = prop.default
                }
              }
            }
          }

          // 如果需要更新，则保存配置
          if (shouldUpdate) {
            settingJson[pluginId] = {
              version: currentVersion,
              configuration: newConfig
            }

            logger.info(`已更新插件配置: ${pluginId} v${currentVersion}`)
          }
        } catch (error) {
          logger.error(`处理插件配置失败: ${pluginId}`, error)
        }
      }
    }

    // 处理已安装的第三方插件配置
    if (this.config.extensionsDir) {
      try {
        const pack = await loadJson5(join(this.config.extensionsDir, './package.json'))
        const dependencies = pack.dependencies

        for (const dep in dependencies) {
          try {
            const plugJson = await loadJson5(
              join(this.config.extensionsDir, 'node_modules', dep, './plugin.json')
            )

            if (plugJson.configuration) {
              const pluginId = plugJson.id
              const currentVersion = plugJson.version
              const savedConfig = settingJson[pluginId]

              try {
                // 检查是否需要更新配置
                let shouldUpdate = false
                let newConfig: Record<string, any> = {}

                if (!savedConfig) {
                  // 没有保存的配置，使用默认配置
                  shouldUpdate = true
                  for (const [key, prop] of Object.entries(plugJson.configuration)) {
                    newConfig[key] = prop.default
                  }
                } else {
                  // 有保存的配置，检查版本号
                  const savedVersion = savedConfig.version
                  if (savedVersion !== currentVersion) {
                    // 版本号不同，需要更新配置
                    shouldUpdate = true
                    // 保留用户已设置的配置，使用新版本的默认值填充新增的配置项
                    newConfig = { ...savedConfig.configuration }

                    for (const [key, prop] of Object.entries(plugJson.configuration)) {
                      if (newConfig[key] === undefined) {
                        newConfig[key] = prop.default
                      }
                    }
                  }
                }

                // 如果需要更新，则保存配置
                if (shouldUpdate) {
                  settingJson[pluginId] = {
                    version: currentVersion,
                    configuration: newConfig
                  }

                  logger.info(`已更新插件配置: ${pluginId} v${currentVersion}`)
                }
              } catch (error) {
                logger.error(`处理插件配置失败: ${pluginId}`, error)
              }
            }
          } catch (error) {
            logger.warn(`读取插件配置失败: ${dep}`, error)
          }
        }
      } catch (error) {
        logger.error('读取插件包配置失败', error)
      }
    }

    // 保存更新后的配置
    return new Promise<void>((resolve, reject) => {
      store.set('setting', settingJson, (error) => {
        if (error) {
          logger.error('保存插件配置失败', error)
          reject(error)
        } else {
          logger.info('插件配置初始化完成')
          resolve()
        }
      })
    })
  }

  async getMarketplacePluginList() {
    return marketplacePluginList
  }

  async getInstalledPluginList(pluginsDir: string) {
    console.log('pluginsDir:', pluginsDir)
    installedPlugins = [...systemPluginList]
    const pack = await loadJson5(join(pluginsDir, './package.json'))
    const dependencies = pack.dependencies
    for (const dep in dependencies) {
      const plugJson = await loadJson5(join(pluginsDir, 'node_modules', dep, './plugin.json'))
      plugJson.logo = plugJson.logo ? join(pluginsDir, 'node_modules', dep, plugJson.logo) : ''
      installedPlugins.push(plugJson)
    }
    logger.info(
      '已安装插件',
      installedPlugins.map((item) => item.pluginName)
    )
    return installedPlugins
  }

  getPlugin(id: string) {
    return installedPlugins.find((item) => item.id === id)
  }

  async registerPlugin(id: string, backend: string) {
    console.log('Module:', join(this.config.extensionsDir, 'node_modules', id, backend))
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Module = await require(
      backend.includes(':') ? backend : join(this.config.extensionsDir, 'node_modules', id, backend)
    )
    const Invoke = new Proxy(
      {},
      {
        /**
         * 拦截属性访问（如 Invoke.xxx）
         * @param {Object} target - 代理的目标对象（空对象）
         * @param {string} prop - 访问的属性名（如 'xxx'）
         * @param {Object} receiver - 代理对象本身
         * @returns {Function|any} 执行 invoke 并返回结果（或返回函数延迟执行）
         */
        get(target, prop, receiver) {
          // 特殊处理：如果访问 toString/valueOf 等内置属性，返回默认值
          if (['toString', 'valueOf', 'constructor'].includes(prop as string)) {
            return Reflect.get(target, prop, receiver)
          }
          return (extraOptions = {}) => {
            console.log('调用')
            return mainTrpcClient.invokeSystemMethod.mutate({
              id: id,
              methodName: prop as string,
              params: extraOptions
            })
          }
        }
      }
    )
    plugins.set(id, new Module.default(Invoke))
    console.log(plugins.get(id))

    // plugins.set(id, new Module())
  }

  async unInstallPlugin(id: string) {
    plugins.delete(id)
    const index = installedPlugins.findIndex((item) => item.id === id)
    installedPlugins.splice(index, 1)
  }

  async invokePluginMethod(id: string, methodName: string, params: any) {
    const plugin = plugins.get(id)
    if (plugin) {
      return await plugin[methodName](params)
    }
  }
}
