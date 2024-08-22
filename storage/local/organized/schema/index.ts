import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";


export const messages = pgTable("messages", {
    id: text("id").unique().primaryKey(),
    conversationId: text("conversationId").notNull(),
    encryptedContent: text("encryptedContent").notNull(),
    signature: text("signature").notNull(),
    timestamp: timestamp("timestamp").notNull(),
    owner: text("owner").notNull()
})

export const conversationInvite = pgTable("conversationInvite", {
    id: text("id").unique().primaryKey(),
    encryptedConversationId: text("encryptedConversationId").notNull(),
    signature: text("signature").notNull(),
    timestamp: timestamp("timestamp").notNull(),
    from: text("from").notNull(),
    to: text("to").notNull()
})

export const primaryNodeParticipants = pgTable("primaryNodeParticipants", {
    id: text("id").unique().primaryKey(),
    address: text("address").notNull(),
    signature: text("signature").notNull(),
    timestamp: timestamp("timestamp").notNull()
})

export const authRequests = pgTable("authRequests", {
    id: text("id").unique().primaryKey(),
    fromNode: text("fromNode").notNull(),
    fromUserAddress: text("fromUserAddress").notNull(),
    generatedRandomCode: text("generatedRandomCode").notNull(),
    timestamp: timestamp("timestamp").notNull(),
    generatedAuthString: text("generatedAuthString").notNull(),
    approvalSignature: text("approvalSignature")
})