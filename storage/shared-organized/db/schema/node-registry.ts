import { boolean, date, integer, pgTable, text } from 'drizzle-orm/pg-core'


export const nodes = pgTable("nodes", {
    namespace: text("namespace").unique().primaryKey(),
    protocol_endpoint: text("protocol_endpoint").unique(),
    active: boolean("active"),
    node_id: integer("node_id").unique(),
    public_key: text("public_key").unique(),
    timestamp: date("timestamp")
})

export type NODES = typeof nodes.$inferSelect

export type NODESInsert = typeof nodes.$inferInsert