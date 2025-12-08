import { ContainerModule, ContainerModuleLoadOptions } from 'inversify'
import TrpcService from './trpc.service'

export const trpcModule: ContainerModule = new ContainerModule(
  (options: ContainerModuleLoadOptions) => {
    options.bind<TrpcService>(TrpcService).toSelf().inSingletonScope()
  }
)
