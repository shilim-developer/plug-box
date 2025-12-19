import { inject, injectable } from 'inversify'
import PluginService from './plugin.service'
import { SettingsService } from '../settings/settings.service'
import { pick } from 'es-toolkit/compat'
import type { PickMultiplePaths, RouterFilterTypes } from '../../trpc/trpc-types'
import TrpcService from '../trpc/trpc.service'
import z from 'zod'
import { zAsyncIterable } from '@main/trpc/z-async-iterable'
import { on } from 'events'

export const PluginMessage = Symbol('plugin:message')

@injectable()
export default class PluginRouter {
  constructor(
    @inject(TrpcService) private readonly trpcService: TrpcService,
    @inject(PluginService) private readonly pluginService: PluginService,
    @inject(SettingsService) private readonly settingsService: SettingsService
  ) {}

  private _router() {
    const { publicProcedure, ee } = this.trpcService
    return {
      plugin: {
        message: publicProcedure
          .output(
            zAsyncIterable({
              yield: z.object({
                type: z.string(),
                data: z.any()
              })
            })
          )
          .subscription(async function* (opts) {
            for await (const [data] of on(ee, PluginMessage, {
              signal: opts.signal
            })) {
              yield data
            }
          }),
        sendMessage: publicProcedure
          .input(z.object({ type: z.string(), data: z.any() }))
          .mutation(({ input }) => {
            ee.emit(PluginMessage, input)
          }),
        getMarketplacePluginList: publicProcedure.query(() => {
          return this.pluginService.getMarketplacePluginList()
        }),
        getInstalledPluginList: publicProcedure.query(async () => {
          const plugins = await this.pluginService.getInstalledPluginList()

          // 自动注册每个插件的配置 schema
          for (const plugin of plugins) {
            if (plugin.configuration) {
              this.settingsService.registerConfiguration(plugin.id, plugin.configuration)
            }
          }

          return plugins
        }),
        installPlugin: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
          return this.pluginService.installPlugin(input.id)
        }),
        uninstallPlugin: publicProcedure
          .input(z.object({ id: z.string() }))
          .mutation(({ input }) => {
            return this.pluginService.uninstallPlugin(input.id)
          }),
        openPlugin: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
          return this.pluginService.openPlugin(input.id)
        }),
        closePlugin: publicProcedure.mutation(() => {
          this.pluginService.closePlugin()
        })
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
