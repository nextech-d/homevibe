/**
 * Customer session tokens, shared by the storefront and the API.
 *
 * The browser (or API client) holds a random token; the database holds only
 * its SHA-256 hash, as sessions.id. Anyone who reads the sessions table - a
 * leaked DATABASE_URL, a backup - gets hashes, which open nothing.
 *
 * Only Node's own crypto module is imported, which both runtimes have.
 */
import { createHash, randomBytes } from "node:crypto";

/** sessions.id for a token: lowercase hex SHA-256 of the token's UTF-8 bytes. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** A new session: 32 random bytes for the cookie, and the hash to store. */
export function newSessionToken(): { token: string; id: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, id: hashSessionToken(token) };
}

/**
 * A pre-migration session id: a Prisma cuid (a "c" and 24 more characters),
 * stored as the session id itself. Until the hash-session-ids migration has
 * run, such a cookie is looked up as-is so nobody is signed out by the
 * deploy; afterwards its hash is what's stored, and the hashed lookup finds
 * it. A 64-character hash - what a leaked table would give someone - never
 * matches this shape, so it can't be replayed as a cookie.
 */
export function isLegacySessionId(token: string): boolean {
  return /^c[a-z0-9]{24}$/.test(token);
}

/** The ids a token could be stored under: its hash, and itself if it's a legacy id. */
export function sessionIdsForToken(token: string): string[] {
  const ids = [hashSessionToken(token)];
  if (isLegacySessionId(token)) ids.push(token);
  return ids;
}
