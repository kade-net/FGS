import {z} from "zod";


export const invitation = z.object({
    id: z.string(),
    to: z.string(),
    from: z.string(),
    type: z.enum(['invitation']),
    published: z.number().default(Date.now()),
    encrypted_conversation_id: z.string()
})

export type INVITATION = z.infer<typeof invitation>

export const accept = z.object({
    id: z.string(),
    to: z.string(),
    from: z.string(),
    invitation: z.string(),
    published: z.string(),
})

export type ACCEPT = z.infer<typeof accept>

export const reject = z.object({
    id: z.string(),
    to: z.string(),
    from: z.string(),
    invitation: z.string(),
    published: z.string(),
})

export type REJECT = z.infer<typeof reject>

export const message = z.object({
    id: z.string(),
    conversation_id: z.string(),
    encrypted_content: z.string(),
    published: z.number(),
    nodes: z.array(z.string()),
})

export type MESSAGE = z.infer<typeof message>

export type SIGNED_ACTIVITY<T extends Record<string, any>> = {
    type: 'user' | 'node',
    identity: string,
    activity: T
    signature: string
}

export type DELIVERY_ACTIVITY<T extends Record<string, any>> = {
    type: 'invite' | 'accept' | 'reject' | 'message'
    activity: SIGNED_ACTIVITY<T>
    published: number
    signature: string
}