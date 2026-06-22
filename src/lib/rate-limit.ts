import { env } from "@/lib/env";
import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimiter {
  limit(key: string): Promise<{ success: boolean; remaining: number }>;
}

export class UpstashRateLimiter implements RateLimiter {
  private ratelimit: Ratelimit;

  constructor(requests: number, window: Duration) {
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    });
    this.ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(requests, window),
    });
  }

  async limit(key: string): Promise<{ success: boolean; remaining: number }> {
    const res = await this.ratelimit.limit(key);
    return { success: res.success, remaining: res.remaining };
  }
}

export class LocalRateLimiter implements RateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly requests: number,
    private readonly windowMs: number,
  ) {}

  async limit(key: string): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { success: true, remaining: this.requests - 1 };
    }

    entry.count++;

    if (entry.count > this.requests) {
      return { success: false, remaining: 0 };
    }

    return { success: true, remaining: this.requests - entry.count };
  }
}

export class NoOpRateLimiter implements RateLimiter {
  async limit(_key: string): Promise<{ success: boolean; remaining: number }> {
    return { success: true, remaining: Infinity };
  }
}

function parseWindowMs(window: string): number | null {
  const match = window.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const multiplier = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return Number(match[1]) * multiplier[match[2] as keyof typeof multiplier];
}

function createLimiter(requests: number, window: string): RateLimiter {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return new UpstashRateLimiter(requests, window as Duration);
  }

  if (env.NODE_ENV === "development" && env.RATE_LIMIT_DEV === "off") {
    return new NoOpRateLimiter();
  }

  const windowMs = parseWindowMs(window);
  if (windowMs === null) {
    throw new Error(`Invalid rate limit window: ${window}`);
  }

  return new LocalRateLimiter(requests, windowMs);
}

export const rateLimiters = {
  ip: createLimiter(5, "10m"),
  email: createLimiter(3, "24h"),
  phone: createLimiter(3, "24h"),
};
