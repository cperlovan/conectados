import { z } from 'zod'

export const CondominiumSelectorSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.enum(['active', 'inactive', 'pending']),
  logo: z.string().nullable().optional()
})

export type CondominiumSelector = z.infer<typeof CondominiumSelectorSchema>

export const CondominiumSelectorResponseSchema = z.array(CondominiumSelectorSchema) 