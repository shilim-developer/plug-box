import PluginService from '@main/modules/plugin/plugin.service'
export class ElectronExpose {
  constructor(public pluginService: PluginService) {}

  hello() {
    return 'hello'
  }
}
