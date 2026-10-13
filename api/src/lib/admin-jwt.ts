import { createHash, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

const ADMIN_ISSUER = "homevibe-admin";
const ADMIN_AUDIENCE = "homevibe-api";

/**
 * Pre-rename issuer/audience. Accepted on verify only, so tokens minted
 * before the rename stay valid until they expire (7d) and nobody is
 * signed out. Drop these once that window has passed.
 */
const LEGACY_ADMIN_ISSUER = "patril-admin";
const LEGACY_ADMIN_AUDIENCE = "patril-api";

/**
 * Refuse to run without a dedicated signing secret. There used to be a
 * fallback to ADMIN_PASSWORD, which meant one leaked token was enough to
 * brute-force the admin password offline. Called where the API starts -
 * createApp() and the standalone login/me functions - so a missing secret
 * stops the deployment at once rather than surfacing as failed logins.
 */
export function assertAdminJwtSecret(): void {
  if (!process.env.ADMIN_JWT_SECRET?.trim()) {
    throw new Error(
      "ADMIN_JWT_SECRET is not set. Set a long random value; admin tokens are no longer signed with ADMIN_PASSWORD."
    );
  }
}

function getSecret(): Uint8Array | null {
  const secret = process.env.ADMIN_JWT_SECRET?.trim();
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(): Promise<string | null> {
  const secret = getSecret();
  if (!secret || !process.env.ADMIN_PASSWORD) return null;

  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ADMIN_ISSUER)
    .setAudience(ADMIN_AUDIENCE)
    // 12 hours: a working day. A stolen token stops working by the next
    // morning instead of lasting a week.
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: [ADMIN_ISSUER, LEGACY_ADMIN_ISSUER],
      audience: [ADMIN_AUDIENCE, LEGACY_ADMIN_AUDIENCE],
    });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Constant-time: both sides are hashed first, so timingSafeEqual always
 * compares 32 bytes and neither the length of the password nor how much of
 * it matched leaks through response times.
 */
export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(password), digest(expected));
}
