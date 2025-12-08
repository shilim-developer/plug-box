import { ContainerModule, ContainerModuleLoadOptions } from 'inversify'
import ExampleService from './example.service'
import ExampleRouter from './example.router'

export const exampleModule: ContainerModule = new ContainerModule(
  (options: ContainerModuleLoadOptions) => {
    options.bind<ExampleService>(ExampleService).toSelf().inSingletonScope()
    options.bind<ExampleRouter>(ExampleRouter).toSelf().inSingletonScope()
  }
)
