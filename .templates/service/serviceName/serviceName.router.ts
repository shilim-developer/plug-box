import { inject, injectable } from 'inversify'
import {{ serviceNameClass }}Service from './{{ serviceName }}.service'
import { pick } from 'es-toolkit/compat'
import type { PickMultiplePaths, RouterFilterTypes } from '../../trpc/trpc-types'
import TrpcService from '../trpc/trpc.service'

@injectable()
export default class {{ serviceNameClass }}Router {
  constructor(
    @inject(TrpcService) private readonly trpcService: TrpcService,
    @inject({{ serviceNameClass }}Service) private readonly {{ serviceName }}Service: {{ serviceNameClass }}Service
  ) {}

  private _router() {
    const { publicProcedure, ee } = this.trpcService
    return {
      trpc: {}
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
