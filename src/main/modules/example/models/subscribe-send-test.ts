import z from 'zod'

export const subscribeSendInputSchema = z.object({
  id: z.number(),
  value: z.string()
})

export type SubscribeSendInputType = z.infer<typeof subscribeSendInputSchema>
