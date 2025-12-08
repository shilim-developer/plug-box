import z from 'zod'

export const trpcMutationListInputSchema = z.object({
  id: z.number(),
  name: z.string()
})

export type TrpcMutationListInputType = z.infer<typeof trpcMutationListInputSchema>
