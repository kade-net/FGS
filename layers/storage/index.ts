import 'dotenv/config'
import postgres from "postgres";
import {drizzle, PostgresJsDatabase} from "drizzle-orm/postgres-js";
import * as _schema from "./schema";

const schema = _schema

const queryClient = postgres(process.env.PG_CONNECTION_STRING!)

const db: PostgresJsDatabase<typeof schema> = drizzle(queryClient, {
    schema
})

export {schema}
export default db