import { ContainerModule, ContainerModuleLoadOptions } from 'inversify'
import SettingsService from './settings.service'
import SettingsRouter from './settings.router'

export const settingsModule = new ContainerModule((options: ContainerModuleLoadOptions) => {
  options.bind(SettingsService).toSelf().inSingletonScope()
  options.bind(SettingsRouter).toSelf().inSingletonScope()
})