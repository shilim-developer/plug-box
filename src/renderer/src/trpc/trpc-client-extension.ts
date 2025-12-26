import { createTRPCClient } from '@trpc/client'
import { ipcLink } from 'trpc-electron/renderer'
import { AppRouter } from '@main/modules/app.router'

export const trpcClient = createTRPCClient<AppRouter>({
  links: [ipcLink()]
})
