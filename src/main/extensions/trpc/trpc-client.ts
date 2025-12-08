import { createTRPCClient, TRPCClientError, TRPCLink, type Operation } from '@trpc/client'
import type { ChildProcess } from 'child_process'
import { AnyTRPCRouter, inferRouterContext, TRPCProcedureType } from '@trpc/server'
import { TRPCResponseMessage } from '@trpc/server/rpc'
import { AppRouter } from './router'
import { observable, Observer } from '@trpc/server/observable'
import { transformResult } from '@trpc/server/unstable-core-do-not-import'
import { getTransformer } from '@trpc/client/unstable-internals'
import { IPCLinkOptions } from 'trpc-electron/renderer'

type IPCCallbackResult<TRouter extends AnyTRPCRouter = AnyTRPCRouter> = TRPCResponseMessage<
  unknown,
  inferRouterContext<TRouter>
>

type IPCCallbacks<TRouter extends AnyTRPCRouter = AnyTRPCRouter> = Observer<
  IPCCallbackResult<TRouter>,
  TRPCClientError<TRouter>
>

type IPCRequest = {
  type: TRPCProcedureType
  callbacks: IPCCallbacks
  op: Operation
}

class IPCClient {
  #pendingRequests = new Map<string | number, IPCRequest>()
  #childProcess: ChildProcess
  constructor(childProcess: ChildProcess) {
    this.#childProcess = childProcess
    this.#childProcess.on('message', (response: TRPCResponseMessage) => {
      this.#handleResponse(response)
    })
  }

  #handleResponse(response: TRPCResponseMessage) {
    const request = response.id && this.#pendingRequests.get(response.id)
    if (!request) {
      return
    }

    request.callbacks.next(response)

    if ('result' in response && response.result.type === 'stopped') {
      request.callbacks.complete()
    }
  }

  request(op: Operation, callbacks: IPCCallbacks) {
    const { type, id } = op
    this.#pendingRequests.set(id, {
      type,
      callbacks,
      op
    })
    this.#childProcess.send({ method: 'request', operation: op })
    return () => {
      const callbacks = this.#pendingRequests.get(id)?.callbacks
      this.#pendingRequests.delete(id)
      callbacks?.complete()

      if (type === 'subscription') {
        this.#childProcess.send({
          id,
          method: 'subscription.stop'
        })
      }
    }
  }
}

function ipcLink<TRouter extends AnyTRPCRouter>(
  childProcess: ChildProcess,
  opts?: IPCLinkOptions<TRouter>
): TRPCLink<TRouter> {
  return () => {
    const client = new IPCClient(childProcess)
    const transformer = getTransformer(opts?.transformer)

    return ({ op }) => {
      return observable((observer) => {
        op.input = transformer.input.serialize(op.input)

        const unsubscribe = client.request(op, {
          error(err) {
            observer.error(err as TRPCClientError<any>)
            unsubscribe()
          },
          complete() {
            observer.complete()
          },
          next(response) {
            const transformed = transformResult(response, transformer.output)
            if (!transformed.ok) {
              observer.error(TRPCClientError.from(transformed.error))
              return
            }
            observer.next({ result: transformed.result })
            if (op.type !== 'subscription') {
              unsubscribe()
              observer.complete()
            }
          }
        })

        return () => {
          unsubscribe()
        }
      })
    }
  }
}

export function createIpcTrpcClient(childProcess: ChildProcess) {
  return createTRPCClient<AppRouter>({
    links: [ipcLink(childProcess)]
  })
}
