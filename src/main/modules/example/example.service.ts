import { inject, injectable } from 'inversify'
import { TrpcMutationListInputType } from './models/trpc-mutation-list'
import { SubscribeSendInputType } from './models/subscribe-send-test'
import TrpcService from '../trpc/trpc.service'
import { subscribeTest } from './example.router'
import { getInstalledApps } from 'get-installed-apps'
import { exec } from 'child_process'

@injectable()
export default class ExampleService {
  constructor(@inject(TrpcService) private readonly trpcService: TrpcService) {}

  list = [
    {
      id: 1,
      name: 'hello',
      value: 'word'
    }
  ]
  async getInstalledApps() {
    return (await getInstalledApps()) as any[]
  }

  execExe(path: string) {
    exec(path)
  }

  openJson() {
    return true
  }

  trpcMutationList(input: TrpcMutationListInputType): boolean {
    const index = this.list.findIndex((item) => item.id === input.id)
    this.list[index].name = input.name
    return true
  }

  trpcSubscribeSend(input: SubscribeSendInputType): boolean {
    const index = this.list.findIndex((item) => item.id === input.id)
    this.list[index].value = input.value
    this.trpcService.ee.emit(subscribeTest, input)
    return true
  }
}
