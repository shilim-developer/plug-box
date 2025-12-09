import { initTRPC } from '@trpc/server'
import { join } from 'path'
import { z } from 'zod' // 参数校验schema
import { loadJson5 } from '../../utils/json-util'
import { Plugin } from '@common/types/plugin'
import { systemPluginList } from '../plugin-data/system-plugin'
import { marketplacePluginList } from '../plugin-data/market-plugin'

const plugins: Map<string, any> = new Map()
const t = initTRPC.context().create()

let installedPlugins: Plugin[] = []

export const appRouter = t.router({
  getMarketplacePluginList: t.procedure.query(() => {
    return marketplacePluginList
  }),
  getInstalledPluginList: t.procedure
    .input(
      z.object({
        pluginsDir: z.string()
      })
    )
    .query(async ({ input }) => {
      installedPlugins = [...systemPluginList]
      const pack = await loadJson5(join(input.pluginsDir, './package.json'))
      const dependencies = pack.dependencies
      for (const dep in dependencies) {
        const plugJson = await loadJson5(
          join(input.pluginsDir, 'node_modules', dep, './plugin.json')
        )
        installedPlugins.push(plugJson)
      }
      console.log('plugins:', plugins)
      return installedPlugins
    }),
  getPlugin: t.procedure.input(z.object({ id: z.string() })).query(({ input }) => {
    return installedPlugins.find((item) => item.id === input.id)
  }),
  registerPlugin: t.procedure
    .input(z.object({ id: z.string(), root: z.string(), backend: z.string() }))
    .mutation(async ({ input }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Module = await require(join(input.root, input.backend))
      console.log('Module:', Module)
      plugins.set(input.id, new Module.default())
      // plugins.set(input.id, new Module())
    }),
  unInstallPlugin: t.procedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    plugins.delete(input.id)
    const index = installedPlugins.findIndex((item) => item.id === input.id)
    installedPlugins.splice(index, 1)
  }),
  invokePluginMethod: t.procedure
    .input(z.object({ id: z.string(), methodName: z.string(), params: z.any() }))
    .mutation(async ({ input }) => {
      const plugin = plugins.get(input.id)
      if (plugin) {
        return await plugin[input.methodName](input.params)
      }
    })
})

// 导出路由类型（主进程客户端用）
export type AppRouter = typeof appRouter
