import { initTRPC } from '@trpc/server'
import { injectable } from 'inversify'
import { EventEmitter } from 'node:events'
import { ZodError } from 'zod'

@injectable()
export default class TrpcService {
  trpc = initTRPC.context().create({
    errorFormatter: ({ shape, error }) => ({
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null
      }
    })
  })
  createCallerFactory = this.trpc.createCallerFactory
  createRouter = this.trpc.router
  publicProcedure = this.trpc.procedure
  protectedProcedure = this.trpc.procedure.use(({ next }) => {
    return next()
  })
  mergeRouters = this.trpc.mergeRouters
  ee = new EventEmitter()
}
