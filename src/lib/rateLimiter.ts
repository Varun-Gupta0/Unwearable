// src/lib/rateLimiter.ts – simple in-memory rate limiter
import { NextRequest } from "next/server";

type RateConfig = {
  limit: number; // max requests
  windowMs: number; // time window in ms
};

// Map of identifier (IP) -> { count, reset }
const ipMap = new Map<string, { count: number; reset: number }>();

/**
 * Apply rate limiting based on request IP.
 * Throws an error with status 429 when limit exceeded.
 */
export function enforceRateLimit(
  req: NextRequest,
  config: RateConfig
): void {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now > entry.reset) {
    ipMap.set(ip, { count: 1, reset: now + config.windowMs });
    return;
  }
  if (entry.count >= config.limit) {
    // Exceeded limit
    const retryAfter = Math.ceil((entry.reset - now) / 1000);
    const err = new Error("Rate limit exceeded");
    // Attach status and retry info for caller
    (err as any).status = 429;
    (err as any).retryAfter = retryAfter;
    throw err;
  }
  entry.count += 1;
}

export const ORDER_RATE_LIMIT: RateConfig = { limit: 10, windowMs: 60_000 }; // 10 req/min per IP
export const SUBMIT_RATE_LIMIT: RateConfig = { limit: 20, windowMs: 60_000 }; // 20 req/min per IP
