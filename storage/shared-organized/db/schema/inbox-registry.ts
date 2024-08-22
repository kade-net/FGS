import { date, pgTable, text } from "drizzle-orm/pg-core";
import { nodes } from "./node-registry";

export const inbox = pgTable("inbox", {
    address: text("address").unique().primaryKey(),
    currentNode: text("currentNode").references(() => nodes.namespace),
    publicKey: text("publicKey").unique(),
    signedPublicKey: text("signedPublicKey").unique(),
    encryptedPrivateKey: text("encryptedPrivateKey").unique(),
    randAuthString: text("randAuthString").unique(),
    signature: text("signature").unique(),
    timestamp: date("timestamp")
})

export type INBOX = typeof inbox.$inferSelect

export type INBOXInsert = typeof inbox.$inferInsert

