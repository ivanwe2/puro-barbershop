import { drizzle } from "drizzle-orm/postgres-js";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { env } from "@/lib/env";
import pg from "postgres";
import * as schema from "./schema";

const isNeon = env.DATABASE_URL.includes("neon.tech");

const db = isNeon
  ? drizzleNeon(env.DATABASE_URL, { schema })
  : drizzle(pg(env.DATABASE_URL, { max: 10 }), { schema });

export { db };
