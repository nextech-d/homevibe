import { secureHeaders } from "hono/secure-headers";

/**
 * Security headers for every API response. The API returns JSON, so its
 * Content-Security-Policy allows nothing and no framing.
 *
 * One definition, two forms: apiSecureHeaders() for the Hono app, and
 * SECURITY_HEADERS for the standalone health/login/me functions, which answer
 * outside it - so both carry the same headers.
 */
export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
};

export function apiSecureHeaders() {
  return secureHeaders({
    xContentTypeOptions: SECURITY_HEADERS["X-Content-Type-Options"],
    referrerPolicy: SECURITY_HEADERS["Referrer-Policy"],
    permissionsPolicy: { camera: [], microphone: [], geolocation: [] },
    xFrameOptions: SECURITY_HEADERS["X-Frame-Options"],
    strictTransportSecurity: SECURITY_HEADERS["Strict-Transport-Security"],
    contentSecurityPolicy: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
  });
}

/** Adds the security headers to a Headers object, for the standalone functions. */
export function withSecurityHeaders(headers: Headers): Headers {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  return headers;
}
