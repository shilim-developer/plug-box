import { createIpcTrpcServer } from './trpc/trpc-server'
import { appRouter } from './trpc/router'

// 初始化tRPC IPC监听
async function init() {
  createIpcTrpcServer({
    createContext: () =>
      Promise.resolve({
        extensionDir: ''
      }),
    router: appRouter,
    process
  })
}
init()
