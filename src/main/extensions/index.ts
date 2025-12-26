// import { createIpcTrpcServer } from './trpc/trpc-server'
// import { appRouter } from './trpc/router'

import AppService from './app.service'
import { container } from './di'

// // 初始化tRPC IPC监听
// async function init() {
//   createIpcTrpcServer({
//     createContext: () =>
//       Promise.resolve({
//         extensionDir: ''
//       }),
//     router: appRouter,
//     process
//   })
// }
// init()

container.get<AppService>(AppService).bootstrap()
