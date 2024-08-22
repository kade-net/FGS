import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    schema: "./db/schema/index.ts",
    out: "./db/migrations",
    dbCredentials: {
        url: process.env.ORGANIZED_PG_CONNECTION_STRING!
    }
});