import { createTRPCClient } from '@trpc/client'
import { ipcLink } from '@main/extensions/trpc/renderer/ipc-link'

export const trpcClient = createTRPCClient<AppRouter>({
  links: [ipcLink()]
})
