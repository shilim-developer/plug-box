// export interface ExtensionMessage<T> {
//   type: 'main' | 'plugin'
//   id: string
//   methodName: string
//   params: any
// }

import { createIpcTrpcServer } from './trpc/trpc-server'
import { appRouter } from './trpc/router'

// const plugins: Map<string, any> = new Map()
// process.on('message', async (message: ExtensionMessage) => {
//   // console.log('message:', message)
//   if (message.type === 'main') {
//     switch (message.methodName) {
//       case 'registerPlugin':
//         {
//           const Module = await require(message.params.back)
//           plugins.set(message.id, new Module.default())
//           console.log('Module:', plugins)
//         }
//         break
//       default:
//         break
//     }
//   } else if (message.type === 'plugin') {
//     const plugin = plugins.get(message.id)
//     if (plugin) {
//       process.send({
//         type: 'plugin',
//         methodName: message.methodName,
//         id: message.id,
//         response: plugin[message.methodName](...message.params)
//       })
//     }
//   }
// })

// 初始化tRPC IPC监听
async function init() {
  createIpcTrpcServer({
    createContext: () => Promise.resolve({}),
    router: appRouter,
    process
  })
}

init()
