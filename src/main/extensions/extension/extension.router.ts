import { inject, injectable } from 'inversify'
import z from 'zod'
import { pick } from 'es-toolkit/compat'
import type { PickMultiplePaths, RouterFilterTypes } from '../../trpc/trpc-types'
import ExtensionService from './extension.service'
import TrpcService from '../trpc/trpc.service'

@injectable()
export default class ExtensionRouter {
  constructor(
    @inject(TrpcService) private readonly trpcService: TrpcService,
    @inject(ExtensionService) private readonly extensionService: ExtensionService
  ) {}

  private _router() {
    const { publicProcedure } = this.trpcService
    return {
      extension: {
        initConfig: publicProcedure
          .input(z.any())
          .mutation(({ input }) => this.extensionService.initConfig(input)),
        getMarketplacePluginList: publicProcedure.query(() =>
          this.extensionService.getMarketplacePluginList()
        ),
        getInstalledPluginList: publicProcedure
          .input(z.object({ pluginsDir: z.string() }))
          .query(({ input }) => this.extensionService.getInstalledPluginList(input.pluginsDir)),
        getPlugin: publicProcedure
          .input(z.object({ id: z.string() }))
          .query(({ input }) => this.extensionService.getPlugin(input.id)),
        registerPlugin: publicProcedure
          .input(z.object({ id: z.string(), backend: z.string() }))
          .mutation(({ input }) => this.extensionService.registerPlugin(input.id, input.backend)),
        unInstallPlugin: publicProcedure
          .input(z.object({ id: z.string() }))
          .mutation(({ input }) => this.extensionService.unInstallPlugin(input.id)),
        invokePluginMethod: publicProcedure
          .input(z.object({ id: z.string(), methodName: z.string(), params: z.any() }))
          .mutation(({ input }) =>
            this.extensionService.invokePluginMethod(input.id, input.methodName, input.params)
          )
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
