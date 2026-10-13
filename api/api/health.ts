import { withSecurityHeaders } from "../src/lib/security-headers.js";

export const runtime = "nodejs";

export function GET() {
  return Response.json(
    { ok: true, service: "homevibe-api" },
    { headers: withSecurityHeaders(new Headers()) }
  );
}
