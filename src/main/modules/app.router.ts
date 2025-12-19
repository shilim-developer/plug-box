import { inject, injectable } from 'inversify'
import { mergeRouters } from '../trpc/trpc'
import WindowRouter from './window/window.router'
import ExampleRouter from './example/example.router'
import PluginRouter from './plugin/plugin.router'
import SettingsRouter from './settings/settings.router'

@injectable()
export default class AppRouterFactory {
  constructor(
    @inject(WindowRouter) private windowRouter: WindowRouter,
    @inject(ExampleRouter) private exampleRouter: ExampleRouter,
    @inject(PluginRouter) private pluginRouter: PluginRouter,
    @inject(SettingsRouter) private settingsRouter: SettingsRouter
  ) {}

  create() {
    return mergeRouters(
      this.windowRouter.allRouter(),
      this.exampleRouter.allRouter(),
      this.pluginRouter.allRouter(),
      this.settingsRouter.allRouter()
    )
  }
}

export type AppRouter = ReturnType<AppRouterFactory['create']>
