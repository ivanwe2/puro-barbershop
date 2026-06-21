import { drizzle } from "drizzle-orm/postgres-js";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { env } from "@/lib/env";
import pg from "postgres";
import * as schema from "./schema";

const isNeon = env.DATABASE_URL.includes("neon.tech");

let db;

if (isNeon) {
  db = drizzleNeon(env.DATABASE_URL, { schema });
} else {
  const client = pg(env.DATABASE_URL, { max: 10 });
  db = drizzle(client, { schema });
}

export { db };
