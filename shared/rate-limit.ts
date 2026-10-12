/**
 * Fixed-window rate limiting, backed by Postgres.
 *
 * Shared by the API and the storefront, so it lives in shared/ at the repo
 * root - the one place both Vercel builds can see (the storefront's
 * .vercelignore drops api/). It has no imports of its own and takes the database
 * client as an argument - each side passes its own Prisma client. Counters
 * live in the rate_limits table, never in memory: Vercel runs many
 * instances, and an in-process counter would only ever see its own share.
 *
 * Each hit is one atomic INSERT ... ON CONFLICT DO UPDATE ... RETURNING, so
 * concurrent requests can't both read "4" and both pass a limit of 5.
 */

/** The one Prisma method this needs - satisfied by either app's client. */
export type RateLimitDb = {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
};

export type RateLimitRule = {
  /** Distinguishes counters, e.g. "admin-login:ip". */
  name: string;
  /** What is being counted, e.g. the client IP; "" for a global rule. */
  subject: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: "limited"; retryAfterSeconds: number }
  | { allowed: false; reason: "error" };

/**
 * What to do when the counter itself can't be reached: "closed" refuses the
 * request (admin login - better locked out for a minute than brute-forceable),
 * "open" lets it through (order lookup - a database hiccup shouldn't stop a
 * customer seeing their order). Either way the error is logged.
 */
export type RateLimitFailMode = "closed" | "open";

/** Delete windows older than this, now and then, so the table stays small. */
const CLEANUP_AFTER_MS = 24 * 60 * 60 * 1000;
const CLEANUP_PROBABILITY = 0.01;

/**
 * Counts this request against every rule and says whether it may proceed.
 * All rules are counted even when an earlier one is already exceeded, so a
 * blocked caller still uses up its own allowance and the global one.
 */
export async function checkRateLimits(
  db: RateLimitDb,
  rules: RateLimitRule[],
  failMode: RateLimitFailMode,
  now: Date = new Date()
): Promise<RateLimitResult> {
  try {
    let retryAfterSeconds = 0;

    for (const rule of rules) {
      const windowStartMs = Math.floor(now.getTime() / rule.windowMs) * rule.windowMs;
      const key = rule.subject ? `${rule.name}:${rule.subject}` : rule.name;

      const rows = await db.$queryRawUnsafe<{ count: number }[]>(
        `INSERT INTO "rate_limits" ("key", "window_start", "count")
         VALUES ($1, $2, 1)
         ON CONFLICT ("key", "window_start")
         DO UPDATE SET "count" = "rate_limits"."count" + 1
         RETURNING "count"`,
        key,
        new Date(windowStartMs)
      );

      const count = Number(rows[0]?.count ?? 0);
      if (count > rule.limit) {
        const secondsLeft = Math.ceil((windowStartMs + rule.windowMs - now.getTime()) / 1000);
        retryAfterSeconds = Math.max(retryAfterSeconds, secondsLeft);
      }
    }

    if (Math.random() < CLEANUP_PROBABILITY) {
      void db
        .$queryRawUnsafe(
          `DELETE FROM "rate_limits" WHERE "window_start" < $1`,
          new Date(now.getTime() - CLEANUP_AFTER_MS)
        )
        .catch(() => {});
    }

    return retryAfterSeconds > 0
      ? { allowed: false, reason: "limited", retryAfterSeconds }
      : { allowed: true };
  } catch (error) {
    console.error(
      `Rate limiter unavailable (${rules.map((r) => r.name).join(", ")}), failing ${failMode}:`,
      error instanceof Error ? error.message : error
    );
    return failMode === "open" ? { allowed: true } : { allowed: false, reason: "error" };
  }
}

/**
 * The caller's IP. On Vercel, x-real-ip and the first x-forwarded-for entry
 * are set by the platform from the actual connection, not trusted from the
 * client. Anything else (local development) counts as "unknown".
 */
export function clientIp(getHeader: (name: string) => string | null | undefined): string {
  const realIp = getHeader("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = getHeader("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

/** Rules for the public order lookup: 10 per IP per 15 minutes. */
export function orderLookupRules(ip: string): RateLimitRule[] {
  return [{ name: "order-lookup:ip", subject: ip, limit: 10, windowMs: 15 * 60 * 1000 }];
}

/** Rules for admin login: 5 per IP per 15 minutes, 50 per hour overall. */
export function adminLoginRules(ip: string): RateLimitRule[] {
  return [
    { name: "admin-login:ip", subject: ip, limit: 5, windowMs: 15 * 60 * 1000 },
    { name: "admin-login:global", subject: "", limit: 50, windowMs: 60 * 60 * 1000 },
  ];
}
