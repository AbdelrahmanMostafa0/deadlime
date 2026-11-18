import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { serverEnv } from "@/lib/env";
import * as schema from "./schema";

// neon-http: one HTTP round trip per query, no pool to manage on serverless.
// Multi-statement writes use db.batch(), which Neon runs as one transaction.
// Created lazily so `next build` never needs DATABASE_URL.
let instance: NeonHttpDatabase<typeof schema> | undefined;

export function getDb() {
  instance ??= drizzle({ client: neon(serverEnv().DATABASE_URL), schema, casing: "snake_case" });
  return instance;
}

export type DB = ReturnType<typeof getDb>;
