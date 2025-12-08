import { ContainerModule, ContainerModuleLoadOptions } from 'inversify'
import AppService from './app.service'
import AppRouterFactory from './app.router'

export const appModule: ContainerModule = new ContainerModule(
  (options: ContainerModuleLoadOptions) => {
    options.bind<AppRouterFactory>(AppRouterFactory).toSelf().inSingletonScope()
    options.bind<AppService>(AppService).toSelf().inSingletonScope()
  }
)
