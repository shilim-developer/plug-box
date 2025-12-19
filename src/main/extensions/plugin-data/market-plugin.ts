import { PluginCategory } from '@common/constants/plugin-category'

export const marketplacePluginList = [
  {
    id: 'json-plugin',
    version: '1.0.0',
    pluginName: 'JSON',
    description: 'json格式化工具',
    category: PluginCategory.DEVELOP,
    logo: 'https://github.com/shilim-developer/json-plugin/raw/master/apps/web/public/logo.png'
  },
  {
    id: 'color-plugin',
    version: '1.0.0',
    pluginName: 'Color',
    description: '颜色选择器工具',
    view: './dist/web/index.html',
    backend: './dist/backend/index.mjs'
  }
]
