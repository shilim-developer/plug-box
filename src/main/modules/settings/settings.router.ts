import { inject, injectable } from 'inversify'
import z from 'zod'
import { pick } from 'es-toolkit/compat'
import type { PickMultiplePaths, RouterFilterTypes } from '../../trpc/trpc-types'
import TrpcService from '../trpc/trpc.service'
import { SettingsService } from './settings.service'

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
        registerConfiguration: publicProcedure
          .input(
            z.object({
              pluginId: z.string(),
              schema: z.any()
            })
          )
          .mutation(({ input }) => {
            this.settingsService.registerConfiguration(input.pluginId, input.schema)
            return { success: true }
          }),
        unregisterConfiguration: publicProcedure
          .input(z.object({ pluginId: z.string() }))
          .mutation(({ input }) => {
            this.settingsService.unregisterConfiguration(input.pluginId)
            return { success: true }
          }),
        getConfigurationSchema: publicProcedure
          .input(z.object({ pluginId: z.string().optional() }).optional())
          .query(({ input }) =>
            this.settingsService.getConfigurationSchema(input?.pluginId)
          ),
        getSettings: publicProcedure
          .input(z.object({ pluginId: z.string().optional() }).optional())
          .query(({ input }) => this.settingsService.getSettings(input?.pluginId)),
        getSetting: publicProcedure
          .input(z.object({ key: z.string() }))
          .query(({ input }) => this.settingsService.getSetting(input.key)),
        updateSettings: publicProcedure
          .input(z.record(z.unknown()))
          .mutation(({ input }) => this.settingsService.updateSettings(input)),
        updateSetting: publicProcedure
          .input(
            z.object({
              key: z.string(),
              value: z.unknown()
            })
          )
          .mutation(({ input }) => this.settingsService.updateSetting(input.key, input.value)),
        resetSettings: publicProcedure
          .input(z.object({ pluginId: z.string().optional() }).optional())
          .mutation(({ input }) => this.settingsService.resetSettings(input?.pluginId))
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
