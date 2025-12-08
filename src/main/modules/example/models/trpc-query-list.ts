import z from 'zod'

export const trpcQueryListOutputSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    value: z.string()
  })
)

export type TrpcQueryListOutputFileType = z.infer<typeof trpcQueryListOutputSchema>
