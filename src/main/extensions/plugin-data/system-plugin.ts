export const systemPluginList = [
  {
    id: 'marketplace',
    version: '1.0.0',
    pluginName: '插件市场',
    description: '插件市场',
    view: process.env['ELECTRON_RENDERER_URL'] + '#/blank/marketplace',
    backend: './dist/plugin/index.js',
    isSystem: true
  }
]
