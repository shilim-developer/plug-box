import { ElectronExpose } from './expose'
import { initTRPC } from '@trpc/server'
import PluginService from '@main/modules/plugin/plugin.service'
import z from 'zod'

const t = initTRPC.context().create()

export function initElectronExposeRouter({ pluginService }: { pluginService: PluginService }) {
  const electronExpose = new ElectronExpose(pluginService)
  return t.router({
    emitView: t.procedure
      .input(z.object({ id: z.string(), channel: z.string(), data: z.any() }))
      .mutation(async ({ input }) => {
        return pluginService.pluginMap
          .get(input.id)
          ?.view.emit(`${input.id}:${input.channel}`, input.data)
      }),
    invokeSystemMethod: t.procedure
      .input(z.object({ id: z.string(), methodName: z.string(), params: z.any() }))
      .mutation(async ({ input }) => {
        return electronExpose[input.methodName](input.params)
      })
  })
}

// 导出路由类型（主进程客户端用）
export type AppRouter = ReturnType<typeof initElectronExposeRouter>
