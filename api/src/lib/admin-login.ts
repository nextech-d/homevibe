import { getPrisma } from "./db.js";
import { signAdminToken, verifyAdminPassword } from "./admin-jwt.js";
import { adminLoginRules, checkRateLimits } from "../../../shared/rate-limit.js";

export type AdminLoginOutcome = {
  status: 200 | 400 | 401 | 429 | 503;
  body: { success: boolean; message?: string; token?: string };
  retryAfterSeconds?: number;
};

const TOO_MANY = "Too many sign-in attempts. Please try again later.";

/**
 * The whole admin sign-in, shared by both ways in: the gateway route
 * (POST /auth/admin/login) and the standalone Vercel function that serves
 * the same path in production.
 *
 * Every attempt counts against 5 per IP per 15 minutes, before the password
 * is even looked at. The limiter fails closed:
 * if it can't reach the database, nobody signs in until it can.
 */
export async function attemptAdminLogin(
  password: unknown,
  ip: string
): Promise<AdminLoginOutcome> {
  const prisma = getPrisma();
  const limit = prisma
    ? await checkRateLimits(prisma, adminLoginRules(ip), "closed")
    : ({ allowed: false, reason: "error" } as const);

  if (!limit.allowed) {
    if (limit.reason === "limited") {
      return {
        status: 429,
        body: { success: false, message: TOO_MANY },
        retryAfterSeconds: limit.retryAfterSeconds,
      };
    }
    return {
      status: 503,
      body: { success: false, message: "Sign-in is temporarily unavailable. Please try again shortly." },
    };
  }

  if (typeof password !== "string" || !verifyAdminPassword(password)) {
    return { status: 401, body: { success: false, message: "Incorrect password." } };
  }

  const token = await signAdminToken();
  if (!token) {
    return { status: 503, body: { success: false, message: "Admin auth is not configured." } };
  }
  return { status: 200, body: { success: true, token } };
}
