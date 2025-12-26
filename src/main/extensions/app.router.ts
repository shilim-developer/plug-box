import { inject, injectable } from 'inversify'
import { mergeRouters } from '../trpc/trpc'
import ExtensionRouter from './extension/extension.router'
import SettingsRouter from './settings/settings.router'

@injectable()
export default class AppRouterFactory {
  constructor(
    @inject(ExtensionRouter) private readonly extensionRouter: ExtensionRouter,
    @inject(SettingsRouter) private readonly settingsRouter: SettingsRouter
  ) {}

  create() {
    return mergeRouters(
      this.extensionRouter.allRouter(),
      this.settingsRouter.allRouter()
    )
  }
}

export type AppRouter = ReturnType<AppRouterFactory['create']>
