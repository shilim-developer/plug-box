import type { AnyRouter } from '@trpc/server'
import { TRPCRequestMessage, TRPCResponseMessage } from '@trpc/server/rpc'
import { ChildProcess } from 'child_process'

// 定义IPC消息类型（tRPC请求/响应）
export type IpcTrpcMessage =
  | { type: 'request'; req: TRPCRequestMessage }
  | { type: 'response'; id: string; res: TRPCResponseMessage<AnyRouter> }

/**
 * 主进程 -> 子进程：发送tRPC请求并等待响应
 * @param childProcess fork子进程实例
 * @param req tRPC请求消息
 * @returns tRPC响应
 */
export async function sendTrpcRequest<Router extends AnyRouter>(
  childProcess: ChildProcess,
  req: TRPCRequestMessage
): Promise<TRPCResponseMessage<Router>> {
  return new Promise((resolve, reject) => {
    // 监听子进程响应
    const onMessage = (message: IpcTrpcMessage) => {
      if (message.type === 'response' && message.id === req.id) {
        childProcess.off('message', onMessage) // 移除监听，避免内存泄漏
        resolve(message.res)
      }
    }

    childProcess.on('message', onMessage)

    // 发送tRPC请求
    childProcess.send({ type: 'request', req } as IpcTrpcMessage)

    // 超时处理
    setTimeout(() => {
      childProcess.off('message', onMessage)
      reject(new Error(`tRPC请求 ${req.id} 超时`))
    }, 5000)
  })
}

/**
 * 子进程：监听主进程tRPC请求并处理
 * @param router tRPC路由实例
 * @param createContext tRPC上下文创建函数（可选）
 */
export async function listenTrpcRequests<Router extends AnyRouter>(
  router: Router,
  createContext?: () => Promise<unknown>
) {
  // tRPC创建请求处理器
  const caller = router.createCaller(await (createContext?.() || {}))

  // 监听主进程消息
  process.on('message', async (message: IpcTrpcMessage) => {
    if (message.type !== 'request') return

    const { req } = message
    try {
      // 执行tRPC路由方法
      const result = await caller[req.method](...req.args)

      // 发送成功响应
      process.send!({
        type: 'response',
        id: req.id,
        res: { id: req.id, result: { data: result } }
      } as IpcTrpcMessage)
    } catch (error) {
      // 发送错误响应（tRPC标准化错误）
      process.send!({
        type: 'response',
        id: req.id,
        res: {
          id: req.id,
          error: {
            message: (error as Error).message,
            code: 'INTERNAL_SERVER_ERROR',
            stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
          }
        }
      } as IpcTrpcMessage)
    }
  })
}
