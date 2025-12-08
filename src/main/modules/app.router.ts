import { inject, injectable } from 'inversify'
import { mergeRouters } from '../trpc/trpc'
import WindowRouter from './window/window.router'
import ExampleRouter from './example/example.router'
import PluginRouter from './plugin/plugin.router'

@injectable()
export default class AppRouterFactory {
  constructor(
    @inject(WindowRouter) private windowRouter: WindowRouter,
    @inject(ExampleRouter) private exampleRouter: ExampleRouter,
    @inject(PluginRouter) private pluginRouter: PluginRouter
  ) {}

  create() {
    return mergeRouters(
      this.windowRouter.allRouter(),
      this.exampleRouter.allRouter(),
      this.pluginRouter.allRouter()
    )
  }
}

export type AppRouter = ReturnType<AppRouterFactory['create']>
