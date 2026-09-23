export const USER_SESSION_COOKIE = "homevibe_session";

/** Pre-rename cookie name. Read-only: kept so existing sessions survive. */
export const LEGACY_USER_SESSION_COOKIE = "patril_session";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type CookieReader = { get(name: string): { value: string } | undefined };

/** Current session cookie, falling back to the pre-rename name. */
export function readUserSessionCookie(store: CookieReader): string | undefined {
  return (
    store.get(USER_SESSION_COOKIE)?.value ??
    store.get(LEGACY_USER_SESSION_COOKIE)?.value
  );
}
