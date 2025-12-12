import { initTRPC } from '@trpc/server'
import { join } from 'path'
import { z } from 'zod' // 参数校验schema
import { loadJson5 } from '../../utils/json-util'
import { Plugin } from '@common/types/plugin'
import { systemPluginList } from '../plugin-data/system-plugin'
import { marketplacePluginList } from '../plugin-data/market-plugin'
import { createIpcTrpcClient } from './trpc-client'
import { AppRouter as ElectronExposeAppRouter } from '@main/electron-expose/router'

const plugins: Map<string, any> = new Map()
const t = initTRPC.context().create()

let installedPlugins: Plugin[] = []

const mainTrpcClient = createIpcTrpcClient<ElectronExposeAppRouter>(process)

let config: {
  extensionsDir: string
} = {}

export const appRouter = t.router({
  initConfig: t.procedure.input(z.any()).mutation(({ input }) => {
    config = input
  }),
  getMarketplacePluginList: t.procedure.query(async () => {
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
    .input(z.object({ id: z.string(), backend: z.string() }))
    .mutation(async ({ input }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Module = await require(
        input.backend.includes(':')
          ? input.backend
          : join(config.extensionsDir, 'node_modules', input.id, input.backend)
      )
      console.log('Module:', Module)
      const Invoke = new Proxy(
        {},
        {
          /**
           * 拦截属性访问（如 Invoke.xxx）
           * @param {Object} target - 代理的目标对象（空对象）
           * @param {string} prop - 访问的属性名（如 'xxx'）
           * @param {Object} receiver - 代理对象本身
           * @returns {Function|any} 执行 invoke 并返回结果（或返回函数延迟执行）
           */
          get(target, prop, receiver) {
            // 特殊处理：如果访问 toString/valueOf 等内置属性，返回默认值
            if (['toString', 'valueOf', 'constructor'].includes(prop as string)) {
              return Reflect.get(target, prop, receiver)
            }
            return (extraOptions = {}) => {
              console.log('调用')
              return mainTrpcClient.invokePluginMethod.mutate({
                id: input.id,
                methodName: prop as string,
                params: extraOptions
              })
            }
          }
        }
      )
      plugins.set(input.id, new Module.default(Invoke))
      console.log(plugins.get(input.id))

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
