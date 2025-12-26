import { ContainerModule, ContainerModuleLoadOptions } from 'inversify'
import SettingsService from './settings.service'
import SettingsRouter from './settings.router'

export const settingsModule: ContainerModule = new ContainerModule(
  (options: ContainerModuleLoadOptions) => {
    options.bind<SettingsService>(SettingsService).toSelf().inSingletonScope()
    options.bind<SettingsRouter>(SettingsRouter).toSelf().inSingletonScope()
  }
)