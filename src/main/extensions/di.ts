import { Container } from 'inversify'
import { appModule } from './app.module'
import { trpcModule } from './trpc/trpc.module'
import { extensionModule } from './extension/extension.module'
import { settingsModule } from './settings/settings.module'

const modules = [appModule, trpcModule, extensionModule, settingsModule]
const container = new Container()
container.loadSync(...modules)

export { container }
