import { defineConfig } from "drizzle-kit";

// Migrations use the direct (unpooled) Neon connection.
// Run with the variables exported in your shell, e.g. via `vercel env pull` + your own loader.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: { url: url ?? "" },
  strict: true,
});
