import { ContainerModule, ContainerModuleLoadOptions } from 'inversify'
import ExtensionService from './extension.service'
import ExtensionRouter from './extension.router'

export const extensionModule: ContainerModule = new ContainerModule(
  (options: ContainerModuleLoadOptions) => {
    options.bind<ExtensionService>(ExtensionService).toSelf().inSingletonScope()
    options.bind<ExtensionRouter>(ExtensionRouter).toSelf().inSingletonScope()
  }
)