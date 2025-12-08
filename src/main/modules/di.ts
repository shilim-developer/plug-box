import { Container } from 'inversify'
import { windowModule } from './window/window.module'
import { appModule } from './app.module'
import { trpcModule } from './trpc/trpc.module'
import { exampleModule } from './example/example.module'
import { pluginModule } from './plugin/plugin.module'

const modules = [appModule, windowModule, trpcModule, exampleModule, pluginModule]
const container = new Container()
container.loadSync(...modules)

export { container }
