export const ADMIN_COOKIE = "homevibe_admin";

/** Pre-rename cookie name. Read-only: kept so existing admin sessions survive. */
export const LEGACY_ADMIN_COOKIE = "patril_admin";

export const ADMIN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type CookieReader = { get(name: string): { value: string } | undefined };

/** Current admin cookie, falling back to the pre-rename name. */
export function readAdminCookie(store: CookieReader): string | undefined {
  return store.get(ADMIN_COOKIE)?.value ?? store.get(LEGACY_ADMIN_COOKIE)?.value;
}

export async function getAdminToken(): Promise<string | null> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;

  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
