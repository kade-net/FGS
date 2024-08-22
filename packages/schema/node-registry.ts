import z from 'zod'
import { transformTimestampToDate } from './utils'

export const NodeUpdateSchema = z.object({
    namespace: z.string(),
    protocol_endpoint: z.string(),
    active: z.boolean(),
    node_id: z.string().transform(p => parseInt(p)),
    timestamp: z.string().transform(transformTimestampToDate),
    update_type: z.enum(['create', 'update']),
    public_key: z.string()
})

export type NODE_UPDATE = z.infer<typeof NodeUpdateSchema>

