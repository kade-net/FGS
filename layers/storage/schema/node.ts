import {json, pgEnum, pgTable, text, timestamp} from "drizzle-orm/pg-core";
import {ACTIVITY_TYPE_ENUM, ORIGINATOR_ENUM} from "./enums";

export const nodeInbox = pgTable("nodeInbox", {
    id: text("id").unique().primaryKey(),
    activity_type: ACTIVITY_TYPE_ENUM('activity_type').notNull(),
    activity: json("activity").notNull(),
    recorded: timestamp("recorded").defaultNow(),
    signature: text("signature").notNull(),
    originator_type: ORIGINATOR_ENUM('originator_type').notNull(),
    originator: text("originator").notNull()
})

export type NODE_INBOX = typeof nodeInbox.$inferSelect

export const nodeOutbox = pgTable("nodeOutbox", {
    id: text("id").unique().primaryKey(),
    activity_type: ACTIVITY_TYPE_ENUM('activity_type').notNull(),
    activity: json("activity").notNull(),
    recorded: timestamp("recorded").defaultNow(),
    signature: text("signature").notNull(),
    originator_type: ORIGINATOR_ENUM('originator_type').notNull(),
    originator: text("originator").notNull(),
})

export type NODE_OUTBOX = typeof nodeOutbox.$inferSelect

