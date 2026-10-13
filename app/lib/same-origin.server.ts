import "server-only";

import { NextResponse } from "next/server";

/**
 * Guard for the storefront's cookie-authenticated writes (login, register,
 * logout, checkout, saved addresses). The session cookie is SameSite=Lax,
 * which already keeps it off most cross-site POSTs; this closes the rest:
 *
 * - Content-Type must be application/json. A cross-site page can't send
 *   that without a CORS preflight, which these routes never approve - so a
 *   plain form post from elsewhere is refused (415).
 * - Origin must be this site. Browsers always send it on these requests;
 *   missing, "null" or another host is refused (403).
 *
 * Returns the refusal, or null to carry on.
 */
export function rejectCrossSiteWrite(request: Request): NextResponse | null {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json\s*(;|$)/i.test(contentType)) {
    return NextResponse.json(
      { success: false, message: "Expected a JSON request." },
      { status: 415 }
    );
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let originHost: string | null = null;
  try {
    originHost = new URL(request.headers.get("origin") ?? "").host;
  } catch {
    originHost = null;
  }
  if (!host || !originHost || originHost !== host) {
    return NextResponse.json({ success: false, message: "Request refused." }, { status: 403 });
  }

  return null;
}
