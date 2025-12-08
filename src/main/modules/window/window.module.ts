import { ContainerModule, ContainerModuleLoadOptions } from 'inversify'
import WindowService from './window.service'
import WindowRouter from './window.router'

export const windowModule: ContainerModule = new ContainerModule(
  (options: ContainerModuleLoadOptions) => {
    options.bind<WindowService>(WindowService).toSelf().inSingletonScope()
    options.bind<WindowRouter>(WindowRouter).toSelf().inSingletonScope()
  }
)
