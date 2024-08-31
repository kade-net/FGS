import {pgEnum} from "drizzle-orm/pg-core";

export const ACTIVITY_TYPE_ENUM = pgEnum("activity_type", ['invite', 'accept', 'reject', 'message', 'delivery'])

export const ORIGINATOR_ENUM = pgEnum("originator", ['user','node'])