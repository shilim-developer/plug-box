import { inject, injectable } from 'inversify'
import TrpcService from '../trpc/trpc.service'

@injectable()
export default class {{ serviceNameClass }}Service {
  constructor(@inject(TrpcService) private readonly trpcService: TrpcService) {}
}
