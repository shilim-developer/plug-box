import { PluginCategory } from '@common/constants/plugin-category'
import { Plugin } from '@common/types/plugin'

export const systemPluginList: Plugin[] = [
  {
    id: 'settings',
    version: '1.0.0',
    pluginName: '系统设置',
    description: '系统设置',
    view: process.env['ELECTRON_RENDERER_URL'] + '#/blank/settings',
    // backend: 'D:\\git\\json-plugin\\dist\\backend\\index.mjs',
    isSystem: true,
    category: PluginCategory.SYSTEM,
    configuration: {
      registry: {
        title: '插件市场地址',
        type: 'string',
        description: '插件市场地址',
        default: 'http://npm.shilim.cn'
      },
      autoUpdate: {
        title: '自动更新',
        type: 'boolean',
        description: '自动更新',
        default: true
      },
      retry: {
        title: '重试次数',
        type: 'number',
        description: '重试次数',
        default: 3
      },
      openType: {
        title: '打开方式',
        type: 'string',
        description: '打开方式',
        enum: ['system', 'browser'],
        default: 'system'
      },
      proxy: {
        title: '代理',
        type: 'array',
        description: '代理',
        enum: ['http', 'https'],
        default: []
      }
    }
  },
  {
    id: 'marketplace',
    version: '1.0.0',
    pluginName: '插件市场',
    description: '插件市场',
    view: process.env['ELECTRON_RENDERER_URL'] + '#/blank/marketplace',
    // backend: './dist/plugin/index.js',
    isSystem: true,
    category: PluginCategory.SYSTEM
  }
]
