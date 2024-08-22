import { z } from "zod"
import { transformTimestampToDate } from "./utils"

export const RegisterInboxSchema = z.object({
    currentNode: z.string(),
    address: z.string(),
    publicKey: z.string(),
    signedPublicKey: z.string(),
    encryptedPrivateKey: z.string(),
    randAuthString: z.string(),
    signature: z.string(),
    timestamp: z.string().transform(transformTimestampToDate)
})

export type REGISTER_INBOX = z.infer<typeof RegisterInboxSchema>


export const ChangeActiveNodeSchema = z.object({
    node: z.string(),
    newActiveNode: z.string(),
    address: z.string(),
    randomAuth: z.string(),
    signature: z.string(),
    timestamp: z.string().transform(transformTimestampToDate)
})

export type CHANGE_ACTIVE_NODE = z.infer<typeof ChangeActiveNodeSchema>


export const InviteToConversationSchema = z.object({
    from_address: z.string(),
    to_address: z.string(),
    encryptedConversationAddress: z.string(),
    signature: z.string(),
    node: z.string(),
    toNode: z.string(),
    ack: z.string(),
    timestamp: z.string().transform(transformTimestampToDate)
})

export type INVITE_TO_CONVERSATION = z.infer<typeof InviteToConversationSchema>

export const RejectInviteToConversationSchema = z.object({
    encryptedConversationAddress: z.string(),
    signature: z.string(),
    node: z.string(),
    toNode: z.string(),
    ack: z.string(),
    timestamp: z.string().transform(transformTimestampToDate)
})

export type REJECT_INVITE_TO_CONVERSATION = z.infer<typeof RejectInviteToConversationSchema>

export const AcceptInviteToConversationSchema = z.object({
    encryptedConversationAddress: z.string(),
    signature: z.string(),
    node: z.string(),
    toNode: z.string(),
    ack: z.string(),
    timestamp: z.string().transform(transformTimestampToDate)
})

export type ACCEPT_INVITE_TO_CONVERSATION = z.infer<typeof AcceptInviteToConversationSchema>


export const ConversationMarkerSchema = z.object({
    conversationId: z.string(),
    node: z.string(),
    timestamp: z.string().transform(transformTimestampToDate),
    toNode: z.string(),
    ack: z.string()
})

export type CONVERSATION_MARKER = z.infer<typeof ConversationMarkerSchema>