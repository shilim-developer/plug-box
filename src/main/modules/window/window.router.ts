import { inject, injectable } from 'inversify'
import { pick } from 'es-toolkit/compat'
import type { RouterFilterTypes, PickMultiplePaths } from '../../trpc/trpc-types'
import TrpcService from '../trpc/trpc.service'
import WindowService from './window.service'
import z from 'zod'

@injectable()
export default class WindowRouter {
  constructor(
    @inject(TrpcService) private readonly trpcService: TrpcService,
    @inject(WindowService) private readonly windowService: WindowService
  ) {}

  private _router() {
    const { publicProcedure } = this.trpcService
    return {
      window: {
        openSubWindow: publicProcedure.mutation(() => {
          // this.windowService.createSubWindow()
        }),
        setMainWindowHeight: publicProcedure
          .input(z.object({ height: z.number() }))
          .mutation(({ input }) => {
            this.windowService.setMainWindowHeight(input.height)
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
