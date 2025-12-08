import { ContainerModule, ContainerModuleLoadOptions } from 'inversify'
import {{ serviceNameClass }}Service from './{{ serviceName }}.service'
import {{ serviceNameClass }}Router from './{{ serviceName }}.router'

export const {{ serviceName }}Module: ContainerModule = new ContainerModule(
  (options: ContainerModuleLoadOptions) => {
    options.bind<{{ serviceNameClass }}Service>({{ serviceNameClass }}Service).toSelf().inSingletonScope()
    options.bind<{{ serviceNameClass }}Router>({{ serviceNameClass }}Router).toSelf().inSingletonScope()
  }
)
