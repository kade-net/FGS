import { z } from 'zod'
import { formatAddressValue, padAddress } from './utils';
/**
 * USER EVENT TYPES
 */

export const MESSAGE_EVENT_SCHEMA = z.object({
    to: z.string().transform(formatAddressValue).transform(padAddress),
    // from: z.string().transform(formatAddressValue).transform(padAddress),
    encryptedContent: z.string(),
    timestamp: z.number(),
    signature: z.string(),
    conversationId: z.string()
})

export type MESSAGE_EVENT = z.infer<typeof MESSAGE_EVENT_SCHEMA>

export const INVITE_EVENT_SCHEMA = z.object({
    to: z.string().transform(formatAddressValue).transform(padAddress),
    from: z.string().transform(formatAddressValue).transform(padAddress),
    encryptedConversationId: z.string(),
    timestamp: z.number(),
    signature: z.string()
})

export type INVITE_EVENT = z.infer<typeof INVITE_EVENT_SCHEMA>

export const ACCEPT_INVITE_EVENT_SCHEMA = z.object({
    to: z.string().transform(formatAddressValue).transform(padAddress),
    encryptedConversationId: z.string(),
    timestamp: z.number(),
    signature: z.string()
})

export type ACCEPT_INVITE_EVENT = z.infer<typeof ACCEPT_INVITE_EVENT_SCHEMA>

export const REJECT_INVITE_EVENT_SCHEMA = z.object({
    to: z.string().transform(formatAddressValue).transform(padAddress),
    encryptedConversationId: z.string(),
    timestamp: z.number(),
    signature: z.string()
})

export type REJECT_INVITE_EVENT = z.infer<typeof REJECT_INVITE_EVENT_SCHEMA>


export const CHANGE_ACTIVE_NODE_EVENT_SCHEMA = z.object({
    address: z.string().transform(formatAddressValue).transform(padAddress),
    destinationNode: z.string().transform(formatAddressValue).transform(padAddress),
    timestamp: z.number(),
    signature: z.string()
})

export type CHANGE_ACTIVE_NODE_EVENT = z.infer<typeof CHANGE_ACTIVE_NODE_EVENT_SCHEMA>

