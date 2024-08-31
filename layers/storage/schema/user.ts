import {json, pgTable, text, timestamp} from "drizzle-orm/pg-core";
import {ACTIVITY_TYPE_ENUM} from "./enums";


export const userInbox = pgTable('userInbox', {
    id: text("id").unique().primaryKey(),
    activity_type: ACTIVITY_TYPE_ENUM('activity_type').notNull(),
    activity: json("activity").notNull(),
    recorded: timestamp("recorded").defaultNow(),
    signature: text("signature").notNull(),
})

export type USER_INBOX = typeof userInbox.$inferSelect

export const userOutbox = pgTable('userOutbox', {
    id: text("id").unique().primaryKey(),
    activity_type: ACTIVITY_TYPE_ENUM('activity_type').notNull(),
    activity: json("activity").notNull(),
    recorded: timestamp("recorded").defaultNow(),
    signature: text("signature").notNull(),
})

export type USER_OUTBOX = typeof userOutbox.$inferSelect