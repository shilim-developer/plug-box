import { inject, injectable } from 'inversify'
import AppRouterFactory from './app.router'
import { createIpcTrpcServer } from './trpc/trpc-server'
import { logger } from '@main/utils/logger'

@injectable()
export default class AppService {
  constructor(@inject(AppRouterFactory) private readonly appRouterFactory: AppRouterFactory) {}

  bootstrap(): void {
    logger.info('初始化tRPC IPC监听')
    createIpcTrpcServer({
      createContext: () =>
        Promise.resolve({
          extensionDir: ''
        }),
      router: this.appRouterFactory.create(),
      process
    })
  }
}
