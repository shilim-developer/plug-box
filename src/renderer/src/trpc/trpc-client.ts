import { createTRPCClient } from '@trpc/client'
import { ipcLink } from 'trpc-electron/renderer'

export const trpcClient = createTRPCClient<AppRouter>({
  links: [ipcLink()]
})
