import { inject, injectable } from 'inversify'
import PluginService from './plugin.service'
import { pick } from 'es-toolkit/compat'
import type { PickMultiplePaths, RouterFilterTypes } from '../../trpc/trpc-types'
import TrpcService from '../trpc/trpc.service'
import z from 'zod'

@injectable()
export default class PluginRouter {
  constructor(
    @inject(TrpcService) private readonly trpcService: TrpcService,
    @inject(PluginService) private readonly pluginService: PluginService
  ) {}

  private _router() {
    const { publicProcedure } = this.trpcService
    return {
      plugin: {
        getPluginList: publicProcedure.query(() => {
          return this.pluginService.getPluginList()
        }),
        openPlugin: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => {
          this.pluginService.openPlugin(input.id)
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
