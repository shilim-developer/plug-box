import { inject, injectable } from 'inversify'
import z from 'zod'
import { pick } from 'es-toolkit/compat'
import type { PickMultiplePaths, RouterFilterTypes } from '../../trpc/trpc-types'
import SettingsService from './settings.service'
import TrpcService from '../trpc/trpc.service'

@injectable()
export default class SettingsRouter {
  constructor(
    @inject(TrpcService) private readonly trpcService: TrpcService,
    @inject(SettingsService) private readonly settingsService: SettingsService
  ) {}

  private _router() {
    const { publicProcedure } = this.trpcService
    return {
      settings: {
        init: publicProcedure
          .input(z.object({ appPath: z.string() }))
          .mutation(({ input }) => this.settingsService.init(input.appPath)),
        getSettings: publicProcedure
          .input(z.object({ pluginId: z.string().optional() }).optional())
          .query(({ input }) => this.settingsService.getSettings(input?.pluginId)),
        getSetting: publicProcedure
          .input(z.object({ pluginId: z.string(), key: z.string() }))
          .query(({ input }) => this.settingsService.getSetting(input.pluginId, input.key)),
        updateSettings: publicProcedure
          .input(z.object({ pluginId: z.string(), settings: z.record(z.unknown()) }))
          .mutation(({ input }) =>
            this.settingsService.updateSettings(input.pluginId, input.settings)
          ),
        updateSetting: publicProcedure
          .input(z.object({ pluginId: z.string(), key: z.string(), value: z.unknown() }))
          .mutation(({ input }) =>
            this.settingsService.updateSetting(input.pluginId, input.key, input.value)
          ),
        resetSettings: publicProcedure
          .input(z.object({ pluginId: z.string() }))
          .mutation(({ input }) => this.settingsService.resetSettings(input.pluginId)),
        getAllSettings: publicProcedure.query(() => this.settingsService.getAllSettings()),
        saveSettings: publicProcedure
          .input(z.record(z.unknown()))
          .mutation(({ input }) => this.settingsService.saveSettings(input)),
        getConfigurationSchema: publicProcedure
          .input(z.object({ pluginId: z.string() }))
          .query(({ input }) => this.settingsService.getConfigurationSchema(input.pluginId))
      }
    }
  }

  allRouter() {
    const { createRouter } = this.trpcService
    return createRouter(this._router())
  }

  filterRouter<T extends RouterFilterTypes<typeof this._router>[]>(filters: T) {
    const { createRouter } = this.trpcService
    return createRouter(
      pick(this._router(), filters) as PickMultiplePaths<
        ReturnType<typeof this._router>,
        typeof filters
      >
    )
  }
}
