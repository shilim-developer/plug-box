import AppService from './modules/app.service'
import { container } from './modules/di'

container.get<AppService>(AppService).bootstrap()
