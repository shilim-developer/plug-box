import { ContainerModule, ContainerModuleLoadOptions } from 'inversify'
import PluginService from './plugin.service'
import PluginRouter from './plugin.router'

export const pluginModule: ContainerModule = new ContainerModule(
  (options: ContainerModuleLoadOptions) => {
    options.bind<PluginService>(PluginService).toSelf().inSingletonScope()
    options.bind<PluginRouter>(PluginRouter).toSelf().inSingletonScope()
  }
)
