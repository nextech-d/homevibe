import { assertAdminJwtSecret, verifyAdminToken } from "../../../src/lib/admin-jwt.js";

export const runtime = "nodejs";

assertAdminJwtSecret();

function corsHeaders(req: Request): Headers {
  const origin = req.headers.get("origin") ?? "";
  const allowed =
    origin === "https://admin.homevibe.co.ke" ||
    origin === "https://homevibe.co.ke" ||
    origin === "http://localhost:5173" ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);
  const headers = new Headers();
  if (allowed) headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Vary", "Origin");
  return headers;
}

function bearer(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: Request) {
  const headers = corsHeaders(req);
  headers.set("Content-Type", "application/json");
  const token = bearer(req.headers.get("Authorization"));
  const valid = await verifyAdminToken(token ?? undefined);
  if (!valid) {
    return Response.json({ success: false, message: "Unauthorized." }, { status: 401, headers });
  }
  return Response.json({ success: true }, { headers });
}
