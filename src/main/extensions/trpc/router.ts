import { initTRPC } from '@trpc/server'
import { join } from 'path'
import { z } from 'zod' // 参数校验schema

const plugins: Map<string, any> = new Map()
const t = initTRPC.create()

const pluginsList = [
  {
    id: 'marketplace',
    version: '1.0.0',
    pluginName: '插件市场',
    description: '插件市场',
    view: process.env['ELECTRON_RENDERER_URL'] + '#/blank/marketplace',
    backend: './dist/plugin/index.js',
    root: './dist/plugin',
    isSystem: true
  },
  {
    id: 'json-plugin',
    version: '1.0.0',
    pluginName: 'JSON',
    description: 'json格式化工具',
    view: 'http://localhost:5173',
    // view: './dist/web/index.html',
    backend: './dist/plugin/index.js',
    root: 'D:\\git\\json-plugin'
  }
]
export const appRouter = t.router({
  getPlugins: t.procedure.query(() => {
    return pluginsList
  }),
  getPlugin: t.procedure.input(z.object({ id: z.string() })).query(({ input }) => {
    return pluginsList.find((item) => item.id === input.id)
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
