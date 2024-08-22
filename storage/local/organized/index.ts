import * as schema from './schema'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

const queryClient = postgres(process.env.LOCAL_DATABASE_URL!)

const db = drizzle(queryClient, {
    schema
})


export {
    db,
    schema
}