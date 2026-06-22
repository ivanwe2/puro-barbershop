import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side env vars — never exposed to the browser.
   * All must be non-NEXT_PUBLIC_ prefixed.
   */
  server: {
    // Database
    DATABASE_URL: z.string().url().min(1),
    DATABASE_URL_UNPOOLED: z.string().url().min(1),

    // Auth.js
    AUTH_SECRET: z.string().min(32),
    AUTH_URL: z.string().url(),

    // Email
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().min(1),
    EMAIL_REPLY_TO: z.string().email(),
    EMAIL_TRANSPORT: z.enum(["resend", "smtp"]).default("resend"),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),

    // Rate limiting
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    RATE_LIMIT_DEV: z.enum(["on", "off"]).default("on"),

    // Cron
    CRON_SECRET: z.string().min(16),

    // Dev seed
    SEED_ADMIN_PASSWORD: z.string().min(16).optional(),

    // Node environment
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  /**
   * Client-side env vars — MUST be prefixed with NEXT_PUBLIC_.
   * These are safe to expose in the browser.
   */
  client: {
    NEXT_PUBLIC_LIGHTWIDGET_ID: z.string().optional(),
    NEXT_PUBLIC_INSTAGRAM_URL: z.string().url().optional(),
    NEXT_PUBLIC_SHOP_NAME: z.string().min(1),
    NEXT_PUBLIC_SHOP_ADDRESS: z.string().min(1),
    NEXT_PUBLIC_SHOP_PHONE: z.string().optional(),
    NEXT_PUBLIC_SHOP_EMAIL: z.string().optional(),
    NEXT_PUBLIC_SHOP_LAT: z.coerce.number(),
    NEXT_PUBLIC_SHOP_LNG: z.coerce.number(),
  },

  /**
   * Destructure process.env here.
   * Next.js cannot statically analyse dynamic env var access, so every
   * variable must be listed explicitly.
   */
  runtimeEnv: {
    DATABASE_URL: process.env["DATABASE_URL"],
    DATABASE_URL_UNPOOLED: process.env["DATABASE_URL_UNPOOLED"],
    AUTH_SECRET: process.env["AUTH_SECRET"],
    AUTH_URL: process.env["AUTH_URL"],
    RESEND_API_KEY: process.env["RESEND_API_KEY"],
    EMAIL_FROM: process.env["EMAIL_FROM"],
    EMAIL_REPLY_TO: process.env["EMAIL_REPLY_TO"],
    EMAIL_TRANSPORT: process.env["EMAIL_TRANSPORT"],
    SMTP_HOST: process.env["SMTP_HOST"],
    SMTP_PORT: process.env["SMTP_PORT"],
    UPSTASH_REDIS_REST_URL: process.env["UPSTASH_REDIS_REST_URL"],
    UPSTASH_REDIS_REST_TOKEN: process.env["UPSTASH_REDIS_REST_TOKEN"],
    RATE_LIMIT_DEV: process.env["RATE_LIMIT_DEV"],
    CRON_SECRET: process.env["CRON_SECRET"],
    SEED_ADMIN_PASSWORD: process.env["SEED_ADMIN_PASSWORD"],
    NODE_ENV: process.env["NODE_ENV"],
    NEXT_PUBLIC_LIGHTWIDGET_ID: process.env["NEXT_PUBLIC_LIGHTWIDGET_ID"],
    NEXT_PUBLIC_INSTAGRAM_URL: process.env["NEXT_PUBLIC_INSTAGRAM_URL"],
    NEXT_PUBLIC_SHOP_NAME: process.env["NEXT_PUBLIC_SHOP_NAME"],
    NEXT_PUBLIC_SHOP_ADDRESS: process.env["NEXT_PUBLIC_SHOP_ADDRESS"],
    NEXT_PUBLIC_SHOP_PHONE: process.env["NEXT_PUBLIC_SHOP_PHONE"],
    NEXT_PUBLIC_SHOP_EMAIL: process.env["NEXT_PUBLIC_SHOP_EMAIL"],
    NEXT_PUBLIC_SHOP_LAT: process.env["NEXT_PUBLIC_SHOP_LAT"],
    NEXT_PUBLIC_SHOP_LNG: process.env["NEXT_PUBLIC_SHOP_LNG"],
  },

  /**
   * Allow skipping validation in CI/test environments where all vars
   * may not be present. Set SKIP_ENV_VALIDATION=1 to bypass.
   */
  skipValidation: !!process.env["SKIP_ENV_VALIDATION"],

  /**
   * Treat empty strings as undefined — prevents accidentally committing
   * `.env.example` placeholder values as real config.
   */
  emptyStringAsUndefined: true,
});
